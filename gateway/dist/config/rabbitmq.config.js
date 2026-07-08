"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitmqConfig = void 0;
const env_1 = require("./env");
exports.rabbitmqConfig = {
    url: env_1.env.RABBITMQ_URL,
    exchange: 'trustshield_exchange',
    exchangeType: 'topic',
    queues: {
        threatEvents: 'threat_events_queue'
    }
};
//# sourceMappingURL=rabbitmq.config.js.map