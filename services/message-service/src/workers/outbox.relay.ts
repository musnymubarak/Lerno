import amqp from 'amqplib';
import prisma from '../utils/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'message.events';
const INTERVAL_MS = 5000;

let channel: amqp.Channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('✅ Connected to RabbitMQ (Message Service)');
  } catch (error) {
    console.error('❌ RabbitMQ connection failed', error);
  }
};

const relayEvents = async () => {
  if (!channel) return;
  const events = await prisma.outbox.findMany({
    where: { status: 'PENDING' },
    take: 10,
    orderBy: { createdAt: 'asc' },
  });
  if (events.length === 0) return;
  for (const event of events) {
    try {
      channel.publish(EXCHANGE_NAME, event.eventType, Buffer.from(JSON.stringify(event.payload)), { persistent: true });
      await prisma.outbox.update({ where: { id: event.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    } catch (error) {
      console.error(`❌ Failed to relay message event ${event.id}`, error);
      await prisma.outbox.update({ where: { id: event.id }, data: { status: 'FAILED', retryCount: { increment: 1 } } });
    }
  }
};

export const startOutboxRelay = async () => {
  await connectRabbitMQ();
  setInterval(async () => {
    try { await relayEvents(); } catch (error) {}
  }, INTERVAL_MS);
};
