# SabagaPulse

**Visual workflow automation for modern teams.** Design, execute, and monitor automated workflows connecting 19+ apps — powered by a drag-and-drop editor, durable execution engine, and AI-assisted function generation.

---

## Features

| Feature | Description |
|---|---|
| **Workflow Designer** | Visual drag-and-drop builder using React Flow — add triggers, actions, conditions, parallel branches, and more |
| **Durable Execution** | Reliable, retryable workflow runs via Inngest with support for Wait, Sleep, and scheduled steps |
| **19+ Integrations** | Shopify, WooCommerce, Gmail, Slack, Google Sheets, GitHub, Trello, Discord, Jira, Asana, HubSpot, Twilio, Stripe, Airtable, Notion, Zendesk, Freshdesk, Salesforce, Zoho CRM |
| **AI Function Generator** | Describe what you need in natural language — Genkit generates the code |
| **Monitoring & Logs** | Real-time run tracking with step-level input/output, duration, and error details |
| **Versioning & Revert** | Automatic version history for every meaningful change, one-click rollback |
| **Billing & Plans** | Self-serve Stripe billing with 4 tiers (Free, Starter, Pro, Enterprise) and server-side quota enforcement |
| **Multi-Tenant** | Clerk-powered org-scoped tenancy with role-based access control |
| **Credential Vault** | AES-256-GCM encrypted storage for API keys, OAuth tokens, and database connections |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, React Flow, Radix UI, Tailwind CSS, Recharts |
| Auth & Multi-tenancy | Clerk (org-scoped, role-based) |
| Database | PostgreSQL via Prisma 7.8 |
| Durable Execution | Inngest |
| OAuth Integrations | Nango |
| Billing | Stripe (Checkout, Portal, Webhooks) |
| Email | Resend |
| AI | Google Genkit |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Clerk account (for auth)

### 1. Clone and Install

```bash
git clone <repo-url> && cd pulse
npm install
```

### 2. Configure Environment

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

**Required variables** (app won't start without these):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled/PgBouncer) |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `ENCRYPTION_KEY` | 64-char hex string for credential encryption |

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Feature-specific variables** — only needed when using those features:

- **Inngest**: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, plan price IDs
- **Nango**: `NANGO_SECRET_KEY`, `NEXT_PUBLIC_NANGO_PUBLIC_KEY`
- **Resend**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- **AI**: `GOOGLE_GENAI_API_KEY`
- **Rate Limiting**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### 3. Set Up Database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

The app runs at [http://localhost:9002](http://localhost:9002).

For the Genkit AI dev server:

```bash
npm run genkit:dev
```

## Project Structure

```
src/
├── ai/                    # Genkit AI flows (function generation, conditions, etc.)
├── app/
│   ├── (dashboard)/       # Dashboard pages (home, workflows, runs, billing, etc.)
│   ├── api/               # API routes (webhooks, billing, inngest, runs)
│   ├── login/             # Clerk login page
│   ├── signup/            # Clerk signup page
│   └── onboarding/        # Org creation onboarding
├── components/            # React components (canvas, dialogs, UI primitives)
├── hooks/                 # Custom React hooks
├── inngest/               # Inngest functions (workflow runner, cron triggers)
├── lib/                   # Core logic (graph engine, types, encryption, billing, etc.)
└── services/              # Server services (workflows, credentials, runs, billing, usage)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack, port 9002) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run tests |
| `npm run lint` | ESLint |
| `npm run env:check` | Validate environment variables |
| `npm run db:validate` | Validate Prisma schema |
| `npm run genkit:dev` | Start Genkit AI dev server |

## Security

- **Credentials**: Encrypted at rest with AES-256-GCM
- **Webhooks**: HMAC signature verification (timing-safe)
- **Custom Code**: Sandboxed execution, disabled in production by default
- **SSRF Protection**: User-provided URLs blocked from targeting internal/private networks
- **SQL Safety**: Database queries enforce read-only transactions
- **RBAC**: Role-based access control on destructive operations

## Deployment

See [docs/production-readiness.md](docs/production-readiness.md) for the full release checklist, security review, smoke tests, and rollback procedure.

## Style Guidelines

- **Primary**: Deep indigo (#3F51B5)
- **Background**: Light gray (#F5F5FA)
- **Accent**: Vibrant cyan (#00BCD4)
- **Fonts**: Space Grotesk (headings), Inter (body)
- **Icons**: Lucide React
- **Theme**: Light / Dark / System toggle

## License

Private — All rights reserved.
