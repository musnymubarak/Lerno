import amqp from 'amqplib';
import prisma from '../utils/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL!;
const EXCHANGE_NAME = 'payment.events';
const INTERVAL_MS = 5000;

let channel: amqp.Channel;

const connectRabbitMQ = async () => {
  try {
    const host = RABBITMQ_URL.split('@')[1] ?? RABBITMQ_URL;
    console.log(`🔌 [payment-service] Connecting to RabbitMQ at: ${host}`);
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('✅ [payment-service] Connected to RabbitMQ');
  } catch (error) {
    console.error('❌ [payment-service] RabbitMQ connection failed', error);
    process.exit(1);
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

  console.log(`📡 Relaying ${events.length} events to RabbitMQ...`);

  for (const event of events) {
    try {
      const routingKey = event.eventType;
      const isSent = channel.publish(
        EXCHANGE_NAME,
        routingKey,
        Buffer.from(JSON.stringify(event.payload)),
        { persistent: true }
      );

      if (isSent) {
        await prisma.outbox.update({
          where: { id: event.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error(`❌ Failed to relay event ${event.id}`, error);
      await prisma.outbox.update({
        where: { id: event.id },
        data: {
          status: 'FAILED',
          retryCount: { increment: 1 },
        },
      });
    }
  }
};

export const startOutboxRelay = async () => {
  await connectRabbitMQ();

  setInterval(async () => {
    try {
      await relayEvents();
    } catch (error) {
      console.error('❌ Error in relay loop', error);
    }
  }, INTERVAL_MS);
};
