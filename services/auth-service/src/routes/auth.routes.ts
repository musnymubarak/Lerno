import { FastifyInstance } from 'fastify';
import { register, login } from '../controllers/auth.controller.js';
import { validate } from '@lerno/shared';
import { z } from 'zod';

const registerSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
};

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', { preHandler: [validate(registerSchema)] }, register);
  fastify.post('/login', { preHandler: [validate(loginSchema)] }, login);
}
