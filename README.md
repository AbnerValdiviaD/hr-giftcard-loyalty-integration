# Harry Rosen Gift Card Connector

commercetools Connect connector for integrating Harry Rosen gift cards with commercetools Checkout.

## Overview

This connector enables Harry Rosen gift cards as a payment method in commercetools Checkout, implementing a two-step payment flow (authorize on apply, capture on order creation) to prevent charging customers for abandoned carts.

### Features

- ✅ Gift card balance checking
- ✅ Partial and full redemptions
- ✅ Multiple gift cards per order
- ✅ Refunds back to gift cards
- ✅ Two-step payment flow (authorize → capture)
- ✅ Session-based security
- ✅ Responsive UI with validation
- ✅ Support for Harry Rosen's dual-server architecture

## Architecture

### Two-Module Structure

**Enabler** (`/enabler`) - Frontend JavaScript library
- Displays gift card input form during checkout
- Handles client-side validation
- Communicates with processor via session authentication
- Built with Vite and TypeScript

**Processor** (`/processor`) - Backend Fastify service
- Middleware between commercetools and Harry Rosen API
- Handles balance checks, redemptions, refunds
- Manages payment lifecycle
- Built with Fastify and TypeScript

## Quick Start

### Prerequisites

1. **commercetools Account**
   - Project with Checkout enabled
   - API client with payment connector scopes
   - Payment custom type with `giftCardCode` and `giftCardPin` fields

2. **Harry Rosen API Credentials**
   - Balance server URL: `https://ckinttest.harryrosen.com:5010`
   - Transaction server URL: `https://crmapptest.harryrosen.com:8000`
   - Username and password

3. **Development Environment**
   - Node.js 18+
   - npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/HarryRosen/hr-giftcard-integration-ct.git
cd hr-giftcard-integration-ct

# Install processor dependencies
cd processor
npm install

# Install enabler dependencies
cd ../enabler
npm install
```

### Configuration

#### 1. Processor Environment Variables

Create `processor/.env`:

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

# Harry Rosen API
HARRYROSEN_BALANCE_URL=https://ckinttest.harryrosen.com:5010
HARRYROSEN_TRANSACTION_URL=https://crmapptest.harryrosen.com:8000
HARRYROSEN_USER=your-username
HARRYROSEN_PASSWORD=your-password

# Connector Settings
MOCK_CONNECTOR_CURRENCY=CAD
LOGGER_LEVEL=info
```

#### 2. Enabler Environment Variables

Create `enabler/.env`:

```bash
VITE_PROCESSOR_URL=http://localhost:8081
```

### Running Locally

#### Option A: With Docker Compose (Recommended)

```bash
# Start all services (JWT server, enabler, processor)
docker compose up
```

#### Option B: Manual

```bash
# Terminal 1: Start JWT mock server
npx --package jwt-mock-server -y start

# Terminal 2: Start processor
cd processor
npm run dev

# Terminal 3: Start enabler
cd enabler
npm run dev
```

### Test the Integration

```bash
# Check health
curl http://localhost:8081/operations/status

# Test balance check
curl -X POST http://localhost:8081/balance \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: your-session-id" \
  -d '{"code":"1234567890123456","securityCode":"1234"}'
```

## Deployment

### Deploy to commercetools Connect

```bash
cd processor
npm run build
npm run connector:post-deploy
```

The connector will be deployed as an **Organization Connector** (private to your commercetools organization).

### Post-Deployment Setup

1. Go to Merchant Center → Settings → Connectors
2. Find "Harry Rosen Gift Card Connector"
3. Install to your project
4. Configure environment variables (Harry Rosen credentials)
5. Set up payment integration in Checkout settings

## API Endpoints

### Processor

- `GET /operations/status` - Health check (JWT auth)
- `POST /balance` - Check gift card balance (Session auth)
- `POST /redeem` - Apply gift card to cart (Session auth)
- `POST /operations/payment-intents/{paymentId}` - Payment modifications (OAuth2 auth)

### Enabler

- Exposes `createGiftCardBuilder()` interface
- Returns `GiftCardComponent` with `mount()`, `balance()`, and `submit()` methods

## Required commercetools Configuration

### API Client Scopes

Your commercetools API client must have these scopes:
- `manage_payments`
- `manage_orders`
- `view_sessions`
- `view_api_clients`
- `manage_checkout_payment_intents`
- `introspect_oauth_tokens`

**Tip:** Use the "Payment connector for checkout" template in Merchant Center.

### Payment Custom Type

Your project must have a payment custom type with these fields:
- **giftCardCode** (String) - Stores card number during authorization
- **giftCardPin** (String) - Stores PIN during authorization

These fields are essential for the two-step payment flow.

## Development

### Build

```bash
# Build processor
cd processor
npm run build

# Build enabler
cd enabler
npm run build
```

### Test

```bash
# Run processor tests
cd processor
npm run test
npm run test:coverage

# Run enabler tests
cd enabler
npm run test
```

### Code Quality

```bash
# Lint
npm run lint

# Fix linting issues
npm run lint:fix
```

## Project Structure

```
├── enabler/                    # Frontend module
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── i18n/              # Translations
│   │   ├── providers/         # Provider interface
│   │   └── style/             # SCSS styles
│   └── public/                # Built assets
├── processor/                  # Backend module
│   ├── src/
│   │   ├── clients/           # Harry Rosen API client
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API endpoints
│   │   ├── dtos/              # Request/response types
│   │   ├── errors/            # Error handling
│   │   └── connectors/        # Lifecycle hooks
│   └── test/                  # Unit tests
├── connect.yaml               # Connector configuration
├── docker-compose.yaml        # Local development setup
├── CLAUDE.md                  # AI development guidelines
└── DOCUMENTATION.md           # Comprehensive documentation

```

## Documentation

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete setup, API reference, and deployment guide
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines for AI-assisted development
- **[processor/README.md](./processor/README.md)** - Processor-specific documentation

## Support

For issues or questions:
- Review [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed guides
- Check processor logs for errors
- Verify Harry Rosen API connectivity
- Test with `/operations/status` endpoint

## License

Proprietary - Harry Rosen / Orium Organization

---

**Version:** 0.2.0
**commercetools Connect:** Latest
**Last Updated:** February 2026
