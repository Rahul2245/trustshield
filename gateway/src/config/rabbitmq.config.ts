export const rabbitmqConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  exchange: 'trustshield_exchange',
  exchangeType: 'topic',
  queues: {
    threatEvents: 'threat_events_queue'
  }
};
