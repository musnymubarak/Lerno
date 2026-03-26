import { FastifyInstance } from 'fastify';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, getNotifications);
  fastify.patch('/:id/read', { preHandler: [fastify.authenticate] }, markAsRead);
  fastify.patch('/read-all', { preHandler: [fastify.authenticate] }, markAllAsRead);
}
