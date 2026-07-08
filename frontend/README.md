# TrustShield Admin Console

React admin dashboard for the Unified Trust & Safety Identity Engine.

## Features

- **Secure admin authentication** (ADMIN / ANALYST roles only)
- **Real-time alerts** via Socket.io (`security_admin_room`)
- **Dashboard overview** with KPI cards and charts (Cognify-inspired UI)
- **Threat matrix viewer** with NLP, Isolation Forest, and Llama 3 shadow results
- **User management** with account status controls
- **Analytics** with threat velocity and risk trends
- **System health** monitoring for gateway and AI worker

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | Admin authentication |
| `/dashboard` | Security incident overview |
| `/alerts` | Live + historical alerts with acknowledge |
| `/threats` | Threat log table with filters |
| `/threats/:eventId` | Full threat matrix detail |
| `/users` | User account management |
| `/analytics` | Charts and classification breakdown |
| `/system` | Service health status |

## Setup

```bash
# Install dependencies
cd frontend && npm install

# Copy env (optional — Vite proxy handles local dev)
cp .env.example .env

# Seed admin user in gateway (from gateway folder)
cd ../gateway
npm run seed:admin
# Default: admin@trustshield.io / Admin@Trust123

# Start gateway (port 5000)
npm run dev

# Start frontend (port 5173)
cd ../frontend
npm run dev
```

## Integration

The frontend connects to:

- **REST API**: `/api/v1/admin/*`, `/api/v1/auth/*` (proxied to gateway :5000)
- **WebSocket**: Socket.io on gateway with JWT auth
- **AI Worker health**: `VITE_AI_WORKER_URL` (default `http://localhost:8000`)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | (empty) | API base URL; empty uses Vite proxy |
| `VITE_WS_URL` | (empty) | WebSocket URL; empty uses same origin |
| `VITE_AI_WORKER_URL` | `http://localhost:8000` | AI worker health endpoint |

Gateway requires `FRONTEND_ORIGIN=http://localhost:5173` for CORS and Socket.io.
