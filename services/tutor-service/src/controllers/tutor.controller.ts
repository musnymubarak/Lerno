import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../utils/prisma.js';
import { ApiResponse } from '@lerno/shared';

export const getTutors = async (request: FastifyRequest, reply: FastifyReply) => {
  const { subject, page = 1, limit = 10 } = request.query as any;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (subject) {
    where.tutorSubjects = {
      some: {
        subject: {
          name: {
            contains: subject,
            mode: 'insensitive',
          },
        },
      },
    };
  }

  // Note: This service currently only stores tutor-subject mappings and availability.
  // In a real application, you might need to combine this with User data from user-service
  // via an API call or event-driven data duplication.
  const tutors = await prisma.tutorSubject.findMany({
    where,
    skip: Number(skip),
    take: Number(limit),
    include: {
      subject: true,
    },
  });

  return ApiResponse.success(tutors);
};

export const getSubjects = async (request: FastifyRequest, reply: FastifyReply) => {
  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
  });

  return ApiResponse.success(subjects);
};

export const createSlot = async (request: FastifyRequest, reply: FastifyReply) => {
  const tutorId = (request.user as any).sub;
  const { startTime, endTime } = request.body as any;

  const slot = await prisma.timeSlot.create({
    data: {
      tutorId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    },
  });

  return reply.status(201).send(ApiResponse.success(slot, 'Time slot created successfully'));
};

export const addSubject = async (request: FastifyRequest, reply: FastifyReply) => {
  const tutorId = (request.user as any).sub;
  const { subjectId, customRate } = request.body as any;

  const tutorSubject = await prisma.tutorSubject.upsert({
    where: {
      tutorId_subjectId: {
        tutorId,
        subjectId,
      },
    },
    update: {
      customRate,
    },
    create: {
      tutorId,
      subjectId,
      customRate,
    },
  });

  return ApiResponse.success(tutorSubject, 'Subject added/updated successfully');
};
