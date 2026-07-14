# 🛡️ TrustShield

### AI-powered Trust & Safety Platform

Enterprise-grade event-driven platform for authentication security, behavioral threat detection, and asynchronous AI-powered security analysis.

Built using **Node.js**, **FastAPI**, **RabbitMQ**, **Redis**, **MongoDB**, **React**, **Docker**, **Scikit-Learn**, and **Local Llama 3 (Ollama)**.


![Node.js](https://img.shields.io/badge/Node.js-20-green)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.12-orange)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)
![Redis](https://img.shields.io/badge/Redis-7-red)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)
![React](https://img.shields.io/badge/React-Frontend-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Live Production Demo

Experience the fully containerized TrustShield architecture live in action:
**[https://trustshield-pi.vercel.app/](https://trustshield-pi.vercel.app/)**

## 📌 Overview

Modern communication platforms primarily validate user credentials but rarely evaluate behavioral intent during authentication or messaging workflows.

TrustShield introduces an event-driven Trust & Safety architecture that separates real-time request validation from computationally expensive AI inference.

The platform performs synchronous edge validation while asynchronously executing machine learning and local large language model (LLM) analysis, enabling low-latency APIs without sacrificing advanced threat detection.


## ✨ Features

- Secure JWT Authentication
- Redis Sliding Window Rate Limiting
- Dormant Account Detection
- Deactivated Account Protection
- Step-up MFA Workflow
- Event-driven Microservice Architecture
- RabbitMQ Asynchronous Processing
- TF-IDF + Naive Bayes Text Classification
- Isolation Forest Bot Detection
- Local Llama 3 Semantic Threat Analysis
- Live Security Dashboard
- WebSocket Real-time Alerts
- Dockerized Deployment


## 🏗️ System Architecture

> This diagram illustrates the high-level architecture of TrustShield, showing how requests flow across the Edge Gateway, asynchronous processing pipeline, AI inference workers, databases, and the real-time dashboard.

<p align="center">
<img src="./images/classDiagram.png" width="100%">
</p>


## ⚡ Why Event-Driven?

Traditional applications execute expensive AI inference inside the request-response lifecycle, increasing latency and reducing throughput.

TrustShield decouples heavy computation using RabbitMQ so that:

- Authentication remains responsive
- AI analysis executes asynchronously
- Workers scale independently
- WebSocket notifications remain real-time


## 🔄 Authentication & Threat Evaluation Flow

The following sequence diagram demonstrates how TrustShield processes authentication requests from initial gateway validation through asynchronous AI analysis and live dashboard notification.

<p align="center">
<img src="./images/sequenceDiagram.png" width="100%">
</p>


## 🛠️ Technology Stack

| Layer | Technology |
|---------|------------|
| Edge Gateway | Node.js + TypeScript |
| Authentication | JWT |
| Cache | Redis |
| Database | MongoDB |
| Message Broker | RabbitMQ |
| AI Workers | FastAPI |
| Machine Learning | Scikit-Learn |
| LLM | Ollama + Llama 3 |
| Dashboard | React |
| Real-time Communication | Socket.io |
| Containerization | Docker |


## 📖 End-to-End Walkthrough Demo

Follow these steps to see how TrustShield's Event-Driven AI Pipeline analyzes user interactions and flags threats in real-time.

### Step 1: Log in as a User & Post Content
1. Go to the [Live Demo URL](https://trustshield-pi.vercel.app/).
2. Log in with a standard user account (or register a new one).
3. Navigate to the **Feed** or **Create Post** section.
4. Try posting a normal message (e.g., *"Hello world, excited to join this platform!"*).
5. Now, try posting a suspicious or malicious message simulating a phishing attack or spam (e.g., *"URGENT: Click this link to verify your bank account credentials immediately before your account gets permanently suspended!"*).

### Step 2: Log in as the Admin (Trust & Safety Team)
1. Open a new incognito window or log out of the user account.
2. Go to the Admin Login Portal: **[https://trustshield-pi.vercel.app/admin/login](https://trustshield-pi.vercel.app/admin/login)**
3. Log in using the seeded Admin credentials:
   - **Email:** `super_admin@trustshield.io`
   - **Password:** `securepassword123`

### Step 3: View Real-Time Threat Alerts
1. Upon logging into the Admin Security Console, navigate to the **Live Dashboard** or **Threats** tab.
2. You will instantly see the suspicious post you made earlier flagged as a threat in the system.
3. Click on the flagged alert to view the **Threat Details**. 
4. Observe how TrustShield's asynchronous AI workers (Isolation Forest & Llama 3) have automatically attached a confidence score, threat classification, and detailed reasoning for *why* the post was flagged—all executed in the background without slowing down the end-user's posting experience!
