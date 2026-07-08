"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitMQClient = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const rabbitmq_config_1 = require("../../config/rabbitmq.config");
const logger_1 = require("../logger/logger");
class RabbitMQClient {
    connection = null;
    channel = null;
    isConnecting = false;
    retryCount = 0;
    MAX_RETRIES = 5;
    async connect() {
        if (this.isConnecting || this.connection)
            return;
        this.isConnecting = true;
        try {
            const urlWithHeartbeat = rabbitmq_config_1.rabbitmqConfig.url.includes('?')
                ? `${rabbitmq_config_1.rabbitmqConfig.url}&heartbeat=60`
                : `${rabbitmq_config_1.rabbitmqConfig.url}?heartbeat=60`;
            this.connection = await amqplib_1.default.connect(urlWithHeartbeat);
            this.connection.on('error', (err) => {
                logger_1.logger.error(err, 'RabbitMQ Connection Error');
                this.reconnect();
            });
            this.connection.on('close', (err) => {
                logger_1.logger.warn('RabbitMQ Connection Closed');
                this.reconnect();
            });
            this.channel = await this.connection.createConfirmChannel();
            // Dead Letter Exchange and Queue
            const dlxExchange = `${rabbitmq_config_1.rabbitmqConfig.exchange}.dlx`;
            const dlqQueue = `${rabbitmq_config_1.rabbitmqConfig.queues.threatEvents}.dlq`;
            await this.channel.assertExchange(dlxExchange, 'topic', { durable: true });
            await this.channel.assertQueue(dlqQueue, { durable: true });
            await this.channel.bindQueue(dlqQueue, dlxExchange, '#');
            // Main Exchange and Queue
            await this.channel.assertExchange(rabbitmq_config_1.rabbitmqConfig.exchange, rabbitmq_config_1.rabbitmqConfig.exchangeType, { durable: true });
            await this.channel.assertQueue(rabbitmq_config_1.rabbitmqConfig.queues.threatEvents, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': dlxExchange,
                    'x-dead-letter-routing-key': dlqQueue
                }
            });
            await this.channel.bindQueue(rabbitmq_config_1.rabbitmqConfig.queues.threatEvents, rabbitmq_config_1.rabbitmqConfig.exchange, 'threat.event');
            logger_1.logger.info('RabbitMQ connected and topology established successfully');
            this.retryCount = 0;
            this.isConnecting = false;
        }
        catch (error) {
            logger_1.logger.error(error, 'Failed to connect to RabbitMQ');
            this.isConnecting = false;
            this.reconnect();
        }
    }
    reconnect() {
        if (this.retryCount >= this.MAX_RETRIES) {
            logger_1.logger.fatal('Max retries reached for RabbitMQ. Exiting...');
            process.exit(1);
        }
        this.connection = null;
        this.channel = null;
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000;
        logger_1.logger.info(`Reconnecting to RabbitMQ in ${delay}ms... (Attempt ${this.retryCount})`);
        setTimeout(() => {
            this.connect().catch((err) => logger_1.logger.error(err, 'Reconnect failed'));
        }, delay);
    }
    async publishThreatEvent(event) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }
        return new Promise((resolve, reject) => {
            this.channel.publish(rabbitmq_config_1.rabbitmqConfig.exchange, 'threat.event', Buffer.from(JSON.stringify(event)), {
                persistent: true,
                messageId: event.eventId,
                correlationId: event.correlationId,
                timestamp: new Date(event.timestamp).getTime()
            }, (err) => {
                if (err) {
                    logger_1.logger.error({ err, eventId: event.eventId }, 'Message nacked by broker');
                    reject(err);
                }
                else {
                    logger_1.logger.info({ eventId: event.eventId }, 'Message confirmed by broker');
                    resolve();
                }
            });
        });
    }
    async disconnect() {
        try {
            if (this.channel)
                await this.channel.close();
            if (this.connection)
                await this.connection.close();
            logger_1.logger.info('RabbitMQ disconnected gracefully');
        }
        catch (error) {
            logger_1.logger.error(error, 'Error closing RabbitMQ connection');
        }
    }
}
exports.rabbitMQClient = new RabbitMQClient();
//# sourceMappingURL=connection.js.map