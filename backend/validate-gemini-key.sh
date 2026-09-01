#!/bin/bash

# Gemini API Key Validation Script
# This script validates if your Gemini API key is correctly configured

echo "==================================="
echo "Gemini API Key Validation"
echo "==================================="
echo ""

# Load .env file
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

source .env

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY is not set in .env file"
    exit 1
fi

echo "✓ GEMINI_API_KEY found in .env"
echo "  Key starts with: ${GEMINI_API_KEY:0:10}..."
echo ""

# Validate key format
if [[ $GEMINI_API_KEY =~ ^AIza ]]; then
    echo "✓ Key format looks valid (starts with AIza)"
else
    echo "⚠️  Warning: Key doesn't start with 'AIza' - this may not be a valid Google Gemini API key"
    echo "   Valid keys should be obtained from: https://aistudio.google.com/app/apikey"
fi

echo ""
echo "Testing API connection..."
echo ""

# Test API with a simple request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL:-gemini-2.0-flash-exp}:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Say hello in one word"
      }]
    }]
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS: Gemini API key is valid and working!"
    echo ""
    echo "Response preview:"
    echo "$BODY" | head -c 200
    echo "..."
    exit 0
elif [ "$HTTP_CODE" = "400" ]; then
    echo "❌ FAILED: API key is invalid or request format is incorrect"
    echo ""
    echo "Error details:"
    echo "$BODY"
    exit 1
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ FAILED: API key is invalid or does not have permission"
    echo ""
    echo "Error details:"
    echo "$BODY"
    exit 1
elif [ "$HTTP_CODE" = "429" ]; then
    echo "⚠️  Rate limit exceeded. Your key might be valid but you've made too many requests."
    echo ""
    echo "Error details:"
    echo "$BODY"
    exit 1
else
    echo "❌ FAILED: Unexpected HTTP status code"
    echo ""
    echo "Response body:"
    echo "$BODY"
    exit 1
fi
