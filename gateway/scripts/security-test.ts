import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { UserModel } from '../src/modules/users/models/user.model';
import axios from 'axios';
import { logger } from '../src/infrastructure/logger/logger';

const GATEWAY_URL = 'http://localhost:5000/api/v1';

async function runSecurityTests() {
  try {
    logger.info('Starting Security Matrix Tests...');
    await mongoose.connect(env.MONGO_URI);

    // Create a new user specifically for testing
    const testEmail = `security.test.${Date.now()}@trustshield.internal`;
    const testPassword = "SecurePassword123!";

    logger.info('\n--- Test 1: 180+ Days Dormant Account Takeover ---');
    // Register
    await axios.post(`${GATEWAY_URL}/auth/register`, {
      email: testEmail,
      password: testPassword,
      name: "Security Tester"
    });
    
    // Simulate inactivity by updating the database directly
    const user = await UserModel.findOne({ email: testEmail });
    if (!user) throw new Error("Test user not created");
    
    // Set lastLoginAt to 185 days ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 185);
    user.lastLoginAt = pastDate;
    await user.save();
    
    logger.info(`Set user ${testEmail} lastLoginAt to ${pastDate.toISOString()} (185 days ago)`);
    
    // Attempt Login
    try {
      logger.info('Attempting to login as dormant user...');
      const response = await axios.post(`${GATEWAY_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      }, { validateStatus: () => true });
      
      if (response.status === 202) {
         logger.info(`✅ SUCCESS: Gateway intercepted dormant login correctly. Returned 202 Accepted. Message: ${response.data.message}`);
      } else {
         logger.error(`❌ FAILED: Gateway returned status ${response.status} instead of 202 Accepted.`);
      }
    } catch (err: any) {
      logger.error(err, "Login attempt failed entirely");
    }

    logger.info('\n--- Test 2: Redis Rate Limiting / Brute Force Attack ---');
    
    // Attempt multiple logins rapidly to trigger the rate limiter
    const maxRequests = 12;
    let rateLimitTriggered = false;
    
    for (let i = 1; i <= maxRequests; i++) {
        try {
            logger.info(`Sending request ${i}...`);
            const res = await axios.post(`${GATEWAY_URL}/auth/login`, {
                email: "fakeuser@example.com",
                password: "wrongpassword"
            }, { validateStatus: () => true });
            
            if (res.status === 429) {
                logger.info(`✅ SUCCESS: Redis Rate Limiter intercepted attack on request ${i}. Returned 429 Too Many Requests.`);
                rateLimitTriggered = true;
                break;
            }
        } catch (e) {}
    }
    
    if (!rateLimitTriggered) {
        logger.error(`❌ FAILED: Redis Rate Limiter did not intercept the attack.`);
    }

    logger.info('\nTests completed. Exiting...');
    process.exit(0);
  } catch (error) {
    logger.error(error as Error, 'Security Test failed');
    process.exit(1);
  }
}

runSecurityTests();
