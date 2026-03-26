import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export interface JwtGuardOptions {
  // Define options if needed
}

const jwtGuardPlugin: FastifyPluginAsync<JwtGuardOptions> = async (fastify, options) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Stub for JWT verification logic
      // In a real scenario, you'd use @fastify/jwt
      // await request.jwtVerify();
      fastify.log.info('JWT Guard check stub');
    } catch (err) {
      reply.status(401).send({
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }
  });
};

export const jwtGuard = fp(jwtGuardPlugin);

// Extend FastifyInstance type to include 'authenticate'
declare module 'fastify' {
  export interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}
