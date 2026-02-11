# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a commercetools Connect template for integrating gift card payment providers with commercetools Checkout. It provides a standardized architecture for treating gift cards as a payment method alongside other payment options like credit cards.

The connector consists of two main modules:
- **Enabler**: Frontend JavaScript library that loads in the browser during checkout, displays gift card input fields, and exposes `balance()` and `submit()` functions
- **Processor**: Backend Fastify service that acts as middleware between commercetools and gift card providers, handling balance checks, redemptions, refunds, and cancellations

## Architecture

### Two-Module Structure

The codebase follows a strict separation between frontend and backend:

1. **Enabler** (`/enabler`):
   - Built with Vite and TypeScript
   - Exports a `GiftcardEnabler` interface from `src/main.ts`
   - Uses session-based authentication via `x-session-id` header
   - Communicates with Processor for all gift card operations

2. **Processor** (`/processor`):
   - Built with Fastify and TypeScript
   - Uses `@commercetools/connect-payments-sdk` for commercetools integration
   - Service layer pattern: `AbstractGiftCardService` → `GiftCardMockService` (to be extended with actual provider integration)
   - Client layer: Mock client in `/clients` (replace with actual provider SDK)

### Key Integration Points

- **Payment SDK Setup** (`processor/src/payment-sdk.ts`): Configures the commercetools Connect Payments SDK with authentication, logging, and request context management
- **Session Management**: Trust established between Enabler and Processor using commercetools Session API
- **Authentication**:
  - JWT validation for Merchant Center operations (`/operations/status`)
  - OAuth2 for payment modifications (`/operations/payment-intents`)
  - Session-based for frontend-to-backend communication

### Service Architecture

The processor uses a service-based architecture:
- `AbstractGiftCardService`: Base class defining the gift card operation interface
- `GiftCardMockService`: Implementation that communicates with mock gift card provider (extend this for actual provider)
- Converters: `BalanceConverter` and `RedemptionConverter` transform between commercetools and provider formats
- Clients: Mock client handles external provider communication (replace with provider SDK)

## Development Commands

### Processor (Backend)

From `/processor` directory:

```bash
# Install dependencies
npm install

# Development
npm run dev          # Run with ts-node
npm run watch        # Run with auto-reload on file changes
npm run start:dev    # Run built version with nodemon

# Build
npm run build        # Compile TypeScript to /dist

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues

# Connector Lifecycle
npm run connector:post-deploy    # Run post-deployment script
npm run connector:pre-undeploy   # Run pre-undeployment script
```

### Enabler (Frontend)

From `/enabler` directory:

```bash
# Install dependencies
npm install

# Development
npm run dev          # Start Vite dev server on port 3000
npm run build        # Build for production to /public

# Testing
npm run test         # Run Jest tests

# Code Quality
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues

# Serving
npm run serve        # Build and serve on port 3000
npm run start        # Serve built files on port 8080
```

### Full Stack Development

From root directory:

```bash
# Start all services with Docker Compose
docker compose up    # Starts JWT server, Enabler, and Processor

# Setup environment files
cp processor/.env.template processor/.env
cp enabler/.env.template enabler/.env
# Then populate with actual values
```

## Configuration

### Required Environment Variables (Processor)

See `processor/src/config/config.ts` for all configuration options:

- **commercetools**:
  - `CTP_PROJECT_KEY`: Project identifier
  - `CTP_CLIENT_ID`, `CTP_CLIENT_SECRET`: API credentials
  - `CTP_AUTH_URL`: OAuth server (default: us-central1)
  - `CTP_API_URL`: API endpoint (default: us-central1)
  - `CTP_SESSION_URL`: Session service endpoint
  - `CTP_JWKS_URL`: JSON Web Key Set URL for JWT validation
  - `CTP_JWT_ISSUER`: JWT issuer for validation

- **Provider-specific**:
  - `MOCK_CONNECTOR_CURRENCY`: Currency code for this deployment (single currency per deployment)

- **Optional**:
  - `LOGGER_LEVEL`: Logging verbosity (default: info)
  - `HEALTH_CHECK_TIMEOUT`: Timeout for status checks in ms (default: 5000)

### Required API Scopes

The commercetools API client must have these scopes:
- `manage_payments`: Create/update payment entities
- `manage_orders`: Access cart and order information
- `view_sessions`: Retrieve session data for authentication
- `view_api_clients`: Validate API credentials
- `manage_checkout_payment_intents`: Handle `/operations/payment-intents` endpoint
- `introspect_oauth_tokens`: Validate OAuth tokens

### Required Custom Type

The connector requires an existing payment custom type with the following fields:
- `giftCardCode` (String): Stores gift card number between authorization and capture
- `giftCardPin` (String): Stores gift card PIN between authorization and capture

These fields are used to implement the two-step payment flow (authorize → capture).

## Extending for a Gift Card Provider

To integrate an actual gift card provider:

1. **Install Provider SDK** (if available):
   ```bash
   cd processor
   npm install <provider-sdk>
   ```

2. **Replace Mock Client** (`processor/src/clients/giftcard-mock.client.ts`):
   - Create new client class that wraps provider SDK
   - Implement balance check, redemption, refund, and void operations
   - Define types in `/clients/types/`

3. **Extend Service** (`processor/src/services/`):
   - Create new service class extending `AbstractGiftCardService`
   - Implement provider-specific logic for each operation
   - Update `processor/src/server/app.ts` to use new service

4. **Update DTOs** (`processor/src/dtos/`):
   - Modify request/response types to match provider's API
   - Update converters to transform between formats

5. **Customize Enabler** (`enabler/src/providers/`):
   - Replace `mock.ts` with provider-specific implementation
   - Update UI components in `enabler/src/components/` for provider's input requirements
   - Modify form validation in `enabler/src/components/form.ts`

6. **Update Configuration**:
   - Add provider-specific environment variables to `connect.yaml`
   - Update `processor/src/config/config.ts` with new config keys

## API Endpoints

### Processor Endpoints

- `GET /operations/status`: Health check (JWT auth) - validates configuration and provider connectivity
- `POST /operations/payment-intents/{paymentId}`: Payment modifications (OAuth2 auth) - supports `capturePayment`, `refundPayment`, `cancelPayment` actions
- Additional endpoints for balance/redemption operations (session auth via `x-session-id` header)

### Enabler Interface

The enabler exposes:
- `createGiftCardBuilder()`: Returns a `GiftCardBuilder`
- `GiftCardBuilder.build(options)`: Creates a `GiftCardComponent`
- `GiftCardComponent`:
  - `mount(selector)`: Mounts UI to DOM
  - `balance()`: Returns `Promise<BalanceType>`
  - `submit(opts)`: Submits payment with optional amount

## Testing Locally with JWT

The processor requires JWT authentication for certain endpoints. For local development:

1. Set JWT URL:
   ```bash
   export CTP_JWKS_URL="http://localhost:9000/jwt/.well-known/jwks.json"
   ```

2. Start JWT mock server:
   ```bash
   docker compose up -d
   ```

3. Get test token:
   ```bash
   curl -X POST http://localhost:9000/jwt/token \
     -H 'Content-Type: application/json' \
     -d '{
       "iss": "https://mc-api.us-central1.gcp.commercetools.com",
       "sub": "subject",
       "https://mc-api.us-central1.gcp.commercetools.com/claims/project_key": "<your-project-key>"
     }'
   ```

4. Use token in Authorization header: `Bearer <token>`

## Important Notes

- Each connector deployment supports only a single currency (configured via `MOCK_CONNECTOR_CURRENCY`)
- The connector uses sessions to maintain trust between Enabler (frontend) and Processor (backend)
- Payment operations should implement retry and recovery mechanisms for external provider failures
- The `connect.yaml` file defines the deployment configuration for commercetools Connect
- Post-deploy and pre-undeploy scripts in `processor/src/connectors/` handle connector lifecycle events
