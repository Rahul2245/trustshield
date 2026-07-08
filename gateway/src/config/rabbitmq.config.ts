import { env } from "./env";

export const rabbitmqConfig = {
  url: env.RABBITMQ_URL,
  exchange: 'trustshield_exchange',
  exchangeType: 'topic',
  queues: {
    threatEvents: 'threat_events_queue'
  }
};
