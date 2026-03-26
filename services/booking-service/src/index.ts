import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { bookingRoutes } from './routes/booking.routes.js';
import { AppError, jwtGuard } from '@lerno/shared';
import { startOutboxRelay } from './workers/outbox.relay.js';

dotenv.config();

const server = Fastify({
  logger: true,
});

// Plugins
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
server.register(bookingRoutes, { prefix: '/api/v1/bookings' });

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
    const port = Number(process.env.PORT) || 3004;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Booking Service listening on port ${port}`);

    // Start background worker
    startOutboxRelay();

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
