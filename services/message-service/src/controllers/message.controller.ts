import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../utils/prisma.js';
import { AppError, ApiResponse } from '@lerno/shared';
import axios from 'axios';

export const createMessage = async (request: FastifyRequest, reply: FastifyReply) => {
  const senderId = (request.user as any).sub;
  const { bookingId, recipientId, content } = request.body as any;

  // Verify booking and participation via internal call
  try {
    const internalSecret = process.env.INTERNAL_SECRET;
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL;

    const response = await axios.get(`${bookingServiceUrl}/api/v1/bookings/internal/${bookingId}`, {
      headers: { 'x-internal-secret': internalSecret }
    });
    
    const booking = response.data.data;

    const isParticipant = booking.studentId === senderId || booking.tutorId === senderId;
    if (!isParticipant) {
      throw new AppError('You are not a participant in this booking', 403, 'FORBIDDEN');
    }

    const message = await prisma.$transaction(async (tx: any) => {
      const newMessage = await tx.message.create({
        data: {
          bookingId,
          senderId,
          recipientId,
          content,
        },
      });

      await tx.outbox.create({
        data: {
          eventType: 'message.sent',
          payload: { messageId: newMessage.id, recipientId, senderId, bookingId },
        },
      });

      return newMessage;
    });

    return reply.status(201).send(ApiResponse.success(message, 'Message sent'));
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('Unable to send message', 400, 'MESSAGE_SEND_FAILED');
  }
};

export const getMessagesByBooking = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).sub;
  const { bookingId } = request.params as any;

  // Mark all unread messages for this user in this booking as read
  await prisma.message.updateMany({
    where: { bookingId, recipientId: userId, isRead: false },
    data: { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'asc' },
  });

  return ApiResponse.success(messages);
};
