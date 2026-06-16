# SabagaPulse Implementation Plan

This plan reflects the current Prisma, Clerk, Inngest, Stripe, Nango, Genkit,
and React Flow implementation in the repository.

## Phase 1 - Workflow Designer Recovery

Status: Complete

- Workflow creation redirects to a usable full-height editor.
- Empty workflows show a clear starting state.
- Steps can be added, edited, connected, deleted, and persisted.
- Workflow status values match the Prisma enum.

## Phase 2 - Platform Baseline

Status: Complete

Goal: establish a reliable development and production build before adding more
features.

Acceptance criteria:

- `npm run typecheck` passes.
- `npm run build` passes with the supported local dependency APIs.
- Shared workflow and credential types match their Prisma records and UI forms.
- Prisma, Clerk, Stripe, Nango, Genkit, and Inngest integrations compile against
  their installed versions.
- Secrets remain server-only and encrypted credential data is never returned to
  client components.

## Phase 3 - Durable Workflow Execution

Status: Complete

Goal: execute published workflows reliably through Inngest.

Acceptance criteria:

- Manual, webhook, and cron triggers create one run record.
- The runner follows graph connections, including If/Else, Switch, and Parallel.
- API Request, Wait, Email, Database Query, Custom Code, and App Action steps
  produce structured logs.
- Failures update run and workflow status with actionable error messages.
- Circular graphs and missing connections fail safely.

Implemented:

- Publish-time validation for trigger count, configuration, references,
  reachability, and cycles.
- A testable graph engine for linear, If/Else, Switch, and Parallel execution.
- Durable Inngest adapters for actions and all configured wait modes.
- Idempotent run creation from the Inngest event ID.
- Structured step input, output, duration, execution ID, and failure logs.
- Server-side API request, Resend email, database query, custom code, and app
  action execution paths.
- Automated graph tests plus passing TypeScript and production builds.

## Phase 4 - Credentials And Integrations

Status: Complete

Goal: make external connections usable by workflow steps.

Acceptance criteria:

- API key and database credentials can be created, updated, and deleted.
- OAuth connections use Nango and can be reconnected or revoked.
- Workflow execution decrypts credentials only on the server.
- Integration-specific actions replace mocked App Action responses.

Implemented:

- API key, basic authentication, and PostgreSQL URL credentials support create,
  partial update, encrypted storage, and deletion.
- OAuth credentials use Nango for connection and reconnection, and revoke the
  Nango connection before deletion.
- App Action nodes select a specific organization credential and retain their
  canonical node identity after configuration.
- App Event triggers select a specific organization credential, and
  WooCommerce triggers show the provider webhook delivery URL, topic, and
  signing secret needed for inbound events.
- Provider-specific request adapters cover every action currently exposed for
  Shopify, WooCommerce, Gmail, Slack, Google Sheets, GitHub, Trello, Discord,
  Jira, Asana, HubSpot, Twilio WhatsApp, Stripe, Airtable, Notion, Zendesk,
  Freshdesk, Salesforce, and Zoho CRM.
- OAuth actions execute through the Nango proxy; API key and basic-auth actions
  execute through authenticated public HTTPS endpoints without logging secrets.
- Database credentials power real read-only query tests and server-side workflow
  execution.
- Integration request and graph compatibility tests pass alongside TypeScript
  and the production build.

## Phase 5 - Monitoring And Versioning

Status: Complete

Goal: make workflow behavior observable and recoverable.

Acceptance criteria:

- Runs list and run details show step input, output, duration, and errors.
- Workflow history captures meaningful graph changes without duplicate versions.
- Revert restores steps and connections consistently.
- Dashboard charts use persisted run data.

Implemented:

- The runs page shows persisted status, workflow, trigger, duration, run errors,
  and expandable step input, output, duration, and failure details.
- Dedicated run detail pages show trigger payloads and complete step telemetry,
  including execution IDs and timestamps, with organization-scoped access.
- Active run polling no longer causes repeated fetch loops, and run API failures
  are surfaced in the interface.
- Workflow versions are created only for meaningful graph changes using
  canonical graph comparison and serializable updates.
- Client saves are ordered, historical duplicate version numbers are collapsed,
  and revert waits for pending saves before restoring the complete step graph.
- The dashboard activity chart uses persisted run records grouped by UTC date
  and separates successful, failed, and active/other statuses.
- Monitoring and versioning regression tests pass alongside TypeScript and the
  production build.

## Phase 6 - Billing And Plan Enforcement

Status: Complete

Goal: enforce commercial limits consistently.

Acceptance criteria:

- Stripe checkout, portal, and webhooks update the organization plan.
- Workflow, step, run, retention, and member limits are enforced server-side.
- Billing state and Clerk organization metadata stay synchronized.
- Failed payments and subscription cancellation have defined product behavior.

Implemented:

- Self-serve Stripe Checkout is limited to paid upgrade paths, while existing
  paid subscriptions are managed through the Stripe customer portal.
- Stripe subscription webhooks map configured price IDs to plans, sync the
  database, and update Clerk organization public/private metadata.
- Active and trialing subscriptions grant paid entitlements; incomplete,
  past-due, unpaid, paused, canceled, and failed-payment states downgrade the
  organization to Free and audit the billing event.
- Workflow count, step-per-workflow, monthly run, member, and run-retention
  limits are enforced in server services rather than only in the UI.
- Manual, webhook, cron, and durable Inngest execution paths check current plan
  entitlements before queuing or executing runs.
- Run details and lists respect plan retention windows, and completed old runs
  are pruned after terminal run updates.
- Billing UI reads the database-backed usage summary, shows run, workflow,
  member, step, and retention limits, and handles checkout/portal API errors.
- Billing policy regression tests pass alongside TypeScript and the production
  build.

## Phase 7 - Production Readiness

Status: Local Hardening Complete; External Verification Pending

Goal: prepare a testable, deployable release.

Acceptance criteria:

- Critical service and workflow paths have automated tests.
- Auth, tenancy, webhook signatures, encryption, and code execution are reviewed.
- Environment variables are documented and validated at startup.
- Database migrations, seed data, deployment, and rollback procedures are tested.
- The release has no known critical or high-severity defects.

Implemented:

- Server startup validates required environment variables, including
  `DATABASE_URL`, Clerk keys, and a 64-character hex `ENCRYPTION_KEY`.
- Feature integrations fail with explicit errors when Stripe, Nango, or Resend
  placeholders are used at runtime.
- `.env.example`, `npm run env:check`, and `docs/production-readiness.md`
  document required secrets, feature secrets, release checks, and rollback.
- Incoming workflow webhooks require timing-safe HMAC signatures whenever a
  workflow secret is configured.
- Custom Code execution no longer receives `require`, does not expose Node
  globals, returns JSON-serializable output, and is disabled in production
  unless explicitly enabled.
- Production-readiness tests cover environment validation, webhook signatures,
  and Custom Code restrictions.

External verification needed:

- Real production/staging environment values for Clerk, database, Inngest,
  Stripe, Nango, Resend, and Genkit.
- A staging deployment URL for webhook, OAuth, checkout, portal, and email smoke
  tests.
- Permission to run database migration/deploy and rollback checks against a
  staging database.
- A decision on production Custom Code execution: keep disabled or provide an
  isolated execution runtime.
