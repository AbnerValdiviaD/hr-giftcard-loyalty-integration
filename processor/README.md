# Harry Rosen Gift Card Connector - Processor

This module provides a commercetools Connect processor for integrating Harry Rosen gift cards with commercetools Checkout. It handles gift card balance checks, redemptions, and refunds by communicating with the Harry Rosen Gift Card API.

## Overview

The processor acts as middleware between commercetools Checkout and the Harry Rosen Gift Card API:
- Receives requests from the enabler (frontend) via session-based authentication
- Validates gift card numbers and PINs
- Communicates with Harry Rosen API for balance, redeem, and refund operations
- Updates commercetools payment and cart entities
- Handles payment lifecycle operations (capture, cancel, refund)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- commercetools project with Checkout enabled
- Harry Rosen Gift Card API credentials
- commercetools API client with required scopes

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the processor directory:

```bash
# commercetools Configuration
CTP_PROJECT_KEY=your-project-key
CTP_CLIENT_ID=your-client-id
CTP_CLIENT_SECRET=your-client-secret
CTP_AUTH_URL=https://auth.us-central1.gcp.commercetools.com
CTP_API_URL=https://api.us-central1.gcp.commercetools.com
CTP_SESSION_URL=https://session.us-central1.gcp.commercetools.com
CTP_JWKS_URL=https://mc-api.us-central1.gcp.commercetools.com/.well-known/jwks.json
CTP_JWT_ISSUER=https://mc-api.us-central1.gcp.commercetools.com

# Harry Rosen API Configuration
# Harry Rosen uses different servers for different operations:
# - Status (health check) & Balance: ckinttest.harryrosen.com:5010
# - Transactions (redeem/refund): crmapptest.harryrosen.com:8000
HARRYROSEN_BALANCE_URL=https://ckinttest.harryrosen.com:5010
HARRYROSEN_TRANSACTION_URL=https://crmapptest.harryrosen.com:8000
HARRYROSEN_USER=your-username
HARRYROSEN_PASSWORD=your-password

# Connector Configuration
MOCK_CONNECTOR_CURRENCY=CAD

# Optional
LOGGER_LEVEL=info
HEALTH_CHECK_TIMEOUT=5000
```

### Required API Scopes

Your commercetools API client must have these scopes:

- `manage_payments` - Create/update payment entities
- `manage_orders` - Access cart and order information
- `view_sessions` - Retrieve session data for authentication
- `view_api_clients` - Validate API credentials
- `manage_checkout_payment_intents` - Handle payment modifications
- `introspect_oauth_tokens` - Validate OAuth tokens

**Tip:** Use the "Payment connector for checkout" template when creating the API client in Merchant Center.

### Required Custom Type

Your commercetools project must have a payment custom type with these fields:
- `giftCardCode` (String) - Stores card number during two-step flow
- `giftCardPin` (String) - Stores PIN during two-step flow

## Development

### Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `/dist` folder.

### Run Locally

```bash
npm run dev
```

Starts the processor on `http://localhost:8081` (or configured port).

### Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix
```

## Project Structure

```
processor/
├── src/
│   ├── clients/                      # API clients
│   │   ├── harryrosen-giftcard.client.ts    # Harry Rosen API client (production)
│   │   ├── giftcard-mock.client.ts          # Mock client (testing)
│   │   └── types/
│   ├── services/                     # Business logic
│   │   ├── abstract-giftcard.service.ts     # Base service class
│   │   ├── harryrosen-giftcard.service.ts   # Harry Rosen implementation (production)
│   │   ├── giftcard-mock.service.ts         # Mock implementation (testing)
│   │   └── converters/                       # Data converters
│   ├── routes/                       # API routes
│   │   └── giftcard.route.ts                # Gift card endpoints
│   ├── dtos/                         # Data transfer objects
│   │   └── giftcard.dto.ts                  # Request/response types
│   ├── errors/                       # Error handling
│   │   └── giftcard-api.error.ts            # Custom errors
│   ├── server/                       # Server setup
│   │   ├── app.ts                           # Main application
│   │   └── plugins/
│   │       └── giftcard.plugin.ts           # Fastify plugin
│   └── config/                       # Configuration
│       └── config.ts                         # Environment config
├── test/                             # Test files
│   └── giftcard-mock.service.spec.ts
└── dist/                             # Compiled output
```

## API Endpoints

### Health Check

**Endpoint:** `GET /operations/status`

**Authentication:** JWT (from Merchant Center)

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
      "status": "UP"
    }
  ],
  "metadata": {
    "name": "Harry Rosen Gift Card Connector",
    "description": "Gift card integration with Harry Rosen",
    "currency": "CAD"
  }
}
```

### Check Balance

**Endpoint:** `POST /balance`

**Authentication:** Session (X-Session-Id header)

**Request:**
```json
{
  "code": "1234567890123456",
  "securityCode": "1234"
}
```

**Response:**
```json
{
  "status": {
    "state": "Valid"
  },
  "amount": {
    "centAmount": 5000,
    "currencyCode": "CAD"
  }
}
```

### Redeem Gift Card

**Endpoint:** `POST /redeem`

**Authentication:** Session (X-Session-Id header)

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
  "paymentReference": "payment-id-123"
}
```

### Payment Modifications

**Endpoint:** `POST /operations/payment-intents/{paymentId}`

**Authentication:** OAuth2 (with `manage_checkout_payment_intents` scope)

**Supported Actions:**
- `capturePayment` - Finalize payment
- `cancelPayment` - Void/cancel payment
- `refundPayment` - Refund payment

**Request (Refund Example):**
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
  "outcome": "approved"
}
```

## Validation Rules

### Gift Card Number (PAN)
- ✅ Must be numeric
- ✅ Must be more than 12 characters
- ✅ Trimmed before validation

### PIN
- ✅ Must be numeric
- ✅ Trimmed before validation

## Error Handling

The connector provides user-friendly error messages:

| Error Code | Message |
|------------|---------|
| `NotFound` | Gift card not found |
| `Expired` | Gift card has expired |
| `ZeroBalance` | Gift card has zero balance |
| `CurrencyNotMatch` | Currency mismatch |
| `InvalidCardNumber` | Invalid card number format |
| `InvalidPIN` | Invalid PIN format |
| `MissingSecurityCode` | PIN is required |

## Deployment

### Deploy to commercetools Connect

```bash
# Deploy connector (private by default)
npm run connector:post-deploy
```

The connector will be deployed as an **Organization Connector** (private to your organization).

### Post-Deployment

After deployment, configure the connector in Merchant Center:
1. Go to Settings → Connectors
2. Find "Harry Rosen Gift Card Connector"
3. Install to your project
4. Configure payment integration settings

## Testing

### Local Testing with Mock JWT Server

```bash
# Start mock JWT server
docker compose up -d

# Get test JWT token
curl -X POST http://localhost:9000/jwt/token \
  -H 'Content-Type: application/json' \
  -d '{
    "iss": "https://mc-api.us-central1.gcp.commercetools.com",
    "sub": "subject",
    "https://mc-api.us-central1.gcp.commercetools.com/claims/project_key": "your-project-key"
  }'

# Use token in requests
curl http://localhost:8081/operations/status \
  -H "Authorization: Bearer <token>"
```

### Test vs Production

- **Production:** Uses `HarryRosenGiftCardService` (configured in `src/server/app.ts`)
- **Testing:** Uses `GiftCardMockService` for unit tests
- Switch implementation in `app.ts` by changing which service is instantiated

## Harry Rosen API Integration

### Endpoints Used

| Operation | Endpoint | Method | Auth |
|-----------|----------|--------|------|
| Health Check | `/` | GET | None |
| Balance | `/api/giftcard/balance` | POST | Basic Auth |
| Redeem | `/api/giftcard/redeem` | POST | Basic Auth |
| Refund | `/api/giftcard/return` | POST | Basic Auth |

### Currency Conversion

Harry Rosen API uses **dollars**, commercetools uses **cents**:

```typescript
// To Harry Rosen: cents → dollars
const amountInDollars = centAmount / 100;

// From Harry Rosen: dollars → cents
const centAmount = Math.round(amountInDollars * 100);
```

## Troubleshooting

### Health Check Times Out

If the health check shows Harry Rosen API as "DOWN":
- Check VPN connection to Harry Rosen network
- Verify `HARRYROSEN_URL` is correct
- Test connectivity: `curl https://ckinttest.harryrosen.com:5010/`

### 401 Unauthorized

- Verify `HARRYROSEN_USER` and `HARRYROSEN_PASSWORD` are correct
- Check if API credentials have expired

### Session Not Active

- Ensure cart is in "Active" state
- Verify session was created with `manage_sessions` scope
- Check `X-Session-Id` header is being sent

## Support

For issues or questions:
- Check [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed guides
- Review [CLAUDE.md](../CLAUDE.md) for development guidelines
- Open an issue in the repository

## License

[Your License Here]
