"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitMQClient = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const rabbitmq_config_1 = require("../../config/rabbitmq.config");
class RabbitMQClient {
    connection = null;
    channel = null;
    async connect() {
        try {
            this.connection = await amqplib_1.default.connect(rabbitmq_config_1.rabbitmqConfig.url);
            this.channel = await this.connection.createChannel();
            await this.channel.assertExchange(rabbitmq_config_1.rabbitmqConfig.exchange, rabbitmq_config_1.rabbitmqConfig.exchangeType, { durable: true });
            await this.channel.assertQueue(rabbitmq_config_1.rabbitmqConfig.queues.threatEvents, { durable: true });
            await this.channel.bindQueue(rabbitmq_config_1.rabbitmqConfig.queues.threatEvents, rabbitmq_config_1.rabbitmqConfig.exchange, 'threat.event');
            console.log('RabbitMQ connected and channel established');
        }
        catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
            throw error;
        }
    }
    async publishThreatEvent(payload) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }
        this.channel.publish(rabbitmq_config_1.rabbitmqConfig.exchange, 'threat.event', Buffer.from(JSON.stringify(payload)), { persistent: true });
    }
}
exports.rabbitMQClient = new RabbitMQClient();
//# sourceMappingURL=connection.js.map