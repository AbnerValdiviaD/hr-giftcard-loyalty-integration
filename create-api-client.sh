#!/bin/bash

# Create API client for gift card connector
# Replace these variables with your actual values

PROJECT_KEY="your-project-key"
ADMIN_CLIENT_ID="your-admin-client-id"
ADMIN_CLIENT_SECRET="your-admin-client-secret"
AUTH_URL="https://auth.us-central1.gcp.commercetools.com"
API_URL="https://api.us-central1.gcp.commercetools.com"

# Get admin OAuth token
TOKEN_RESPONSE=$(curl -s -X POST "${AUTH_URL}/oauth/token" \
  -u "${ADMIN_CLIENT_ID}:${ADMIN_CLIENT_SECRET}" \
  -d "grant_type=client_credentials&scope=manage_project:${PROJECT_KEY}")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to get access token. Response:"
  echo $TOKEN_RESPONSE
  exit 1
fi

# Create API client with required scopes
curl -X POST "${API_URL}/${PROJECT_KEY}/api-clients" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gift Card Connector",
    "scope": "manage_payments:'${PROJECT_KEY}' manage_orders:'${PROJECT_KEY}' view_sessions:'${PROJECT_KEY}' view_api_clients:'${PROJECT_KEY}' manage_checkout_payment_intents:'${PROJECT_KEY}' introspect_oauth_tokens:'${PROJECT_KEY}' manage_types:'${PROJECT_KEY}' view_types:'${PROJECT_KEY}'"
  }' | jq '.'

echo ""
echo "Save the clientId and secret from the response above!"
