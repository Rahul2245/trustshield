"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitmqConfig = void 0;
const env_1 = require("./env");
exports.rabbitmqConfig = {
    url: env_1.env.RABBITMQ_URL,
    exchange: "trustshield.events",
    exchangeType: 'topic',
    queues: {
        threatEvents: "trustshield.threat.events"
    }
};
//# sourceMappingURL=rabbitmq.config.js.map