import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../formatters/api-response.js';

export const validate = (schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (schema.body) {
        request.body = schema.body.parse(request.body);
      }
      if (schema.params) {
        request.params = schema.params.parse(request.params);
      }
      if (schema.query) {
        request.query = schema.query.parse(request.query);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send(
          ApiResponse.error(
            'Validation failed',
            'VALIDATION_ERROR'
          )
        );
      }
      throw error;
    }
  };
};
