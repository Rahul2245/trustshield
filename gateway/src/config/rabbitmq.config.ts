import { env } from "./env";

export const rabbitmqConfig = {
  url: env.RABBITMQ_URL,
  exchange: "trustshield.events",
  exchangeType: 'topic',
  
  queues: {
    threatEvents:"trustshield.threat.events"
    
  }
};
