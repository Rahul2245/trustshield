import amqp, { ChannelModel, ConfirmChannel } from 'amqplib';
import { rabbitmqConfig } from '../../config/rabbitmq.config';
import { logger } from '../logger/logger';
import { ThreatEvent } from '../../shared/events/threat-event.interface';

class RabbitMQClient {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private isConnecting: boolean = false;
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 5;

  public async connect(): Promise<void> {
    if (this.isConnecting || this.connection) return;
    this.isConnecting = true;

    try {
      const urlWithHeartbeat = rabbitmqConfig.url.includes('?') 
        ? `${rabbitmqConfig.url}&heartbeat=60` 
        : `${rabbitmqConfig.url}?heartbeat=60`;

      this.connection = await amqp.connect(urlWithHeartbeat);

      this.connection.on('error', (err: Error) => {
        logger.error(err, 'RabbitMQ Connection Error');
        this.reconnect();
      });

      this.connection.on('close', (err?: Error) => {
        logger.warn('RabbitMQ Connection Closed');
        this.reconnect();
      });

      this.channel = await this.connection.createConfirmChannel();

      // Dead Letter Exchange and Queue
      const dlxExchange = `${rabbitmqConfig.exchange}.dlx`;
      const dlqQueue = `${rabbitmqConfig.queues.threatEvents}.dlq`;

      await this.channel.assertExchange(dlxExchange, 'topic', { durable: true });
      await this.channel.assertQueue(dlqQueue, { durable: true });
      await this.channel.bindQueue(dlqQueue, dlxExchange, '#');

      // Main Exchange and Queue
      await this.channel.assertExchange(rabbitmqConfig.exchange, rabbitmqConfig.exchangeType, { durable: true });
      await this.channel.assertQueue(rabbitmqConfig.queues.threatEvents, { 
        durable: true,
        arguments: {
          'x-dead-letter-exchange': dlxExchange,
          'x-dead-letter-routing-key': dlqQueue
        }
      });
      await this.channel.bindQueue(rabbitmqConfig.queues.threatEvents, rabbitmqConfig.exchange, 'threat.event');

      logger.info('RabbitMQ connected and topology established successfully');
      this.retryCount = 0;
      this.isConnecting = false;
    } catch (error) {
      logger.error(error as Error, 'Failed to connect to RabbitMQ');
      this.isConnecting = false;
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.retryCount >= this.MAX_RETRIES) {
      logger.fatal('Max retries reached for RabbitMQ. Exiting...');
      process.exit(1);
    }
    
    this.connection = null;
    this.channel = null;
    this.retryCount++;
    const delay = Math.pow(2, this.retryCount) * 1000;
    
    logger.info(`Reconnecting to RabbitMQ in ${delay}ms... (Attempt ${this.retryCount})`);
    setTimeout(() => {
      this.connect().catch((err) => logger.error(err, 'Reconnect failed'));
    }, delay);
  }

  public async publishThreatEvent(event: ThreatEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    return new Promise((resolve, reject) => {
      this.channel!.publish(
        rabbitmqConfig.exchange,
        'threat.event',
        Buffer.from(JSON.stringify(event)),
        { 
          persistent: true,
          messageId: event.eventId,
          correlationId: event.correlationId,
          timestamp: new Date(event.timestamp).getTime()
        },
        (err: any) => {
          if (err) {
            logger.error({ err, eventId: event.eventId }, 'Message nacked by broker');
            reject(err);
          } else {
            logger.info({ eventId: event.eventId }, 'Message confirmed by broker');
            resolve();
          }
        }
      );
    });
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      logger.info('RabbitMQ disconnected gracefully');
    } catch (error) {
      logger.error(error as Error, 'Error closing RabbitMQ connection');
    }
  }
}

export const rabbitMQClient = new RabbitMQClient();
