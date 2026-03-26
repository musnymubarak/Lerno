import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../utils/prisma.js';
import { ApiResponse } from '@lerno/shared';

export const getNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).sub;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return ApiResponse.success({ notifications, unreadCount });
};

export const markAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).sub;
  const { id } = request.params as any;

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  return ApiResponse.success(null, 'Notification marked as read');
};

export const markAllAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).sub;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return ApiResponse.success(null, 'All notifications marked as read');
};
