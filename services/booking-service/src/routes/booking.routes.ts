import { FastifyInstance } from 'fastify';
import { createBooking, listBookings, confirmBooking, getBookingInternal } from '../controllers/booking.controller.js';
import { internalGuard } from '../utils/internal-guard.js';

export async function bookingRoutes(fastify: FastifyInstance) {
  // Protected routes (JWT)
  fastify.post('/', { preHandler: [fastify.authenticate] }, createBooking);
  fastify.get('/', { preHandler: [fastify.authenticate] }, listBookings);
  fastify.patch('/:id/confirm', { preHandler: [fastify.authenticate] }, confirmBooking);

  // Internal route (No JWT, internal secret only)
  fastify.get('/internal/:id', { preHandler: [internalGuard] }, getBookingInternal);
}
