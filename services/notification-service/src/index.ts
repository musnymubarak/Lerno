import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { notificationRoutes } from './routes/notification.routes.js';
import { AppError, jwtGuard } from '@lerno/shared';
import { startEventSubscriber } from './workers/event.subscriber.js';

dotenv.config();

const server = Fastify({
  logger: true,
});

server.register(fastifyJwt, {
  secret: process.env.JWT_ACCESS_SECRET || 'secret',
});

server.register(jwtGuard);

server.get('/health', async () => ({ status: 'OK' }));

server.register(notificationRoutes, { prefix: '/api/v1/notifications' });

server.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
  server.log.error(error);
  reply.status(500).send({ success: false, message: 'Internal Server Error' });
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3006;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Notification Service listening on port ${port}`);

    // Start consuming events
    startEventSubscriber();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
