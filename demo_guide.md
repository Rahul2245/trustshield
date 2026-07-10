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

### 2. Live AI Threat Analysis - The Spam Scenario (3 mins)
- Open a **New Incognito Window**.
- Navigate to the **Community Feed** (`http://localhost:5173/community`).
- Login as a regular user (e.g., `user1@community.org` / `password123`) or register a new account.
- **Action**: Post a new message with malicious intent: 
  > "Claim your free crypto airdrop here: http://malicious.link/airdrop"
- **Result**: The post will briefly show as "Pending".
- Switch back to the **Admin Dashboard** window.
- **Action**: Navigate to the **Alerts** page (`http://localhost:5173/alerts`).
- **Result**: Demonstrate the real-time Socket.io push notification. The spam message will appear as a `CRITICAL` or `HIGH` alert, having been processed asynchronously via RabbitMQ and Llama 3 on the AI Worker.

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

### 5. Conclusion & E2E Validation (1 min)
- To further prove system robustness, execute the End-to-End test script in the terminal:
  ```bash
  cd gateway
  npx ts-node scripts/e2e-test.ts
  ```
- Show the logs in the terminal as the message is published to RabbitMQ, processed by Python, and sent back via webhook.
- Show the final threat matrices in the **Threats** tab (`http://localhost:5173/threats`).

---
**End of Demo**
