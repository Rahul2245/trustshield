import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { UserModel } from '../src/modules/users/models/user.model';
import { PostModel } from '../src/modules/posts/models/post.model';
import { rabbitMQClient } from '../src/infrastructure/rabbitmq/connection';
import { logger } from '../src/infrastructure/logger/logger';
import { UserRole } from '../src/core/enums/user-role.enum';
import { randomUUID } from 'crypto';

async function runE2ETest() {
  try {
    logger.info('Starting E2E Spam Pipeline Test...');
    await mongoose.connect(env.MONGO_URI);
    await rabbitMQClient.connect();

    // Find any user to act as the spammer
    const user = await UserModel.findOne({ role: UserRole.USER });
    if (!user) throw new Error('No user found in DB');

    // Create a highly malicious spam post
    const spamContent = "URGENT! FREE CRYPTO AIRDROP CLICK HERE TO CLAIM 1000 USDT IMMEDIATELY!!! http://scam.phishing-crypto.link/airdrop";
    
    logger.info(`Simulating user ${user.email} posting: "${spamContent}"`);
    
    const post = new PostModel({
      content: spamContent,
      author: user._id,
      status: 'PENDING'
    });
    await post.save();

    // Push to RabbitMQ (Gateway -> AI Worker)
    logger.info('Publishing event to RabbitMQ: security.threat_analysis_queue');
    await rabbitMQClient.publishThreatEvent({
      eventId: post._id.toString(),
      correlationId: randomUUID(),
      eventType: 'NEW_POST',
      userId: user._id.toString(),
      email: user.email,
      ipAddress: '127.0.0.1',
      userAgent: 'E2E-Script',
      payload: {
        text: spamContent,
        metadata: { source: 'e2e_test' }
      },
      timestamp: new Date().toISOString()
    });

    logger.info('✅ Event published successfully. The AI Worker should consume it and trigger a webhook back to the Gateway.');
    logger.info('Check the Admin Dashboard to see the new critical alert broadcast via Socket.IO!');

    setTimeout(() => {
      process.exit(0);
    }, 2000);

  } catch (error) {
    logger.error(error as Error, 'E2E Test failed');
    process.exit(1);
  }
}

runE2ETest();
