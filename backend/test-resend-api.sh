#!/bin/bash

# Test Resend API Key
# Usage: ./test-resend-api.sh YOUR_API_KEY your-email@example.com

if [ -z "$1" ]; then
    echo "Usage: ./test-resend-api.sh YOUR_API_KEY your-email@example.com"
    echo "Example: ./test-resend-api.sh re_abc123... test@example.com"
    exit 1
fi

if [ -z "$2" ]; then
    echo "Usage: ./test-resend-api.sh YOUR_API_KEY your-email@example.com"
    echo "Example: ./test-resend-api.sh re_abc123... test@example.com"
    exit 1
fi

API_KEY="$1"
TO_EMAIL="$2"

echo "========================================="
echo "Testing Resend API"
echo "========================================="
echo "API Key: ${API_KEY:0:10}..."
echo "To Email: $TO_EMAIL"
echo "========================================="
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer $API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{
    \"from\": \"onboarding@resend.dev\",
    \"to\": \"$TO_EMAIL\",
    \"subject\": \"Ledgera OTP Test Email\",
    \"html\": \"<h1>Test Email</h1><p>This is a test email from Ledgera backend to verify Resend API configuration.</p><p>If you received this, your Resend API key is working correctly!</p>\"
  }")

# Extract HTTP status code
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')

echo "Response:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
echo ""
echo "HTTP Status: $http_status"
echo ""

if [ "$http_status" = "200" ]; then
    echo "✅ SUCCESS! Email sent successfully."
    echo "Check your inbox at: $TO_EMAIL"
    echo ""
    echo "Your Resend API key is working correctly!"
else
    echo "❌ FAILED! Email was not sent."
    echo ""
    echo "Common issues:"
    echo "- 401: Invalid API key"
    echo "- 403: API key doesn't have sending permissions"
    echo "- 422: Invalid email address or sender"
    echo "- 429: Rate limit exceeded"
    echo ""
    echo "Check your Resend dashboard: https://resend.com/api-keys"
fi

echo "========================================="
