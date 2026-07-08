import amqp, { Connection, Channel } from 'amqplib';
import { rabbitmqConfig } from '../../config/rabbitmq.config';

class RabbitMQClient {
  private connection: any = null;
  private channel: any = null;

  public async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(rabbitmqConfig.url);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange(rabbitmqConfig.exchange, rabbitmqConfig.exchangeType, { durable: true });
      await this.channel.assertQueue(rabbitmqConfig.queues.threatEvents, { durable: true });
      await this.channel.bindQueue(rabbitmqConfig.queues.threatEvents, rabbitmqConfig.exchange, 'threat.event');
      
      console.log('RabbitMQ connected and channel established');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  public async publishThreatEvent(payload: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    
    this.channel.publish(
      rabbitmqConfig.exchange, 
      'threat.event', 
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );
  }
}

export const rabbitMQClient = new RabbitMQClient();
