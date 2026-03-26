import { FastifyInstance } from 'fastify';
import { getMe, updateMe, getTutorMe, getUserInternal } from '../controllers/user.controller.js';
import { internalGuard } from '../middleware/internal.guard.js';

export async function userRoutes(fastify: FastifyInstance) {
  // Public-ish but JWT protected
  fastify.get('/me', { preHandler: [fastify.authenticate] }, getMe);
  fastify.put('/me', { preHandler: [fastify.authenticate] }, updateMe);
  
  // Specific Tutor route
  fastify.get('/tutors/me', { preHandler: [fastify.authenticate] }, getTutorMe);

  // Internal route (No JWT, internal secret only)
  fastify.get('/internal/:id', { preHandler: [internalGuard] }, getUserInternal);
}
