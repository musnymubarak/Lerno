import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../utils/prisma.js';
import { AppError, ApiResponse } from '@lerno/shared';

export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).sub;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      tutorProfile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return ApiResponse.success(user);
};

export const updateMe = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).sub;
  const { firstName, lastName, phone, fcmToken, photoUrl } = request.body as any;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      phone,
      fcmToken,
      photoUrl,
    },
  });

  return ApiResponse.success(updatedUser, 'Profile updated successfully');
};

export const getTutorMe = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).sub;

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!tutorProfile) {
    throw new AppError('Tutor profile not found', 404, 'TUTOR_PROFILE_NOT_FOUND');
  }

  return ApiResponse.success(tutorProfile);
};

export const getUserInternal = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return ApiResponse.success(user);
};
