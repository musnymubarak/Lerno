import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../utils/prisma.js';
import { AppError, ApiResponse } from '@lerno/shared';
import axios from 'axios';

export const createBooking = async (request: FastifyRequest, reply: FastifyReply) => {
  const studentId = (request.user as any).sub;
  const { tutorId, subjectId, timeSlotId, sessionType, notes } = request.body as any;

  // Validate existence of the timeslot in the tutor-service
  try {
    // In a real scenario, this would check and lock the slot.
    // For now, we simulate success if the tutor-service is reachable.
    const internalSecret = process.env.INTERNAL_SECRET;
    const tutorServiceUrl = process.env.TUTOR_SERVICE_URL;

    // This is a placeholder for a real slot verification endpoint.
    // await axios.get(`${tutorServiceUrl}/api/v1/internal/slots/${timeSlotId}`, {
    //   headers: { 'x-internal-secret': internalSecret }
    // });
  } catch (err) {
    throw new AppError('Unable to verify time slot', 400, 'SLOT_VERIFICATION_FAILED');
  }

  // Calculate total amount (Mock calculation: Hourly rate from tutorProfile * duration)
  // For simplicity, we'll use a fixed amount for now.
  const totalAmount = 50.00; 

  const booking = await prisma.$transaction(async (tx) => {
    const newBooking = await tx.booking.create({
      data: {
        studentId,
        tutorId,
        subjectId,
        timeSlotId,
        sessionType,
        totalAmount,
        notes,
      },
    });

    await tx.outbox.create({
      data: {
        eventType: 'booking.created',
        payload: { bookingId: newBooking.id, studentId, tutorId },
      },
    });

    return newBooking;
  });

  return reply.status(201).send(ApiResponse.success(booking, 'Booking created successfully'));
};

export const listBookings = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).sub;
  const role = (request.user as any).role;

  const where: any = {};
  if (role === 'TUTOR') {
    where.tutorId = userId;
  } else {
    where.studentId = userId;
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return ApiResponse.success(bookings);
};

export const confirmBooking = async (request: FastifyRequest, reply: FastifyReply) => {
  const tutorId = (request.user as any).sub;
  const role = (request.user as any).role;
  const { id } = request.params as any;

  if (role !== 'TUTOR') {
    throw new AppError('Only tutors can confirm bookings', 403, 'FORBIDDEN');
  }

  const booking = await prisma.booking.findFirst({
    where: { id, tutorId },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  if (booking.status !== 'PENDING') {
    throw new AppError(`Cannot confirm a booking with status: ${booking.status}`, 400, 'INVALID_STATUS');
  }

  const meetingLink = `https://meet.jit.si/lerno-${booking.id.slice(0, 8)}`;

  const updatedBooking = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        meetingLink,
      },
    });

    await tx.outbox.create({
      data: {
        eventType: 'booking.confirmed',
        payload: { bookingId: b.id, meetingLink },
      },
    });

    return b;
  });

  return ApiResponse.success(updatedBooking, 'Booking confirmed successfully');
};

export const getBookingInternal = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any;

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  return ApiResponse.success(booking);
};
