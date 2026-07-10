# TrustShield - Final Presentation Demo Guide
**Academic Target**: Final Year Major Project / Thesis Submission
**Institution**: Indian Institute of Information Technology and Management (IIITM), Gwalior
**Author**: Gajula Rahul (BTech)

## Prerequisites
1. Ensure all Docker containers are running: MongoDB, Redis, RabbitMQ.
2. Gateway server should be running (`cd gateway && npm run dev`).
3. AI Worker should be running (`cd ai-worker && uvicorn app.main:app --reload`).
4. Frontend should be running (`cd frontend && npm run dev`).

## Step-by-Step Demonstration

### 1. Introduction & Architecture (2 mins)
- Open the **Admin Dashboard** (`http://localhost:5173/admin/login`).
- Login with `super_admin@trustshield.io` / `securepassword123`.
- Show the **Dashboard Page**. Explain the multi-service architecture (Node.js Gateway, Python FastAPI AI Worker).
- Highlight the **Live Threat Analytics** and **System Monitors** showing Gateway, Redis, RabbitMQ, and AI Worker health statuses.
- Explain the isolated Admin routing and the Traderly-inspired UI design.

### 2. Live AI Threat Analysis - End-to-End Scenarios (4 mins)
- Open a **New Incognito Window** and navigate to the **Community Feed** (`http://localhost:5173/community`).
- Login as a regular user (e.g., `user1@community.org` / `password123`) or register a new account.
- **Explain the testing matrix**: The AI Worker is configured to analyze intent, not just keywords.
- We will demonstrate 3 separate scenarios using the E2E script or manual posting:
  1. **Normal Activity (Safe)**: "Hey everyone! I just published a new article on React performance optimization." 
     - *Result*: Analyzed by AI, marked SAFE, no alert generated.
  2. **Phishing/Spam (Critical)**: "URGENT! FREE CRYPTO AIRDROP CLICK HERE TO CLAIM 1000 USDT IMMEDIATELY!!!" 
     - *Result*: Instantly flagged by AI, pushes CRITICAL alert via Socket.io.
  3. **Hate Speech (High/Critical)**: "I absolutely hate everyone from that country. They should all be kicked out."
     - *Result*: Flagged by AI for policy violation, pushes HIGH alert.
- Switch back to the **Admin Dashboard** window (`http://localhost:5173/alerts`).
- Show the real-time Socket.io push notifications for the generated threats.

### 3. Real-Time Alert Management & Locking (2 mins)
- On the **Alerts** page, click the **"Lock"** button on the new threat.
- **Result**: The UI will instantly update (optimistically and via socket broadcast) to show "Locked by You", preventing other admins from investigating the same threat concurrently.
- Explain the **Redis Distributed Locking** mechanism behind this.
- Click **"Acknowledge"** to mark the threat as processed.

### 4. Organizations & Frontend Features (1 min)
- Switch back to the **Incognito User Window**.
- Navigate to the **Organizations** page (`http://localhost:5173/organizations`).
- Highlight the new user-facing features: Member grids, "Verified" badges, and community tags.
- Explain how users interact with the system entirely separately from the administrative portal.

### 5. Security Matrix Validations (1 min)
- To further prove system robustness, execute the End-to-End security test script in the terminal:
  ```bash
  cd gateway
  npx ts-node scripts/security-test.ts
  ```
- Explain what the script tests:
  1. **Dormant Account Takeover**: Simulates logging in with an account that hasn't logged in for 180+ days. The Gateway intercepts it, changes status to INACTIVE, and returns a `202 Accepted` to initiate step-up email MFA.
  2. **Redis Brute-Force Rate Limiting**: Simulates a credential stuffing attack by hammering the login endpoint. The Redis edge gateway layer catches it instantly and returns a `429 Too Many Requests`.

### 6. Conclusion & AI E2E Validation (1 min)
- Execute the End-to-End AI pipeline test script in the terminal:
  ```bash
  cd gateway
  npx ts-node scripts/e2e-test.ts
  ```
- Show the logs in the terminal as the message is published to RabbitMQ, processed by Python, and sent back via webhook.
- Show the final threat matrices in the **Threats** tab (`http://localhost:5173/threats`).

---
**End of Demo**
