import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../utils/prisma.js';
import { AppError, ApiResponse } from '@lerno/shared';
import axios from 'axios';

export const createReview = async (request: FastifyRequest, reply: FastifyReply) => {
  const studentId = (request.user as any).sub;
  const { bookingId, rating, comment } = request.body as any;

  // Verify booking status via internal call to booking-service
  try {
    const internalSecret = process.env.INTERNAL_SECRET;
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL;

    const response = await axios.get(`${bookingServiceUrl}/api/v1/bookings/internal/${bookingId}`, {
      headers: { 'x-internal-secret': internalSecret }
    });
    
    const booking = response.data.data;

    if (booking.studentId !== studentId) {
      throw new AppError('You can only review your own bookings', 403, 'FORBIDDEN');
    }

    if (booking.status !== 'COMPLETED') {
      throw new AppError('You can only review completed sessions', 400, 'INVALID_BOOKING_STATUS');
    }

    const review = await prisma.$transaction(async (tx: any) => {
      const newReview = await tx.review.create({
        data: {
          bookingId,
          studentId,
          tutorId: booking.tutorId,
          rating,
          comment,
        },
      });

      await tx.outbox.create({
        data: {
          eventType: 'review.created',
          payload: { reviewId: newReview.id, tutorId: booking.tutorId, rating },
        },
      });

      return newReview;
    });

    return reply.status(201).send(ApiResponse.success(review, 'Review submitted successfully'));
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('Unable to verify booking or submit review', 400, 'REVIEW_SUBMISSION_FAILED');
  }
};

export const getTutorReviews = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id: tutorId } = request.params as any;
  const { page = 1, limit = 10 } = request.query as any;

  const reviews = await prisma.review.findMany({
    where: { tutorId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: Number(limit),
  });

  const total = await prisma.review.count({ where: { tutorId } });

  return ApiResponse.success({ reviews, total, page: Number(page) });
};
