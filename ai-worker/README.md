# AI Worker

FastAPI worker for asynchronous Trust & Safety inference.

## Responsibilities

- Consume RabbitMQ events from `security.threat_analysis_queue`
- Load TF-IDF, Naive Bayes, Isolation Forest, metadata, and scaler artifacts
- Run NLP and structural anomaly inference
- Fuse model outputs into a production decision
- Persist the unified threat matrix in MongoDB
- Notify the Node.js gateway through a webhook
- Expose health, readiness, model status, reload, and prediction endpoints

## Required Startup Order

1. Train models from `ml-training/`
2. Export generated artifacts into `ai-worker/models/`
3. Start MongoDB
4. Start RabbitMQ
5. Start the AI worker

## Environment

Copy `.env.example` to `.env` and adjust values as needed.

Important variables:

- `AMQP_URL`
- `QUEUE_NAME`
- `MONGO_URI`
- `DATABASE_NAME`
- `SECURITY_LOG_COLLECTION`
- `GATEWAY_WEBHOOK_URL`
- `MODEL_DIRECTORY`
- `TFIDF_MODEL_PATH`
- `NB_MODEL_PATH`
- `IF_MODEL_PATH`
- `SCALER_MODEL_PATH`
- `LOAD_MODELS_ON_STARTUP`
- `CONNECT_SERVICES_ON_STARTUP`

Ollama is optional. If unavailable, ML decisions still run and shadow explanations are skipped.

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Useful endpoints:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/models/status`
- `POST /api/v1/models/reload`
- `POST /api/v1/predict`
