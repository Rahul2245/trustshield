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
  const adminRoles = ['SUPER_ADMIN', 'MODERATOR', 'ORG_MANAGER'];
  
  // Base 3 admins
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

  // 7 Security Admins to make it exactly 10
  for (let i = 1; i <= 7; i++) {
    const role = 'SECURITY_ADMIN';
    const email = i === 1 ? 'security_admin@trustshield.io' : `security_admin_${i}@trustshield.io`;
    const admin = new UserModel({
      email: email,
      password: 'securepassword123',
      role: role,
      status: 'ACTIVE',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=security_admin_${i}`,
      bio: `Official system Security Admin ${i}.`
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
  
  const orgsCreated = [];
  for (let i = 0; i < 20; i++) {
    const orgOwner = users[Math.floor(Math.random() * users.length)];
    const slug = orgNames[i].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const org = new OrganizationModel({
      name: orgNames[i],
      slug,
      description: `Official community for ${orgNames[i]} professionals.`,
      ownerId: orgOwner._id,
      isVerified: i < 5, // First 5 are verified
      memberCount: Math.floor(Math.random() * 5000) + 100
    });
    await org.save();
    orgsCreated.push(org);
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
    
    // Pick random hashtags to create trending topics
    const possibleTags = ["#CyberSecurity", "#AI_Safety", "#TrustAndSafety", "#Moderation", "#Web3", "#MachineLearning", "#ReactJS", "#NodeJS"];
    const tag1 = possibleTags[Math.floor(Math.random() * possibleTags.length)];
    const tag2 = possibleTags[Math.floor(Math.random() * possibleTags.length)];
    const tagsStr = (i % 3 === 0) ? ` ${tag1}` : (i % 2 === 0) ? ` ${tag1} ${tag2}` : "";

    const content = isSuspicious 
      ? `Click here to download free hacked software! http://malicious.link/?id=${i}` 
      : `Discussing the latest trends in technology and open source development. Topic #${i}.${tagsStr}`;

    // Assign to a random organization 70% of the time
    const org = Math.random() > 0.3 ? orgsCreated[Math.floor(Math.random() * orgsCreated.length)]._id : undefined;

    const post = new PostModel({
      content,
      author: author._id,
      organization: org,
      status: 'PENDING'
    });
    await post.save();

    // Push to RabbitMQ for AI validation to simulate realistic traffic
    await rabbitMQClient.publishThreatEvent({
      eventId: post._id.toString(),
      correlationId: `seed-${i}`,
      eventType: 'NEW_POST',
      userId: author._id.toString(),
      email: author.email,
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      requestId: 'seed',
      metadata: { 
        burstVelocity: 0,
        targetRecipientRatio: 0,
        uriHyperlinkDensity: 0,
        sessionDwellDuration: 0,
        payloadText: content 
      },
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

      await rabbitMQClient.publishThreatEvent({
        eventId: comment._id.toString(),
        correlationId: `seed-comment-${i}-${j}`,
        eventType: 'NEW_COMMENT',
        userId: commenter._id.toString(),
        email: commenter.email,
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
        requestId: 'seed',
        metadata: { 
          burstVelocity: 0,
          targetRecipientRatio: 0,
          uriHyperlinkDensity: 0,
          sessionDwellDuration: 0,
          payloadText: commentContent 
        },
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
