import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '@lerno/shared';

export const internalGuard = async (request: FastifyRequest, reply: FastifyReply) => {
  const internalSecret = request.headers['x-internal-secret'];

  if (internalSecret !== process.env.INTERNAL_SECRET) {
    throw new AppError('Unauthorized internal request', 403, 'INTERNAL_UNAUTHORIZED');
  }
};
