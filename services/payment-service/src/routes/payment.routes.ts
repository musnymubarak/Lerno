import { FastifyInstance } from 'fastify';
import { initiatePayment, handlePayHereNotify, getPaymentStatus } from '../controllers/payment.controller.js';

export async function paymentRoutes(fastify: FastifyInstance) {
  // Protected routes
  fastify.post('/initiate', { preHandler: [fastify.authenticate] }, initiatePayment);
  fastify.get('/:bookingId', { preHandler: [fastify.authenticate] }, getPaymentStatus);

  // Public Webhook route (Payload validated via MD5 Hash signature)
  // PayHere sends urlencoded data, we need fastify-formbody registered in index
  fastify.post('/notify', handlePayHereNotify);
}
