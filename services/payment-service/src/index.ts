import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyFormbody from '@fastify/formbody';
import dotenv from 'dotenv';
import { paymentRoutes } from './routes/payment.routes.js';
import { AppError, jwtGuard } from '@lerno/shared';
import { startOutboxRelay } from './workers/outbox.relay.js';

dotenv.config();

const server = Fastify({
  logger: true,
});

// Plugins
server.register(fastifyFormbody); // Required for PayHere x-www-form-urlencoded webhooks

server.register(fastifyJwt, {
  secret: process.env.JWT_ACCESS_SECRET || 'secret',
});

// Register jwtGuard
server.register(jwtGuard);

// Health Check
server.get('/health', async () => {
  return { status: 'OK' };
});

// Routes
server.register(paymentRoutes, { prefix: '/api/v1/payments' });

// Global Error Handler
server.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message,
      code: error.code,
    });
  }

  server.log.error(error);
  reply.status(500).send({
    success: false,
    message: 'Internal Server Error',
  });
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3005;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Payment Service listening on port ${port}`);

    // Start background worker
    startOutboxRelay();

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
