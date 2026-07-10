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

    const testCases = [
      {
        type: 'NORMAL',
        content: "Hey everyone! I just published a new article on React performance optimization. Let me know what you think!"
      },
      {
        type: 'PHISHING_SPAM',
        content: "URGENT! FREE CRYPTO AIRDROP CLICK HERE TO CLAIM 1000 USDT IMMEDIATELY!!! http://scam.phishing-crypto.link/airdrop"
      },
      {
        type: 'HATE_SPEECH',
        content: "I absolutely hate everyone from that country. They should all be kicked out. Disgusting people."
      }
    ];

    for (const testCase of testCases) {
      logger.info(`\n--- Running Test Case: ${testCase.type} ---`);
      logger.info(`Simulating user ${user.email} posting: "${testCase.content}"`);
      
      const post = new PostModel({
        content: testCase.content,
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
        requestId: `e2e-test-${testCase.type.toLowerCase()}`,
        metadata: {
          burstVelocity: 0,
          targetRecipientRatio: 0,
          uriHyperlinkDensity: 0,
          sessionDwellDuration: 0,
          payloadText: testCase.content,
        },
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ ${testCase.type} event published successfully.`);
      // Short delay between messages
      await new Promise(r => setTimeout(r, 1000));
    }

    logger.info('\n✅ All test events published. The AI Worker should consume them and trigger a webhook back to the Gateway for threats.');
    logger.info('Check the Admin Dashboard to see the new critical alerts broadcast via Socket.IO!');

    setTimeout(() => {
      process.exit(0);
    }, 3000);

  } catch (error) {
    logger.error(error as Error, 'E2E Test failed');
    process.exit(1);
  }
}

runE2ETest();
