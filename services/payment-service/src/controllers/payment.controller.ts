import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../utils/prisma.js';
import { AppError, ApiResponse } from '@lerno/shared';
import axios from 'axios';
import crypto from 'crypto';
import { generatePayHereHash, verifyPayHereCallback } from '../utils/payhere.util.js';

export const initiatePayment = async (request: FastifyRequest, reply: FastifyReply) => {
  const payerId = (request.user as any).sub;
  const role = (request.user as any).role;
  const { bookingId } = request.body as any;

  if (role !== 'STUDENT') {
    throw new AppError('Only students can initiate payments', 403, 'FORBIDDEN');
  }

  // Look up booking details
  let bookingData;
  try {
    const internalSecret = process.env.INTERNAL_SECRET;
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL;

    const response = await axios.get(`${bookingServiceUrl}/api/v1/bookings/internal/${bookingId}`, {
      headers: { 'x-internal-secret': internalSecret }
    });
    bookingData = response.data.data;
  } catch (err) {
    throw new AppError('Unable to fetch booking details', 400, 'BOOKING_FETCH_FAILED');
  }

  if (bookingData.studentId !== payerId) {
    throw new AppError('You can only pay for your own bookings', 403, 'FORBIDDEN');
  }

  // Check if a payment already exists
  const existingPayment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (existingPayment && existingPayment.status === 'COMPLETED') {
    throw new AppError('This booking is already paid', 400, 'ALREADY_PAID');
  }

  const amount = Number(bookingData.totalAmount);
  const currency = 'LKR';
  // Generate a unique order ID for PayHere
  const payhereOrderId = `ORD-${bookingId.slice(0, 8)}-${crypto.randomBytes(4).toString('hex')}`;

  const paymentRecord = await prisma.$transaction(async (tx: any) => {
    const payment = await tx.payment.upsert({
      where: { bookingId },
      update: {
        payhereOrderId,
        amount,
        status: 'INITIATED',
      },
      create: {
        bookingId,
        payerId,
        amount,
        payhereOrderId,
        status: 'INITIATED',
      },
    });

    await tx.outbox.create({
      data: {
        eventType: 'payment.initiated',
        payload: { paymentId: payment.id, bookingId, payhereOrderId },
      },
    });

    return payment;
  });

  // Prepare frontend payload
  const merchantId = process.env.PAYHERE_MERCHANT_ID!;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;
  const hash = generatePayHereHash(merchantId, payhereOrderId, amount, currency, merchantSecret);

  const payherePayload = {
    merchant_id: merchantId,
    return_url: 'http://localhost:3000/payments/success',
    cancel_url: 'http://localhost:3000/payments/cancel',
    notify_url: 'http://localhost:3000/api/v1/payments/notify', // Gateway route
    order_id: payhereOrderId,
    items: `Tutoring Session ${bookingId}`,
    currency,
    amount: amount.toFixed(2),
    first_name: 'Student', // In real app, fetch from User service
    last_name: 'Name',
    email: 'student@example.com',
    phone: '0771234567',
    address: '123 Main St',
    city: 'Colombo',
    country: 'Sri Lanka',
    hash,
  };

  return ApiResponse.success({ payment: paymentRecord, payherePayload }, 'Payment initiated');
};

export const handlePayHereNotify = async (request: FastifyRequest, reply: FastifyReply) => {
  // PayHere sends data as application/x-www-form-urlencoded
  const payload = request.body as any;

  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
    payment_id,
    method
  } = payload;

  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;

  const isValid = verifyPayHereCallback(
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
    merchantSecret
  );

  if (!isValid) {
    // Silently ignore invalid signatures to prevent retries, but don't touch DB
    return reply.status(200).send('Invalid signature');
  }

  const payment = await prisma.payment.findUnique({
    where: { payhereOrderId: order_id }
  });

  if (!payment) {
    // Acknowledge but ignore unknown orders
    return reply.status(200).send('Order not found');
  }

  // status_code 2 means success in PayHere
  const newStatus = Number(status_code) === 2 ? 'COMPLETED' : 'FAILED';
  const outboxEvent = newStatus === 'COMPLETED' ? 'payment.completed' : 'payment.failed';

  await prisma.$transaction(async (tx: any) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        payhereRef: payment_id,
        method: method,
        notifyPayload: payload,
      },
    });

    await tx.outbox.create({
      data: {
        eventType: outboxEvent,
        payload: { paymentId: payment.id, bookingId: payment.bookingId, status: newStatus },
      },
    });
  });

  // Always return 200 OK so PayHere knows we received it
  return reply.status(200).send('OK');
};

export const getPaymentStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  const { bookingId } = request.params as any;
  const userId = (request.user as any).sub;

  const payment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404, 'NOT_FOUND');
  }

  if (payment.payerId !== userId) {
    throw new AppError('Unauthorized', 403, 'FORBIDDEN');
  }

  return ApiResponse.success(payment);
};
