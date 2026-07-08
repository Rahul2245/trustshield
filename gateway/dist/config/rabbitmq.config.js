"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitmqConfig = void 0;
exports.rabbitmqConfig = {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: 'trustshield_exchange',
    exchangeType: 'topic',
    queues: {
        threatEvents: 'threat_events_queue'
    }
};
//# sourceMappingURL=rabbitmq.config.js.map