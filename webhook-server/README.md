# Stripe Webhook Server

This lightweight Node.js server listens to Stripe webhooks and updates Firebase stock + order history.

## Setup
1. Copy `.env.example` to `.env` and fill values:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT` (path to service account JSON)
2. Download a Firebase service account key and save it as `serviceAccountKey.json` in this folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Local webhook forwarding
Use Stripe CLI:
```bash
stripe listen --forward-to localhost:4242/webhook
```

When checkout completes, the webhook updates stock and writes order history.
