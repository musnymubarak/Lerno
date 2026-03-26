import amqp from 'amqplib';
import prisma from '../utils/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL!;
const EXCHANGES = ['user.events', 'booking.events', 'payment.events'];
const QUEUE_NAME = 'notification_service_queue';

export const startEventSubscriber = async () => {
  try {
    const host = RABBITMQ_URL.split('@')[1] ?? RABBITMQ_URL;
    console.log(`🔌 [notification-service] Connecting to RabbitMQ at: ${host}`);
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    for (const exchange of EXCHANGES) {
      await channel.assertExchange(exchange, 'topic', { durable: true });
      // Bind to all routing keys in these exchanges
      await channel.bindQueue(QUEUE_NAME, exchange, '#');
    }

    console.log(`🔔 Notification Subscriber listening on queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      const payload = JSON.parse(msg.content.toString());

      console.log(`📩 Received event: ${routingKey}`);

      try {
        let title = '';
        let body = '';
        let userId = '';

        // Handle different event types
        switch (routingKey) {
          case 'user.registered':
            userId = payload.userId;
            title = 'Welcome to Lerno!';
            body = 'Your account has been successfully created.';
            break;
          case 'booking.created':
            userId = payload.tutorId; // Notify tutor
            title = 'New Booking Request';
            body = `A student has requested a booking.`;
            break;
          case 'booking.confirmed':
            userId = payload.studentId || payload.payload?.studentId; // This depends on how exactly the payload is structured in previous phases
            // Actually, in Phase 4 booking.confirmed payload was { bookingId, meetingLink }
            // We might need to fetch studentId from booking-service or include it in event
            title = 'Booking Confirmed!';
            body = `Your tutor has confirmed your booking. Meeting link: ${payload.meetingLink}`;
            break;
          case 'payment.completed':
            userId = payload.payerId || payload.payload?.payerId;
            title = 'Payment Successful';
            body = `Your payment for booking ${payload.bookingId} was successful.`;
            break;
        }

        if (userId) {
          await prisma.notification.create({
            data: {
              userId,
              title,
              body,
              type: routingKey,
            },
          });
        }

        channel.ack(msg);
      } catch (error) {
        console.error('❌ Error processing notification:', error);
        // Negative ack with requeue if it's potentially transient
        channel.nack(msg, false, true);
      }
    });
  } catch (error) {
    console.error('❌ Notification Subscriber failed to start:', error);
  }
};
