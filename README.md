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
<img src="Screenshot from 2026-06-29 21-26-49.png" width="100%">
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
<img src="Screenshot from 2026-06-29 21-26-24.png" width="100%">
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
