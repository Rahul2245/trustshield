#!/bin/bash

echo "==========================================="
echo "TrustShield End-to-End Pipeline Test Script"
echo "==========================================="

GATEWAY_URL="http://localhost:5000/api/v1"
TEST_EMAIL="security.test.$(date +%s)@trustshield.internal"
TEST_PASSWORD="SecurePassword123!"

echo ""
echo "[1] Registering a new test user profile..."
REGISTER_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }')

echo "Gateway Response: $REGISTER_RESPONSE"

echo ""
echo "[2] Simulating a Login (Triggering RabbitMQ Threat Event)..."
LOGIN_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }')

echo "Gateway Response: $LOGIN_RESPONSE"

echo ""
echo "==========================================="
echo "If successful, the API returned an Access Token."
echo "Check your AI Worker terminal logs! You should see the RabbitMQ consumer pull the threat event and process it through the pipeline."
echo "==========================================="
