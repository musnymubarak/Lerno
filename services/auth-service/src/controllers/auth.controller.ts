import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import redis from '../utils/redis.js';
import { AppError, ApiResponse } from '@lerno/shared';

export const register = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password, firstName, lastName, phone } = request.body as any;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User already exists', 400, 'USER_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${email}`, otp, 'EX', 600); // 10 minutes

  // Use a transaction for creating user and outbox event
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
      },
    });

    await tx.outbox.create({
      data: {
        eventType: 'user.registered',
        payload: { userId: newUser.id, email: newUser.email },
      },
    });

    return newUser;
  });

  return reply.status(201).send(ApiResponse.success({ userId: user.id }, 'User registered successfully'));
};

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = request.body as any;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Generate Access Token (JWT)
  const accessToken = request.server.jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    { expiresIn: '15m' }
  );

  // Generate Refresh Token
  const rawRefreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Set Refresh Token in Cookie
  reply.setCookie('refreshToken', rawRefreshToken, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });

  return ApiResponse.success({ accessToken }, 'Login successful');
};
