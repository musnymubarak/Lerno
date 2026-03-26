import { FastifyInstance } from 'fastify';
import { createReview, getTutorReviews } from '../controllers/review.controller.js';

export async function reviewRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [fastify.authenticate] }, createReview);
  fastify.get('/tutors/:id', getTutorReviews);
}
