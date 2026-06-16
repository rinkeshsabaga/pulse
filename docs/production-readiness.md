# Production Readiness

This checklist turns Phase 7 into a repeatable release process. Run it for
staging first, then production.

## Environment

Use `.env.example` as the source of required variable names. Production should
set `STRICT_ENV_VALIDATION=true` so placeholder feature values fail before
traffic reaches the app.

Required for the app to start:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `ENCRYPTION_KEY`

Generate `ENCRYPTION_KEY` once per environment:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Feature-specific values are required before using those features:

- Inngest: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, plan price IDs
- Nango: `NANGO_SECRET_KEY`, `NEXT_PUBLIC_NANGO_PUBLIC_KEY`
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Genkit: `GOOGLE_GENAI_API_KEY`

Validation commands:

```bash
npm run env:check
STRICT_ENV_VALIDATION=true npm run env:check
```

## Security Review

Incoming workflow webhooks must include `X-Pulse-Signature` in this format:

```text
sha256=<hex_hmac_sha256_of_raw_body>
```

The HMAC secret is the workflow `webhookSecret`. Requests with a configured
secret and a missing or invalid signature are rejected before billing quota
checks and before Inngest events are queued.

Provider app-event webhooks may use their native signature format when the
incoming route includes the app and event query parameters. WooCommerce
deliveries use the workflow `webhookSecret` as the WooCommerce webhook Secret
and are verified with the `X-WC-Webhook-Signature` base64 HMAC SHA-256 header.
WooCommerce setup pings are acknowledged without queuing workflow runs.

Credential secrets are encrypted server-side and decrypted only in server
services. Keep `ENCRYPTION_KEY` stable; rotating it without a re-encryption
plan makes stored credentials unreadable.

Custom Code is disabled in production unless
`ENABLE_CUSTOM_CODE_EXECUTION=true`. The current local executor removes Node
globals, uses a timeout, disables nested code generation, and stores only
JSON-serializable output. Treat that as a development guardrail, not a strong
multi-tenant security boundary. For production customer code, keep it disabled
or run it in a dedicated isolated runtime with network, CPU, memory, and package
allow-list controls.

## Release Checks

Run these before every release:

```bash
npm run env:check
npm run db:validate
npm test
npm run typecheck
npm run build
```

For staging and production databases:

```bash
npx prisma migrate deploy
```

If this repo has no pending migrations, the command should still be part of the
release runbook so future schema changes are applied consistently.

## External Smoke Tests

After deploying staging:

- Create a Clerk organization and verify organization metadata syncs after a
  billing change.
- Create, publish, and manually run a workflow.
- Trigger a workflow webhook with a valid signature and confirm an invalid
  signature is rejected.
- Create API key, database, and OAuth credentials; reconnect and revoke an OAuth
  connection through Nango.
- Send a Resend email step with a verified sender domain.
- Run Stripe Checkout, portal, `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`, and
  `invoice.payment_failed` events against the deployed webhook endpoint.
- Confirm dashboard charts, run list, run details, version history, and revert
  all use persisted data after a page refresh.
- Confirm plan limits block excess workflows, steps, runs, members, and old run
  retention access server-side.

## Rollback

Keep the previous deployment and database backup available until smoke tests
pass. Roll back in this order:

1. Disable new traffic or revert the deployment.
2. Pause external webhook delivery if the bad release affects billing or
   workflow execution.
3. Restore the database only if the release introduced bad data or incompatible
   migrations.
4. Re-run the external smoke tests on the restored version.
5. Record the failed release cause and the recovery action in the release notes.
