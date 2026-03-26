import { FastifyInstance } from 'fastify';
import { 
  getTutors, 
  getSubjects, 
  createSlot, 
  addSubject 
} from '../controllers/tutor.controller.js';

export async function tutorRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get('/tutors', getTutors);
  fastify.get('/subjects', getSubjects);

  // Protected routes (JWT)
  fastify.post('/tutors/me/slots', { preHandler: [fastify.authenticate] }, createSlot);
  fastify.post('/tutors/me/subjects', { preHandler: [fastify.authenticate] }, addSubject);
}
