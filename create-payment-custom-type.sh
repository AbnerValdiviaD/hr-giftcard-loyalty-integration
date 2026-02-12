#!/bin/bash

# Script to create payment custom type for Harry Rosen Gift Card Connector
# This script creates a custom type with giftCardCode and giftCardPin fields

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Payment Custom Type Creator${NC}"
echo -e "${GREEN}Harry Rosen Gift Card Connector${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Check if .env file exists
if [ ! -f "processor/.env" ]; then
    echo -e "${RED}Error: processor/.env file not found${NC}"
    echo "Please create processor/.env with your commercetools credentials"
    exit 1
fi

# Load environment variables
export $(cat processor/.env | grep -v '^#' | xargs)

# Validate required variables
if [ -z "$CTP_PROJECT_KEY" ] || [ -z "$CTP_CLIENT_ID" ] || [ -z "$CTP_CLIENT_SECRET" ]; then
    echo -e "${RED}Error: Missing required environment variables${NC}"
    echo "Required: CTP_PROJECT_KEY, CTP_CLIENT_ID, CTP_CLIENT_SECRET"
    exit 1
fi

# Set defaults if not provided
CTP_AUTH_URL=${CTP_AUTH_URL:-"https://auth.us-central1.gcp.commercetools.com"}
CTP_API_URL=${CTP_API_URL:-"https://api.us-central1.gcp.commercetools.com"}

# Custom type configuration
TYPE_KEY="customPaymentFields"
TYPE_NAME="Custom Payment Fields"
TYPE_DESCRIPTION="Custom fields for payment methods including gift cards"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Project: $CTP_PROJECT_KEY"
echo "  Auth URL: $CTP_AUTH_URL"
echo "  API URL: $CTP_API_URL"
echo "  Type Key: $TYPE_KEY"
echo ""

# Step 1: Get access token
echo -e "${YELLOW}Step 1: Obtaining access token...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST "$CTP_AUTH_URL/oauth/token" \
  -u "$CTP_CLIENT_ID:$CTP_CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=manage_types:$CTP_PROJECT_KEY")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}Error: Failed to obtain access token${NC}"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Access token obtained${NC}\n"

# Step 2: Check if type already exists
echo -e "${YELLOW}Step 2: Checking if type already exists...${NC}"
EXISTING_TYPE=$(curl -s -X GET "$CTP_API_URL/$CTP_PROJECT_KEY/types/key=$TYPE_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}" | tail -n 1)

if [ "$EXISTING_TYPE" = "200" ]; then
    echo -e "${GREEN}✓ Type '$TYPE_KEY' already exists!${NC}"

    # Get the existing type details
    TYPE_DETAILS=$(curl -s -X GET "$CTP_API_URL/$CTP_PROJECT_KEY/types/key=$TYPE_KEY" \
      -H "Authorization: Bearer $ACCESS_TOKEN")

    # Check if giftCardCode and giftCardPin fields exist
    HAS_CODE=$(echo $TYPE_DETAILS | grep -o '"name":"giftCardCode"' | wc -l)
    HAS_PIN=$(echo $TYPE_DETAILS | grep -o '"name":"giftCardPin"' | wc -l)

    if [ $HAS_CODE -gt 0 ] && [ $HAS_PIN -gt 0 ]; then
        echo -e "${GREEN}✓ Type already has required fields (giftCardCode, giftCardPin)${NC}"
        echo -e "\n${GREEN}All set! No changes needed.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Type exists but missing required fields${NC}"
        echo "The script will attempt to add the missing fields..."

        # Get current version
        VERSION=$(echo $TYPE_DETAILS | grep -o '"version":[0-9]*' | cut -d':' -f2)

        # Prepare actions to add missing fields
        ACTIONS="["

        if [ $HAS_CODE -eq 0 ]; then
            echo "  - Adding giftCardCode field"
            ACTIONS="$ACTIONS{\"action\":\"addFieldDefinition\",\"fieldDefinition\":{\"name\":\"giftCardCode\",\"label\":{\"en\":\"Gift Card Code\"},\"required\":false,\"type\":{\"name\":\"String\"},\"inputHint\":\"SingleLine\"}},"
        fi

        if [ $HAS_PIN -eq 0 ]; then
            echo "  - Adding giftCardPin field"
            ACTIONS="$ACTIONS{\"action\":\"addFieldDefinition\",\"fieldDefinition\":{\"name\":\"giftCardPin\",\"label\":{\"en\":\"Gift Card PIN\"},\"required\":false,\"type\":{\"name\":\"String\"},\"inputHint\":\"SingleLine\"}}"
        fi

        # Remove trailing comma if present
        ACTIONS=$(echo $ACTIONS | sed 's/,$//')
        ACTIONS="$ACTIONS]"

        # Update the type
        UPDATE_RESPONSE=$(curl -s -X POST "$CTP_API_URL/$CTP_PROJECT_KEY/types/key=$TYPE_KEY" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"version\":$VERSION,\"actions\":$ACTIONS}" \
          -w "\n%{http_code}")

        HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n 1)

        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ Fields added successfully!${NC}"
            exit 0
        else
            echo -e "${RED}Error: Failed to add fields${NC}"
            echo "$UPDATE_RESPONSE"
            exit 1
        fi
    fi
fi

# Step 3: Create new type
echo -e "${YELLOW}Step 3: Creating new type '$TYPE_KEY'...${NC}"

CREATE_RESPONSE=$(curl -s -X POST "$CTP_API_URL/$CTP_PROJECT_KEY/types" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "'$TYPE_KEY'",
    "name": {
      "en": "'$TYPE_NAME'"
    },
    "description": {
      "en": "'$TYPE_DESCRIPTION'"
    },
    "resourceTypeIds": ["payment"],
    "fieldDefinitions": [
      {
        "name": "giftCardCode",
        "label": {
          "en": "Gift Card Code"
        },
        "required": false,
        "type": {
          "name": "String"
        },
        "inputHint": "SingleLine"
      },
      {
        "name": "giftCardPin",
        "label": {
          "en": "Gift Card PIN"
        },
        "required": false,
        "type": {
          "name": "String"
        },
        "inputHint": "SingleLine"
      }
    ]
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Type created successfully!${NC}\n"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Type Details:${NC}"
    echo "  Key: $TYPE_KEY"
    echo "  Resource: payment"
    echo "  Fields:"
    echo "    - giftCardCode (String)"
    echo "    - giftCardPin (String)"
    echo -e "${GREEN}========================================${NC}\n"
    echo -e "${GREEN}Success! Payment custom type is ready.${NC}"
else
    echo -e "${RED}Error: Failed to create type (HTTP $HTTP_CODE)${NC}"
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    exit 1
fi
