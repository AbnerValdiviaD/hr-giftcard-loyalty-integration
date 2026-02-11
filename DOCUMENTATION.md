# Harry Rosen Gift Card Connector - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Guide](#setup-guide)
4. [Development Workflow](#development-workflow)
5. [Testing Guide](#testing-guide)
6. [Deployment Guide](#deployment-guide)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Topics](#advanced-topics)

---

## Overview

### What is This Connector?

The Harry Rosen Gift Card Connector integrates Harry Rosen gift cards with commercetools Checkout, allowing customers to:
- Check gift card balances before purchase
- Redeem gift cards (full or partial amounts)
- Apply multiple gift cards to a single order
- Receive refunds back to gift cards

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Customer Checkout                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Enabler (Frontend)                        │
│  - Gift card UI (checkbox, form, buttons)                   │
│  - Client-side validation                                    │
│  - Session-based auth to Processor                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Processor (Backend)                        │
│  - Validates gift card data                                  │
│  - Communicates with Harry Rosen API                         │
│  - Updates commercetools payments/carts                      │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Harry Rosen    │    │ commercetools   │
│  Gift Card API  │    │   Platform      │
└─────────────────┘    └─────────────────┘
```

---

## Architecture

### Two-Module Design

#### 1. Enabler (Frontend)

**Location:** `/enabler`

**Purpose:** Provides the UI component that merchants embed in their checkout

**Key Files:**
- `src/components/form.ts` - Main UI component with form, validation, and workflows
- `src/components/utils.ts` - Helper functions and field IDs
- `src/style/inputField.module.scss` - All UI styling
- `src/i18n/translations.ts` - Localized error messages

**Features:**
- ✅ Checkbox to show/hide gift card form
- ✅ Card number and PIN input fields
- ✅ "Load Balance" button with balance display
- ✅ Editable amount input after balance check
- ✅ "Apply" button (disabled until balance loaded)
- ✅ Client-side validation (numeric, length checks)
- ✅ Responsive design for mobile
- ✅ Real-time error feedback

#### 2. Processor (Backend)

**Location:** `/processor`

**Purpose:** Backend middleware between commercetools and Harry Rosen API

**Key Files:**
- `src/server/app.ts` - Main application setup
- `src/services/harryrosen-giftcard.service.ts` - Production service
- `src/services/giftcard-mock.service.ts` - Mock/testing service
- `src/clients/harryrosen-giftcard.client.ts` - Harry Rosen API client
- `src/clients/giftcard-mock.client.ts` - Mock client for testing
- `src/routes/giftcard.route.ts` - API endpoints
- `src/dtos/giftcard.dto.ts` - Request/response types

**Features:**
- ✅ Session-based authentication
- ✅ Gift card number & PIN validation
- ✅ Balance checking
- ✅ Redemption (full/partial)
- ✅ Refunds/cancellations
- ✅ Payment lifecycle management
- ✅ Health checks
- ✅ Error handling with user-friendly messages

### Payment Flow: Two-Step Authorization & Capture

The connector implements a **two-step payment flow** to prevent charging customers for abandoned carts:

#### Why Two-Step Flow?

**Problem with Immediate Redemption:**
If gift card funds were redeemed immediately when the user clicks "Apply", customers would lose money in these scenarios:
- Cart abandoned before checkout completion
- Payment fails for other items in the cart
- Browser crashes or network errors
- User changes their mind and closes the tab

**Solution: Authorize First, Capture Later**

The connector follows the same pattern as credit card processing and BoldPaymentPlugin:

1. **Authorization** (when "Apply" clicked): Check balance and reserve payment intent
2. **Capture** (when order created): Actually redeem funds from gift card

#### Payment Lifecycle States

```
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 1: AUTHORIZATION                         │
│                   (User clicks "Apply")                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  POST /redeem                 │
         │  - Validate card number/PIN   │
         │  - Check balance only         │
         │  - Create pending payment     │
         │  - Store card details         │
         │  - Add payment to cart        │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Payment State: PENDING       │
         │  Transaction: NONE            │
         │  Card details in custom fields│
         └───────────────┬───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 2: CAPTURE                               │
│                   (Order created)                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  POST /operations/payment-    │
         │  intents/{paymentId}          │
         │  - Retrieve stored card       │
         │  - Call Harry Rosen redeem    │
         │  - Add transaction to payment │
         │  - Return approval            │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Payment State: PAID          │
         │  Transaction: Charge/Success  │
         │  PSP Reference: HR txn ID     │
         └───────────────────────────────┘
```

#### Implementation Details

**Step 1: Authorization (`/redeem` endpoint)**

```typescript
async redeem(request: RedeemRequestDTO): Promise<RedeemResponseDTO> {
  // 1. Validate card number and PIN
  const validationResult = this.validateCardNumberAndPin(
    request.code,
    request.securityCode
  );

  // 2. Check balance ONLY (no redemption)
  const balanceResult = await this.balance(
    request.code,
    request.securityCode
  );

  // 3. Create pending payment (no transaction yet)
  const payment = await this.ctPaymentService.createPayment({
    amountPlanned: {
      centAmount: request.amount.centAmount,
      currencyCode: request.amount.currencyCode,
    },
    paymentMethodInfo: {
      paymentInterface: 'harryrosen-giftcard',
      method: 'giftcard',
      name: { en: 'Harry Rosen Gift Card' },
    },
    custom: {
      type: { typeId: 'type', key: 'payment-harryrosen-giftcard' },
      fields: {
        // ⚠️ Store sensitive data for later capture
        giftCardCode: request.code,
        giftCardPin: request.securityCode,
      },
    },
  });

  // 4. Add payment to cart
  await this.ctCartService.addPayment({
    paymentId: payment.id,
  });

  // 5. Return success WITHOUT redemption
  return {
    isSuccess: true,
    paymentReference: payment.id,
  };
}
```

**Step 2: Capture (`/operations/payment-intents/{paymentId}` endpoint)**

```typescript
async capturePayment(request: CapturePaymentRequest) {
  // 1. Retrieve payment with stored card details
  const payment = await this.ctPaymentService.getPayment({
    id: request.payment.id,
  });

  // 2. Extract stored gift card credentials
  const giftCardCode = payment.custom?.fields?.giftCardCode;
  const giftCardPin = payment.custom?.fields?.giftCardPin;

  if (!giftCardCode || !giftCardPin) {
    throw new Error('Gift card details not found');
  }

  // 3. NOW actually redeem from Harry Rosen API
  const amountInDollars = request.amount.centAmount / 100;
  const response = await this.harryRosenClient.redeem({
    pan: giftCardCode,
    pin: giftCardPin,
    amount: amountInDollars,
    reference_id: payment.id,
    reason: 'purchase',
  });

  // 4. Add transaction to mark payment as captured
  await this.ctPaymentService.updatePayment({
    id: payment.id,
    transaction: {
      type: 'Charge',
      amount: request.amount,
      state: 'Success',
      interactionId: response.reference_id, // Harry Rosen txn ID
    },
  });

  // 5. Return approval
  return {
    outcome: PaymentModificationStatus.APPROVED,
    pspReference: response.reference_id,
  };
}
```

#### Custom Fields for Data Storage

The payment custom type stores sensitive data between steps:

**Custom Type:** `payment-harryrosen-giftcard`

**Fields:**
- `giftCardCode` (String) - PAN/card number
- `giftCardPin` (String) - Security code/PIN

**Security Note:** These fields are only accessible by the processor service with proper credentials. They are NOT exposed to the frontend.

#### Comparison to BoldPaymentPlugin

Our implementation matches BoldPaymentPlugin's behavior:

| Aspect | BoldPaymentPlugin | Our Connector |
|--------|-------------------|---------------|
| Authorization | `ADD_PAYMENT` action | `POST /redeem` → create payment |
| Payment State | Stores in metadata | Stores in custom fields |
| Actual Redemption | `/payment/capture` | `POST /operations/payment-intents` |
| Timing | On order creation | On order creation |
| Cancellation | Removes payment from cart | `cancelPayment` action |
| Refunds | `/payment/refund` | `refundPayment` action |

**Key Difference:** BoldPaymentPlugin uses metadata while we use typed custom fields for better type safety and validation.

#### Error Handling During Capture

If capture fails (network error, insufficient balance, etc.):

```typescript
async capturePayment(request: CapturePaymentRequest) {
  try {
    const response = await this.harryRosenClient.redeem({...});

    // Success - mark as captured
    await this.ctPaymentService.updatePayment({
      transaction: {
        type: 'Charge',
        state: 'Success',
        interactionId: response.reference_id,
      },
    });

    return { outcome: PaymentModificationStatus.APPROVED };
  } catch (error) {
    // Failure - mark as failed
    await this.ctPaymentService.updatePayment({
      transaction: {
        type: 'Charge',
        state: 'Failure',
        interactionId: `error-${Date.now()}`,
      },
    });

    return { outcome: PaymentModificationStatus.REJECTED };
  }
}
```

commercetools will automatically retry failed captures based on configuration.

#### Testing the Two-Step Flow

**Local Testing:**

1. **Apply gift card:**
   ```bash
   curl -X POST http://localhost:8081/redeem \
     -H "X-Session-Id: your-session-id" \
     -d '{"code":"1234567890123456","securityCode":"1234","amount":{"centAmount":2500,"currencyCode":"CAD"}}'
   ```
   Response: `{"isSuccess":true,"paymentReference":"payment-abc123"}`

2. **Verify payment is pending:**
   ```bash
   # Check payment in commercetools - should have NO transactions yet
   ```

3. **Trigger capture:**
   ```bash
   curl -X POST http://localhost:8081/operations/payment-intents/payment-abc123 \
     -H "Authorization: Bearer your-oauth-token" \
     -d '{"actions":[{"action":"capturePayment","amount":{"centAmount":2500,"currencyCode":"CAD"}}]}'
   ```
   Response: `{"outcome":"approved","pspReference":"hr-txn-xyz"}`

4. **Verify payment is captured:**
   ```bash
   # Check payment - should now have Charge/Success transaction
   ```

---

## Setup Guide

### Prerequisites

1. **commercetools Account**
   - Project with Checkout enabled
   - API client credentials
   - Required scopes (see below)

2. **Harry Rosen Credentials**
   - API URL (e.g., `https://ckinttest.harryrosen.com:5010`)
   - Username
   - Password

3. **Development Environment**
   - Node.js 18 or higher
   - npm or yarn
   - Git

### Step 1: Clone and Install

```bash
# Clone repository
git clone <your-repo-url>
cd connect-giftcard-integration-template

# Install processor dependencies
cd processor
npm install

# Install enabler dependencies
cd ../enabler
npm install
```

### Step 2: Configure commercetools API Client

#### Option A: Via Merchant Center UI

1. Go to **Settings → Developer settings → Create new API client**
2. Select template: **"Payment connector for checkout"**
3. This automatically selects required scopes
4. Manually add `manage_types` and `view_types` if missing
5. Click **Create API client**
6. Copy credentials to processor `.env`

#### Option B: Via API

```bash
cd processor
chmod +x ../create-api-client.sh
# Edit script with your admin credentials
../create-api-client.sh
```

### Step 3: Configure Environment Variables

**Processor (`processor/.env`):**

```bash
# commercetools Configuration
CTP_PROJECT_KEY=harryrosen-mtst25
CTP_CLIENT_ID=your-client-id-here
CTP_CLIENT_SECRET=your-client-secret-here
CTP_AUTH_URL=https://auth.us-central1.gcp.commercetools.com
CTP_API_URL=https://api.us-central1.gcp.commercetools.com
CTP_SESSION_URL=https://session.us-central1.gcp.commercetools.com
CTP_JWKS_URL=https://mc-api.us-central1.gcp.commercetools.com/.well-known/jwks.json
CTP_JWT_ISSUER=https://mc-api.us-central1.gcp.commercetools.com

# Harry Rosen API
# Harry Rosen uses different servers for different operations:
# - Balance checks: ckinttest.harryrosen.com:5010
# - Transactions (redeem/refund): crmapptest.harryrosen.com:8000
HARRYROSEN_BALANCE_URL=https://ckinttest.harryrosen.com:5010
HARRYROSEN_TRANSACTION_URL=https://crmapptest.harryrosen.com:8000
HARRYROSEN_USER=00990mp
HARRYROSEN_PASSWORD=your-password-here

# Connector Settings
MOCK_CONNECTOR_CURRENCY=CAD
LOGGER_LEVEL=info
HEALTH_CHECK_TIMEOUT=5000
```

**Enabler (`enabler/.env`):**

```bash
VITE_PROCESSOR_URL=http://localhost:8080
```

### Step 4: Verify Setup

```bash
# Build processor
cd processor
npm run build

# Start processor
npm run dev

# In another terminal, check health
curl http://localhost:8081/operations/status
```

Expected response:
```json
{
  "status": "OK",
  "checks": [
    {"name": "commercetools permissions", "status": "UP"},
    {"name": "Harry Rosen Gift Card API", "status": "UP"}
  ]
}
```

---

## Development Workflow

### Local Development Setup

#### Terminal 1: Processor

```bash
cd processor
npm run dev
# Runs on http://localhost:8081
```

#### Terminal 2: Enabler

```bash
cd enabler
npm run dev
# Runs on http://localhost:3000
```

#### Terminal 3: Mock Services (Optional)

```bash
# Start mock JWT server
docker compose up -d
```

### Making Changes

#### Modify Enabler UI

1. Edit `enabler/src/components/form.ts` for functionality
2. Edit `enabler/src/style/inputField.module.scss` for styling
3. Edit `enabler/src/i18n/translations.ts` for error messages
4. Browser auto-refreshes at `localhost:3000`

#### Modify Processor Logic

1. Edit `processor/src/services/harryrosen-giftcard.service.ts`
2. Edit `processor/src/clients/harryrosen-giftcard.client.ts`
3. Run `npm run build` to recompile
4. Restart processor: `npm run dev`

### Testing Changes

#### Test Enabler UI

1. Open `http://localhost:3000`
2. Enter cart ID (must be Active cart with items)
3. Click "Create checkout"
4. Check "Redeem a Gift Card"
5. Enter test gift card:
   - Card number: `1234567890123456` (numeric, >12 chars)
   - PIN: `1234` (numeric)
6. Click "Load Balance"
7. Adjust amount if needed
8. Click "Apply"

#### Test Processor API

```bash
# Test balance endpoint
curl -X POST http://localhost:8081/balance \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: your-session-id" \
  -d '{
    "code": "1234567890123456",
    "securityCode": "1234"
  }'

# Test health check
curl http://localhost:8081/operations/status \
  -H "Authorization: Bearer <jwt-token>"
```

---

## Testing Guide

### Understanding Test vs Production

The connector has **two service implementations**:

#### Production Service
**File:** `processor/src/services/harryrosen-giftcard.service.ts`

- ✅ Calls real Harry Rosen API
- ✅ Requires VPN/network access
- ✅ Used when processor runs normally
- ✅ Configured in `src/server/app.ts`:

```typescript
const giftCardService = new HarryRosenGiftCardService({
  ctCartService: paymentSDK.ctCartService,
  ctPaymentService: paymentSDK.ctPaymentService,
  ctOrderService: paymentSDK.ctOrderService,
});
```

#### Mock Service
**File:** `processor/src/services/giftcard-mock.service.ts`

- ✅ Simulates gift card responses
- ✅ No external API calls
- ✅ Used for unit tests
- ✅ Useful for development without VPN

**Test Gift Cards (Mock):**
- `Valid-12345678901234` → Returns $50 balance
- `Valid-00123456789012` → Returns "Expired" error
- `ZeroBalance-1234567890` → Returns $0 balance

### Running Unit Tests

```bash
cd processor

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test giftcard-mock.service.spec.ts
```

### Switching Between Production and Mock

**To use mock service for local development:**

Edit `processor/src/server/app.ts`:

```typescript
// Change this:
const giftCardService = new HarryRosenGiftCardService({...});

// To this:
const giftCardService = new GiftCardMockService({...});
```

### Integration Testing

Test the full flow:

1. **Start all services:**
   ```bash
   docker compose up -d  # JWT server
   cd processor && npm run dev  # Processor
   cd enabler && npm run dev    # Enabler
   ```

2. **Create test cart** in commercetools:
   - Add line items
   - Set cart state to "Active"
   - Note the cart ID

3. **Test in UI:**
   - Open `http://localhost:3000`
   - Enter cart ID
   - Click "Create checkout"
   - Test gift card flow

---

## Deployment Guide

### Pre-Deployment Checklist

- [ ] All tests passing (`npm run test`)
- [ ] Health check returns "OK" locally
- [ ] Processor builds without errors (`npm run build`)
- [ ] Enabler builds without errors (`npm run build`)
- [ ] Harry Rosen API credentials configured
- [ ] commercetools API client created with correct scopes
- [ ] Currency set correctly (`MOCK_CONNECTOR_CURRENCY=CAD`)

### Deploy as Private Connector

```bash
cd processor

# Build for production
npm run build

# Deploy to commercetools Connect
npm run connector:post-deploy
```

This deploys as an **Organization Connector** (private to your organization).

### Post-Deployment Setup

1. **Find Connector in Merchant Center:**
   - Settings → Connectors
   - Look for "Harry Rosen Gift Card Connector"

2. **Install to Project:**
   - Click connector
   - Click "Install"
   - Select project (staging first!)
   - Configure environment variables:
     - `HARRYROSEN_URL`
     - `HARRYROSEN_USER`
     - `HARRYROSEN_PASSWORD` (secured)
     - `MOCK_CONNECTOR_CURRENCY=CAD`

3. **Configure Payment Integration:**
   - Checkout → Applications
   - Select your application
   - Add Payment Integration
   - Select "Harry Rosen Gift Card Connector"
   - Choose integration type: "Web Components"
   - Set display order
   - Add predicates (optional):
     ```
     country = "CA"  // Only show for Canada
     totalPrice.centAmount > 500  // Only for orders > $5
     ```

4. **Test in Staging:**
   - Create test order in staging
   - Verify gift card UI appears
   - Test complete flow

5. **Deploy to Production:**
   - Repeat deployment for production project
   - Monitor health checks
   - Test with small real transaction first

### Making Public (Optional)

To make your connector available to all merchants:

1. Contact commercetools support
2. Submit connector for marketplace review
3. Provide documentation and test credentials
4. Pass security audit
5. Set pricing (free or paid)
6. Connector appears in public marketplace

---

## API Reference

### Processor Endpoints

#### POST /balance

Check gift card balance.

**Auth:** Session (X-Session-Id header)

**Request:**
```json
{
  "code": "1234567890123456",  // Numeric, >12 chars
  "securityCode": "1234"         // Numeric
}
```

**Response (Success):**
```json
{
  "status": {"state": "Valid"},
  "amount": {
    "centAmount": 5000,
    "currencyCode": "CAD"
  }
}
```

**Response (Error):**
```json
{
  "status": {
    "state": "NotFound",
    "errors": [{
      "code": "NotFound",
      "message": "Gift card not found"
    }]
  }
}
```

**Error Codes:**
- `NotFound` - Invalid card number or PIN
- `Expired` - Card has expired
- `ZeroBalance` - Card has $0 balance
- `CurrencyNotMatch` - Card currency ≠ cart currency
- `InvalidCardNumber` - Invalid format
- `InvalidPIN` - Invalid format
- `MissingSecurityCode` - PIN required

#### POST /redeem

Redeem gift card amount.

**Auth:** Session (X-Session-Id header)

**Request:**
```json
{
  "code": "1234567890123456",
  "securityCode": "1234",
  "amount": {
    "centAmount": 2500,
    "currencyCode": "CAD"
  }
}
```

**Response:**
```json
{
  "isSuccess": true,
  "paymentReference": "payment-abc123"
}
```

#### GET /operations/status

Health check endpoint.

**Auth:** JWT (Bearer token from Merchant Center)

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-10T17:53:26.819Z",
  "version": "0.2.0",
  "checks": [
    {
      "name": "commercetools permissions",
      "status": "UP"
    },
    {
      "name": "Harry Rosen Gift Card API",
      "status": "UP",
      "details": {"responseCode": 200}
    }
  ],
  "metadata": {
    "name": "Harry Rosen Gift Card Connector",
    "description": "Gift card integration with Harry Rosen",
    "currency": "CAD"
  }
}
```

#### POST /operations/payment-intents/{paymentId}

Modify payment (capture, cancel, refund).

**Auth:** OAuth2 (manage_checkout_payment_intents scope)

**Request (Capture):**
```json
{
  "actions": [{
    "action": "capturePayment",
    "amount": {
      "centAmount": 2500,
      "currencyCode": "CAD"
    }
  }]
}
```

**Request (Cancel):**
```json
{
  "actions": [{
    "action": "cancelPayment"
  }]
}
```

**Request (Refund):**
```json
{
  "actions": [{
    "action": "refundPayment",
    "amount": {
      "centAmount": 2500,
      "currencyCode": "CAD"
    }
  }]
}
```

**Response:**
```json
{
  "outcome": "approved"  // or "rejected" or "received"
}
```

### Harry Rosen API Integration

**Important:** Harry Rosen uses **two separate servers** for different operations:

- **Balance Server:** `https://ckinttest.harryrosen.com:5010`
  - Used for: Health checks (status), balance checks

- **Transaction Server:** `https://crmapptest.harryrosen.com:8000`
  - Used for: Redeem, refund operations

The processor automatically routes requests to the correct server.

#### Endpoints

#### GET /

Health check (no auth).

**Server:** Balance Server (`ckinttest.harryrosen.com:5010`)

**Response:** `"OK"` (plain text)

#### POST /api/giftcard/balance

Check balance (Basic Auth).

**Server:** Balance Server (`ckinttest.harryrosen.com:5010`)

**Request:**
```json
{
  "pan": "1234567890123456",
  "pin": "1234"
}
```

**Response:**
```json
{
  "amount": 50.00  // In dollars
}
```

#### POST /api/giftcard/redeem

Redeem amount (Basic Auth).

**Server:** Transaction Server (`crmapptest.harryrosen.com:8000`)

**Request:**
```json
{
  "pan": "1234567890123456",
  "pin": "1234",
  "amount": 25.00,
  "reference_id": "cart-id-123",
  "reason": "purchase"
}
```

**Response:**
```json
{
  "reference_id": "transaction-id-xyz"
}
```

#### POST /api/giftcard/return

Refund/return (Basic Auth).

**Server:** Transaction Server (`crmapptest.harryrosen.com:8000`)

**Request:**
```json
{
  "pan": "1234567890123456",
  "pin": "1234",
  "amount": 25.00,
  "currency": "CAD",
  "reference_id": "transaction-id-xyz",
  "program": "bold"
}
```

**Response:**
```json
{
  "reference_id": "refund-id-abc"
}
```

---

## Troubleshooting

### Common Issues

#### 1. Health Check Shows "Unavailable"

**Symptom:** Status endpoint returns empty `checks: []`

**Causes:**
- Harry Rosen API unreachable
- VPN not connected
- Wrong credentials

**Solutions:**
```bash
# Test balance server connectivity
curl https://ckinttest.harryrosen.com:5010/api/giftcard/balance \
  -u "username:password" \
  -H "Content-Type: application/json" \
  -d '{"pan":"1234567890123456","pin":"1234"}'

# Test transaction server connectivity
curl https://crmapptest.harryrosen.com:8000/

# Check credentials in .env
cat processor/.env | grep HARRYROSEN

# Verify both URLs are configured
echo "Balance URL: $HARRYROSEN_BALANCE_URL"
echo "Transaction URL: $HARRYROSEN_TRANSACTION_URL"

# Check logs
cd processor
npm run dev
# Look for "Harry Rosen API Error" in logs
```

#### 2. Session Not Active

**Symptom:** `401 Unauthorized - Session is not active`

**Causes:**
- Cart state is not "Active"
- Session expired
- Wrong session ID

**Solutions:**
- Verify cart state in commercetools
- Create new session
- Check X-Session-Id header

#### 3. Currency Mismatch

**Symptom:** `Currency not match` error

**Cause:** `MOCK_CONNECTOR_CURRENCY` ≠ cart currency

**Solution:**
```bash
# In processor/.env
MOCK_CONNECTOR_CURRENCY=CAD  # Must match cart currency
```

#### 4. Invalid Card Number/PIN

**Symptom:** Client-side validation errors

**Causes:**
- Card number not numeric
- Card number ≤ 12 characters
- PIN not numeric

**Solutions:**
- Use only numeric characters
- Card number must be >12 digits
- PIN must be numeric

#### 5. Build Errors

**Symptom:** TypeScript compilation errors

**Solution:**
```bash
cd processor
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Debug Mode

Enable detailed logging:

```bash
# In processor/.env
LOGGER_LEVEL=debug

# Restart processor
npm run dev
```

### Testing Connectivity

```bash
# Test Harry Rosen Balance Server
curl -u "username:password" \
  -X POST https://ckinttest.harryrosen.com:5010/api/giftcard/balance \
  -H "Content-Type: application/json" \
  -d '{"pan":"1234567890123456","pin":"1234"}'

# Test Harry Rosen Transaction Server (health check)
curl https://crmapptest.harryrosen.com:8000/

# Test processor health
curl http://localhost:8081/operations/status

# Test with JWT
curl http://localhost:9000/jwt/token \
  -H "Content-Type: application/json" \
  -d '{"iss":"https://mc-api.us-central1.gcp.commercetools.com","sub":"test","https://mc-api.us-central1.gcp.commercetools.com/claims/project_key":"your-project"}'
```

---

## Advanced Topics

### Extending for Other Gift Card Providers

The connector is designed to be extended:

1. **Create New Client:**
   ```typescript
   // processor/src/clients/acme-giftcard.client.ts
   export class AcmeGiftCardClient {
     async balance(request) { /* ... */ }
     async redeem(request) { /* ... */ }
     async refund(request) { /* ... */ }
   }
   ```

2. **Create New Service:**
   ```typescript
   // processor/src/services/acme-giftcard.service.ts
   export class AcmeGiftCardService extends AbstractGiftCardService {
     async balance(code, pin) { /* ... */ }
     async redeem(request) { /* ... */ }
     // ...
   }
   ```

3. **Update App:**
   ```typescript
   // processor/src/server/app.ts
   const giftCardService = new AcmeGiftCardService({...});
   ```

### Multi-Currency Support

To support multiple currencies, deploy separate connectors:

```
harryrosen-giftcard-cad (MOCK_CONNECTOR_CURRENCY=CAD)
harryrosen-giftcard-usd (MOCK_CONNECTOR_CURRENCY=USD)
```

Each deployment handles one currency.

### Custom Validation Rules

Add custom validation in the service:

```typescript
// processor/src/services/harryrosen-giftcard.service.ts

private validatePAN(pan: string) {
  // Add custom business rules
  if (pan.startsWith('9999')) {
    return { valid: false, error: 'Test cards not allowed' };
  }
  // ...
}
```

### Analytics and Logging

Add custom logging:

```typescript
import { log } from '../libs/logger';

async balance(code: string, pin: string) {
  log.info('Balance check started', {
    cardPrefix: code.slice(0, 6),
    timestamp: new Date().toISOString()
  });

  const result = await this.harryRosenClient.balance({pan: code, pin});

  log.info('Balance check completed', {
    success: true,
    balanceInCents: Math.round(result.amount * 100)
  });
}
```

---

## Support and Resources

### Documentation
- [commercetools Connect Docs](https://docs.commercetools.com/connect)
- [Checkout Integration Guide](https://docs.commercetools.com/checkout)
- [Payment SDK Reference](https://github.com/commercetools/connect-payments-sdk)

### Getting Help
- Review CLAUDE.md for AI-assisted development
- Check processor/README.md for quick reference
- Search existing issues in repository

### Contributing
1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

---

**Last Updated:** February 2026
**Connector Version:** 0.2.0
**commercetools Connect:** Latest
