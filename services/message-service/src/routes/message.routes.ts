import { FastifyInstance } from 'fastify';
import { createMessage, getMessagesByBooking } from '../controllers/message.controller.js';

export async function messageRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [fastify.authenticate] }, createMessage);
  fastify.get('/:bookingId', { preHandler: [fastify.authenticate] }, getMessagesByBooking);
}
