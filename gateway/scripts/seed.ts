import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { UserModel } from '../src/modules/users/models/user.model';
import { PostModel } from '../src/modules/posts/models/post.model';
import { CommentModel } from '../src/modules/comments/models/comment.model';
import { OrganizationModel } from '../src/modules/organizations/models/organization.model';
import { AuditLogModel } from '../src/modules/audit/models/audit-log.model';
import { logger } from '../src/infrastructure/logger/logger';
import { rabbitMQClient } from '../src/infrastructure/rabbitmq/connection';

const generateSeedData = async () => {
  logger.info('Connecting to MongoDB for Full Phase 10 Seeding...');
  await mongoose.connect(env.MONGO_URI);
  logger.info('Connected.');

  logger.info('Clearing existing collections...');
  await UserModel.deleteMany({});
  await PostModel.deleteMany({});
  await CommentModel.deleteMany({});
  await OrganizationModel.deleteMany({});
  await AuditLogModel.deleteMany({});
  
  // 1. Create Admins & Users (Total: 100)
  logger.info('Creating 100 Realistic Users and Admins...');
  const users = [];
  
  // Specific Admins
  const adminRoles = ['SUPER_ADMIN', 'SECURITY_ADMIN', 'MODERATOR', 'ORG_MANAGER'];
  for (const role of adminRoles) {
    const admin = new UserModel({
      email: `${role.toLowerCase()}@trustshield.io`,
      password: 'securepassword123',
      role: role,
      status: 'ACTIVE',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`,
      bio: `Official system ${role}.`
    });
    await admin.save();
    users.push(admin);
  }

  // Regular Users
  for (let i = 0; i < 96; i++) {
    const user = new UserModel({
      email: `user${i}@community.org`,
      password: 'password123',
      role: 'USER',
      status: 'ACTIVE',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
      bio: 'Open source contributor and community member.'
    });
    await user.save();
    users.push(user);
  }

  // 2. Create Organizations (Total: 20)
  logger.info('Creating 20 Organizations...');
  const orgNames = [
    'Open Source Club', 'AI Research Hub', 'Cyber Security Group', 'Machine Learning Society', 
    'Web Developers Network', 'DevOps Community', 'Data Science Forum', 'Robotics Club', 
    'Blockchain Developers', 'Cloud Computing Hub', 'React Enthusiasts', 'Python Foundation', 
    'Rustaceans', 'Golang Gophers', 'Linux Foundation', 'Kubernetes Admins', 
    'Game Dev Hub', 'UI/UX Designers', 'Data Engineers', 'Ethical Hackers'
  ];
  
  for (let i = 0; i < 20; i++) {
    const orgOwner = users[Math.floor(Math.random() * users.length)];
    const org = new OrganizationModel({
      name: orgNames[i],
      description: `Official community for ${orgNames[i]} professionals.`,
      ownerId: orgOwner._id,
      isVerified: i < 5, // First 5 are verified
      memberCount: Math.floor(Math.random() * 5000) + 100
    });
    await org.save();
  }

  // 3. System & Audit Logs
  logger.info('Generating Authentication & Security Logs...');
  for (let i = 0; i < 50; i++) {
    const log = new AuditLogModel({
      eventType: i % 10 === 0 ? 'LOGIN_FAILED' : 'LOGIN_SUCCESS',
      severity: i % 10 === 0 ? 'WARNING' : 'INFO',
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      metadata: { browser: 'Chrome', os: 'Linux' }
    });
    await log.save();
  }

  // 4. Posts & Comments with AI integration
  logger.info('Creating Posts & Threaded Comments (Triggering AI Worker Pipeline)...');
  await rabbitMQClient.connect();

  for (let i = 0; i < 200; i++) {
    const author = users[Math.floor(Math.random() * users.length)];
    const isSuspicious = i % 15 === 0;
    const content = isSuspicious 
      ? `Click here to download free hacked software! http://malicious.link/?id=${i}` 
      : `Discussing the latest trends in technology and open source development. Topic #${i}`;

    const post = new PostModel({
      content,
      author: author._id,
      status: 'PENDING'
    });
    await post.save();

    // Push to RabbitMQ for AI validation to simulate realistic traffic
    await rabbitMQClient.publishMessage('security.threat_analysis_queue', {
      event_id: post._id.toString(),
      event_type: 'new_post',
      user_id: author._id.toString(),
      payload_text: content,
      timestamp: new Date().toISOString()
    });

    // Add comments
    for (let j = 0; j < 3; j++) {
      const commenter = users[Math.floor(Math.random() * users.length)];
      const commentContent = isSuspicious 
        ? "This looks like a scam."
        : "Great insight! Thanks for sharing this topic.";

      const comment = new CommentModel({
        content: commentContent,
        author: commenter._id,
        post: post._id,
        status: 'PENDING'
      });
      await comment.save();

      await rabbitMQClient.publishMessage('security.threat_analysis_queue', {
        event_id: comment._id.toString(),
        event_type: 'new_comment',
        user_id: commenter._id.toString(),
        payload_text: commentContent,
        timestamp: new Date().toISOString()
      });
    }
  }

  logger.info('Phase 10 Seeding complete! 100 Users, 20 Orgs, Logs, and hundreds of Posts seeded successfully.');
  process.exit(0);
};

generateSeedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
