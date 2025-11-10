# Technical Writer Guide

**Your Role:** Complete Project Documentation  
**Sections:** 16  
**Duration:** Week 9 (5-7 days)  
**Dependencies:** All sections (1-15)

---

## Overview

You are responsible for creating comprehensive documentation that enables:
- Developers to understand and maintain the codebase
- Operators to use the system effectively
- Deployment teams to set up production
- Stakeholders to understand the architecture

**Section 16**: Create all project documentation including README, API docs, architecture diagrams, and deployment guides.

---

## Section 16: Documentation & Handoff

### Timeline
- **Start**: After all sections complete (especially Section 15 - CI/CD)
- **Duration**: 5-7 days

### Objective
Create production-ready documentation for developers, operators, and stakeholders.

---

### Day 1: Root README & Getting Started

**README.md (already exists, enhance it):**
```markdown
# Oasis Travel

Privacy-first travel management platform built with React Native, Next.js, and Supabase.

## Overview

Oasis Travel is a complete travel operations platform consisting of:
- **Mobile App** (React Native) - Customer-facing trip planning and management
- **Operator Console** (Next.js) - Internal operations dashboard
- **Vendor Portal** (Next.js) - Vendor order and inventory management

## Features

### For Customers
- 🤖 AI-powered trip planning bot
- 📱 Guest mode with seamless OTP sign-in
- 📄 Quote comparison and version tracking
- 🗺️ Live trip channel with updates
- 🚨 Emergency support (≤5 min response)
- 📴 Offline-first architecture

### For Operators
- 📊 Kanban board for lead management
- ✏️ Visual quote builder
- 🏢 Unified trip workspace
- ⏱️ Real-time SLA monitoring
- 🚦 Incident management dashboard

### For Vendors
- 📦 Purchase order management
- 📄 Voucher upload with validation
- 💰 Seasonal rate plans
- 🚗 Driver roster management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native (Expo), TypeScript, Expo Router |
| **Web** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL 15+, Auth, Storage, Edge Functions) |
| **State** | React Query, Zustand |
| **UI** | React Native Paper (mobile), Radix UI (web) |
| **Validation** | Zod |
| **Monorepo** | TurboRepo |

## Getting Started

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- pnpm (`npm install -g pnpm`)
- Supabase CLI (`npm install -g supabase`)
- For mobile: Expo CLI (`npm install -g expo-cli eas-cli`)

### Installation

\`\`\`bash
# Clone repository
git clone https://github.com/your-org/oasis-travel.git
cd oasis-travel

# Install dependencies
pnpm install

# Start Supabase locally
supabase start
# Note the API URL and keys shown

# Configure environment
cp apps/mobile/.env.example apps/mobile/.env
cp apps/console/.env.example apps/console/.env
cp apps/vendor/.env.example apps/vendor/.env
# Update .env files with Supabase credentials

# Load seed data (optional)
psql $DATABASE_URL -f supabase/seed.sql

# Start development servers
pnpm dev
\`\`\`

### Access Points

- **Mobile**: Expo DevTools at http://localhost:8081
- **Console**: http://localhost:3000
- **Vendor Portal**: http://localhost:3001
- **Supabase Studio**: http://localhost:54323

## Project Structure

\`\`\`
oasis-travel/
├── apps/
│   ├── mobile/          # React Native customer app
│   ├── console/         # Next.js operator console
│   └── vendor/          # Next.js vendor portal
├── packages/
│   ├── api/             # Shared API client (Supabase + types)
│   ├── ui/              # Shared UI components
│   ├── utils/           # Shared utilities
│   └── config/          # Shared configs
├── supabase/
│   ├── migrations/      # SQL migrations
│   ├── functions/       # Edge functions (Deno)
│   ├── seed.sql         # Test data
│   └── tests/           # Database tests
└── docs/
    ├── API.md           # API documentation
    ├── ARCHITECTURE.md  # Architecture overview
    └── DEPLOYMENT.md    # Deployment guide
\`\`\`

## Development

### Common Commands

\`\`\`bash
# Run all apps
pnpm dev

# Run specific app
pnpm dev --filter=@oasis/mobile
pnpm dev --filter=@oasis/console

# Build all
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Type check
pnpm typecheck
\`\`\`

### Database Management

\`\`\`bash
# Create migration
supabase migration new migration_name

# Apply migrations
supabase db reset

# Generate types
supabase gen types typescript --local > packages/api/src/database.types.ts
\`\`\`

### Deploy Edge Functions

\`\`\`bash
supabase functions deploy pdf_generate_quote
supabase functions deploy scheduler_post_runner
supabase functions deploy sla_monitor
supabase functions deploy recap_generator
\`\`\`

## Testing

\`\`\`bash
# Unit tests
pnpm test

# E2E tests
cd apps/console && npx playwright test

# Database tests
psql $DATABASE_URL -f supabase/tests/test_rls.sql

# Integration tests
./supabase/tests/test_rpcs.sh
\`\`\`

## Documentation

- [API Reference](./docs/API.md) - Complete API documentation
- [Architecture](./docs/ARCHITECTURE.md) - System architecture
- [Deployment](./docs/DEPLOYMENT.md) - Deployment guide
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines

## Security & Privacy

- **Row-Level Security (RLS)**: All tables enforce user isolation
- **Private Storage**: Files require signed URLs (60-300s TTL)
- **No PII in Channels**: Display names only, no phone numbers
- **Audit Trail**: All mutations logged with before/after states

## License

[Your License Here]

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/oasis-travel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/oasis-travel/discussions)
- **Email**: support@oasistravel.com
\`\`\`

---

### Day 2-3: API Documentation

**docs/API.md:**
```markdown
# API Documentation

Complete API reference for Oasis Travel platform.

## Authentication

All API calls require authentication via Supabase Auth.

### Sign In with OTP

\`\`\`bash
curl -X POST "https://[project-ref].supabase.co/auth/v1/otp" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
\`\`\`

### Verify OTP

\`\`\`bash
curl -X POST "https://[project-ref].supabase.co/auth/v1/verify" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "email": "user@example.com",
    "token": "123456"
  }'
\`\`\`

## RPC Functions

### Lead Management

#### Create Lead from Guest

Creates a new lead for guest users before authentication.

**Endpoint**: `POST /rest/v1/rpc/rpc_create_lead_from_guest`

**Parameters**:
- `p_guest_session_id` (string, required): Unique guest session ID
- `p_minimal_request` (jsonb, required): Travel request details

**Request**:
\`\`\`bash
curl -X POST "https://[project-ref].supabase.co/rest/v1/rpc/rpc_create_lead_from_guest" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_guest_session_id": "guest-123",
    "p_minimal_request": {
      "destinations": ["Udaipur", "Jaipur"],
      "nights": 5,
      "pax_adults": 2
    }
  }'
\`\`\`

**Response**:
\`\`\`json
"550e8400-e29b-41d4-a716-446655440000"
\`\`\`
Returns the lead UUID.

**Errors**:
- `400`: Missing required fields
- `500`: Database error

---

#### Merge Guest to User

Merges guest session data to authenticated user.

**Endpoint**: `POST /rest/v1/rpc/rpc_merge_guest_to_user`

**Parameters**:
- `p_guest_session_id` (string, required): Guest session to merge

**Request**:
\`\`\`bash
curl -X POST "https://[project-ref].supabase.co/rest/v1/rpc/rpc_merge_guest_to_user" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_guest_session_id": "guest-123"
  }'
\`\`\`

**Response**: `null` (success)

---

### Quote Management

#### Send Quote

Freezes quote snapshot and marks as sent.

**Endpoint**: `POST /rest/v1/rpc/rpc_send_quote`

**Parameters**:
- `p_quote_id` (uuid, required): Quote ID to send

**Request**:
\`\`\`bash
curl -X POST "https://[project-ref].supabase.co/rest/v1/rpc/rpc_send_quote" \
  -H "apikey: YOUR_SERVICE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_quote_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
\`\`\`

**Response**: `null` (success)

**Side Effects**:
- Quote status → SENT
- Snapshot frozen (immutable)
- Lead stage → QUOTED

---

#### Accept Quote

Accepts a sent quote and creates booking.

**Endpoint**: `POST /rest/v1/rpc/rpc_accept_quote`

**Parameters**:
- `p_quote_id` (uuid, required): Quote ID to accept

**Request**:
\`\`\`bash
curl -X POST "https://[project-ref].supabase.co/rest/v1/rpc/rpc_accept_quote" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_quote_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
\`\`\`

**Response**:
\`\`\`json
"660e8400-e29b-41d4-a716-446655440000"
\`\`\`
Returns the booking UUID.

**Side Effects**:
- Creates booking with PENDING_VENDOR_CONFIRM status
- Quote status → ACCEPTED
- Lead stage → WON

---

### Booking Management

#### Upload Voucher

Vendor uploads booking confirmation voucher.

**Endpoint**: `POST /rest/v1/rpc/rpc_upload_voucher`

**Parameters**:
- `p_booking_id` (uuid, required): Booking ID
- `p_vendor_id` (uuid, required): Vendor ID
- `p_file_url` (text, required): Storage path to uploaded file
- `p_meta` (jsonb, optional): Parsed voucher metadata

**Request**:
\`\`\`bash
curl -X POST "https://[project-ref].supabase.co/rest/v1/rpc/rpc_upload_voucher" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_booking_id": "660e8400-e29b-41d4-a716-446655440000",
    "p_vendor_id": "770e8400-e29b-41d4-a716-446655440000",
    "p_file_url": "vouchers/booking123/vendor456/file.pdf",
    "p_meta": {
      "guest_name": "John Doe",
      "check_in": "2024-12-15",
      "check_out": "2024-12-19",
      "booking_id": "HOTEL2024001"
    }
  }'
\`\`\`

**Response**:
\`\`\`json
"880e8400-e29b-41d4-a716-446655440000"
\`\`\`
Returns the voucher UUID.

**Side Effects**:
- Creates voucher record
- PO status → CONFIRMED
- May trigger booking confirmation if all vouchers uploaded

---

### Trip Management

#### Raise Incident

Creates a support incident for a trip.

**Endpoint**: `POST /rest/v1/rpc/rpc_raise_incident`

**Parameters**:
- `p_trip_id` (uuid, required): Trip ID
- `p_severity` (text, required): P0, P1, or P2
- `p_category` (text, required): Incident category
- `p_description` (text, required): Incident description

**Request**:
\`\`\`bash
curl -X POST "https://[project-ref].supabase.co/rest/v1/rpc/rpc_raise_incident" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_trip_id": "770e8400-e29b-41d4-a716-446655440000",
    "p_severity": "P0",
    "p_category": "emergency",
    "p_description": "Vehicle breakdown on highway"
  }'
\`\`\`

**Response**:
\`\`\`json
"990e8400-e29b-41d4-a716-446655440000"
\`\`\`
Returns the incident UUID.

**Side Effects**:
- Creates incident record
- If P0: Notifies operators immediately

---

## PostgREST Queries

### Get Leads

**Endpoint**: `GET /rest/v1/leads`

\`\`\`bash
curl "https://[project-ref].supabase.co/rest/v1/leads?select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
\`\`\`

**Response**:
\`\`\`json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "440e8400-e29b-41d4-a716-446655440000",
    "stage": "NEW",
    "source": "bot",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
\`\`\`

### Get Quotes for Lead

**Endpoint**: `GET /rest/v1/quotes`

\`\`\`bash
curl "https://[project-ref].supabase.co/rest/v1/quotes?lead_id=eq.550e8400-e29b-41d4-a716-446655440000&select=*,quote_items(*)" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
\`\`\`

---

## Storage API

### Generate Signed URL

**Endpoint**: `POST /rest/v1/rpc/rpc_sign_url`

**Parameters**:
- `p_bucket` (text, required): Bucket name
- `p_path` (text, required): File path
- `p_ttl_seconds` (int, optional): Time to live (default: 300)

**Request**:
\`\`\`bash
curl -X POST "https://[project-ref].supabase.co/rest/v1/rpc/rpc_sign_url" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_bucket": "vouchers",
    "p_path": "booking123/vendor456/file.pdf",
    "p_ttl_seconds": 300
  }'
\`\`\`

**Response**:
\`\`\`json
"https://[project-ref].supabase.co/storage/v1/object/sign/vouchers/booking123/vendor456/file.pdf?token=..."
\`\`\`

---

## Rate Limits

- Anonymous requests: 100/minute
- Authenticated requests: 1000/minute
- Edge functions: 500 invocations/hour

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid auth |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
\`\`\`

---

### Day 4: Architecture Documentation

**docs/ARCHITECTURE.md:**
```markdown
# Architecture Overview

## System Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                         Clients                               │
├──────────────────────┬──────────────────┬──────────────────┤
│   Mobile App (RN)    │  Console (Next) │  Vendor (Next)   │
│   - Expo             │  - App Router   │  - App Router    │
│   - Expo Router      │  - Tailwind     │  - Tailwind      │
│   - React Query      │  - Radix UI     │  - Radix UI      │
└─────────────────────┬┴─────────────────┴┬─────────────────┘
                       │                   │
                       ▼                   ▼
              ┌────────────────────────────────┐
              │    Shared Packages (TurboRepo)  │
              ├────────────────────────────────┤
              │  @oasis/api  │  @oasis/utils  │
              │  - Types     │  - Date/Money   │
              │  - Client    │  - Validation   │
              │  - Zod       │  - i18n         │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │          Supabase              │
              ├────────────────────────────────┤
              │  PostgreSQL 15+                │
              │  - Row Level Security          │
              │  - RPC Functions               │
              │  - Triggers & Constraints      │
              ├────────────────────────────────┤
              │  Auth                          │
              │  - OTP (Email/Phone)           │
              │  - Session Management          │
              ├────────────────────────────────┤
              │  Storage                       │
              │  - Private Buckets             │
              │  - Signed URLs                 │
              ├────────────────────────────────┤
              │  Edge Functions (Deno)         │
              │  - PDF Generation              │
              │  - Schedulers (Cron)           │
              │  - SLA Monitoring              │
              └────────────────────────────────┘
\`\`\`

## Data Flow

### Customer Journey

1. **Guest Mode**
   - User opens mobile app
   - UUID generated, stored in SecureStore
   - Can browse, plan trips

2. **Lead Creation**
   - Bot collects: destinations, nights, pax
   - \`rpc_create_lead_from_guest()\` called
   - Lead + RequestDoc created

3. **OTP Sign-In**
   - User ready to save/book
   - Phone/Email OTP flow
   - \`rpc_merge_guest_to_user()\` merges data

4. **Quote Acceptance**
   - Operator creates quote (DRAFT)
   - \`rpc_send_quote()\` freezes snapshot → SENT
   - Customer reviews, accepts
   - \`rpc_accept_quote()\` creates Booking

5. **Booking Confirmation**
   - POs sent to vendors
   - Vendors upload vouchers
   - \`rpc_confirm_booking_if_ready()\` → CONFIRMED
   - Trip created automatically

6. **Trip Experience**
   - Scheduled posts appear in channel
   - Quick actions (Confirm pickup, etc.)
   - Emergency support (P0 incidents)

### Operator Workflow

1. **Lead Management**
   - Kanban board (NEW → SCOPING → QUOTED → WON/LOST)
   - Drag-drop to change stages

2. **Quote Building**
   - Day-wise timeline
   - Add items (hotel/cab/activity)
   - Pull from rate plans
   - Generate PDF

3. **Booking Management**
   - Unified Trip Workspace (6 tabs)
   - Track POs with SLA timers
   - Verify vouchers
   - Manage incidents

### Vendor Workflow

1. **Order Management**
   - View POs with due dates
   - Accept/Decline with reason

2. **Voucher Upload**
   - Upload PDF
   - Enter metadata (guest name, dates, booking ID)
   - Validation checklist

3. **Inventory**
   - Manage rate plans (seasonal)
   - Manage driver roster

## Database Design

### Key Tables

**Leads** → **Quotes** (versioned) → **Bookings** → **Trips**

**Supporting Tables**:
- \`profiles\` - User roles (customer/operator/vendor/driver)
- \`vendors\` - Service providers
- \`rate_plans\` - Seasonal pricing
- \`pos\` - Purchase orders to vendors
- \`vouchers\` - Confirmation documents
- \`trip_posts\` - Communication channel
- \`incidents\` - Support issues

### Status State Machines

**Lead**: NEW → SCOPING → QUOTED → WON | LOST

**Quote**: DRAFT → SENT → ACCEPTED | DECLINED → ARCHIVED

**Booking**: PENDING_VENDOR_CONFIRM → CONFIRMED → IN_TRIP → COMPLETED | CANCELLED

**PO**: SENT → ACCEPTED → CONFIRMED | DECLINED

**Incident**: OPEN → ACK → RESOLVED | CANCELLED

### Indexes

Optimized for:
- Lead/quote lookups by customer
- Booking status queries
- PO due date searches
- Trip post scheduling
- Incident severity filtering

## Security Model

### Row-Level Security (RLS)

Every table has RLS policies:

**Customers**:
- See only their own leads/quotes/bookings/trips
- Cannot see other customers' data

**Operators**:
- See all data (no restrictions)
- Can mutate leads/quotes/bookings

**Vendors**:
- See only POs addressed to them
- Can upload vouchers for their orders
- Manage their own rate plans/drivers

**Example Policy**:
\`\`\`sql
create policy "Customers see own bookings"
  on bookings for select
  using (customer_id = auth.uid());
\`\`\`

### Storage Security

- All buckets private by default
- Access via signed URLs only
- TTL: 60-300 seconds
- Path conventions enforced:
  - \`vouchers/{booking_id}/{vendor_id}/{uuid}.pdf\`

### Audit Trail

All mutations logged:
\`\`\`sql
insert into audit_log (
  actor, action, entity, entity_id,
  before, after
) values (...);
\`\`\`

## Scalability

### Current Limits

- Database: PostgreSQL handles 10K+ concurrent connections
- Storage: Unlimited file size, bandwidth
- Edge Functions: 500 invocations/hour (expandable)

### Optimization Strategies

1. **Database**
   - Indexes on all foreign keys
   - Materialized views for complex joins
   - Connection pooling (pgBouncer)

2. **Frontend**
   - React Query caching (5 min stale time)
   - Offline-first mobile app
   - Lazy loading of images

3. **Backend**
   - Edge functions at CDN edge
   - Cron jobs for batch operations
   - RPC functions for complex logic

## Deployment

### Environments

- **Development**: Local Supabase + local apps
- **Staging**: Supabase cloud + Vercel preview
- **Production**: Supabase cloud + Vercel production

### CI/CD Pipeline

1. **PR Created**
   - Run linter, type check
   - Run unit tests
   - Build all apps

2. **PR Merged to Main**
   - Deploy migrations to staging
   - Deploy edge functions
   - Deploy web apps to Vercel
   - Build mobile apps (EAS)

3. **Tagged Release**
   - Deploy to production
   - Submit mobile builds to stores

## Monitoring

- **Supabase Logs**: Edge function execution
- **Sentry**: Frontend error tracking
- **Audit Log**: Business event tracking
- **Custom Dashboard**: SLA metrics, incident counts
\`\`\`

---

### Day 5: Deployment Guide

**docs/DEPLOYMENT.md:**
```markdown
# Deployment Guide

## Prerequisites

- [ ] Supabase projects created (dev, staging, prod)
- [ ] Vercel account set up
- [ ] Expo account with EAS
- [ ] GitHub repository
- [ ] Domain names configured

## Environment Setup

### Development
\`\`\`bash
# Local Supabase
supabase start

# Update .env files with local credentials
\`\`\`

### Staging
1. Create Supabase project: \`oasis-travel-staging\`
2. Note project ref and keys
3. Update GitHub secrets:
   - \`SUPABASE_STAGING_REF\`
   - \`SUPABASE_STAGING_URL\`
   - \`SUPABASE_STAGING_ANON_KEY\`
   - \`SUPABASE_STAGING_SERVICE_KEY\`

### Production
1. Create Supabase project: \`oasis-travel-prod\`
2. Configure custom domain
3. Update GitHub secrets (similar to staging)

## Database Deployment

### Initial Setup
\`\`\`bash
# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Load seed data (staging only)
psql $DATABASE_URL -f supabase/seed.sql
\`\`\`

### Ongoing Migrations
\`\`\`bash
# Create migration
supabase migration new add_new_feature

# Test locally
supabase db reset

# Deploy to staging
supabase db push --linked

# Deploy to production (after testing)
supabase link --project-ref PROD_REF
supabase db push
\`\`\`

## Edge Functions Deployment

\`\`\`bash
# Deploy all functions
supabase functions deploy pdf_generate_quote
supabase functions deploy scheduler_post_runner
supabase functions deploy sla_monitor
supabase functions deploy recap_generator

# Set secrets
supabase secrets set OPENAI_API_KEY=xxx
\`\`\`

## Web Apps Deployment

### Console (Vercel)
\`\`\`bash
cd apps/console
vercel login
vercel link
vercel --prod
\`\`\`

**Vercel Environment Variables**:
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_KEY\`

### Vendor Portal (Vercel)
Similar to console.

## Mobile App Deployment

### Configure EAS
\`\`\`bash
cd apps/mobile
eas login
eas build:configure
\`\`\`

**eas.json**:
\`\`\`json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$SUPABASE_STAGING_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$SUPABASE_STAGING_ANON_KEY"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$SUPABASE_PROD_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$SUPABASE_PROD_ANON_KEY"
      }
    }
  }
}
\`\`\`

### Build & Submit
\`\`\`bash
# Build for staging
eas build --platform all --profile staging

# Build for production
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
\`\`\`

## Rollback Procedures

### Database
\`\`\`bash
# List migrations
supabase migration list

# Rollback one migration
supabase migration down

# Restore from backup
# Via Supabase dashboard: Database → Backups → Restore
\`\`\`

### Web Apps
- Vercel: Dashboard → Deployments → Promote previous deployment

### Mobile
- Cannot rollback app store releases
- Issue hotfix build immediately

## Health Checks

### Database
\`\`\`sql
SELECT COUNT(*) FROM leads; -- Should return data
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;
\`\`\`

### Edge Functions
\`\`\`bash
curl https://[project-ref].supabase.co/functions/v1/scheduler_post_runner \
  -H "Authorization: Bearer $SERVICE_KEY"
\`\`\`

### Web Apps
- Check https://console.oasistravel.com/health
- Monitor Vercel analytics

### Mobile
- Check Sentry for crash reports
- Monitor Expo analytics

## Monitoring

### Supabase Dashboard
- Database connections
- API usage
- Storage usage
- Function invocations

### Vercel
- Deployment status
- Function logs
- Analytics

### Sentry
- Error rates
- User sessions
- Performance metrics

## Backup Strategy

### Database
- Automated daily backups (7-day retention)
- Point-in-time recovery (PITR) available
- Manual backups before major releases

### Storage
- Files auto-replicated across regions
- No manual backup needed

### Code
- Git repository (GitHub)
- Tagged releases

## Security Checklist

- [ ] All RLS policies enabled
- [ ] Service role keys secured (environment variables only)
- [ ] Storage buckets private
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Audit logging active

## Troubleshooting

### Migration Fails
- Check for syntax errors
- Verify constraints don't conflict
- Check RLS policies allow operation

### Edge Function Errors
- Check function logs in Supabase dashboard
- Verify secrets are set
- Test locally first

### Deployment Fails
- Verify environment variables set
- Check build logs
- Ensure dependencies installed

## Support

- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- EAS: https://docs.expo.dev/eas/
\`\`\`

---

### Day 6-7: Contributing Guide & Final Polish

**CONTRIBUTING.md:**
```markdown
# Contributing Guide

Thank you for contributing to Oasis Travel!

## Getting Started

1. Fork the repository
2. Clone your fork: \`git clone https://github.com/YOUR_USERNAME/oasis-travel.git\`
3. Create a branch: \`git checkout -b feature/my-feature\`
4. Make your changes
5. Run tests: \`pnpm test\`
6. Commit: \`git commit -m "feat: add my feature"\`
7. Push: \`git push origin feature/my-feature\`
8. Create Pull Request

## Code Standards

### TypeScript
- Use strict mode
- No \`any\` types
- Document complex functions

### Naming Conventions
- Files: \`kebab-case.tsx\`
- Components: \`PascalCase\`
- Functions: \`camelCase\`
- Constants: \`UPPER_SNAKE_CASE\`

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation
- \`test:\` Tests
- \`refactor:\` Code refactoring
- \`style:\` Formatting
- \`chore:\` Maintenance

### Testing
- Write tests for new features
- Maintain >70% coverage
- Test RLS policies for new tables

## Pull Request Process

1. Update documentation
2. Add tests
3. Run \`pnpm lint\` and fix issues
4. Request review from maintainers
5. Address review comments
6. Squash commits before merge

## Questions?

- Open an issue
- Join discussions
- Email: dev@oasistravel.com
\`\`\`

---

## Deliverables Checklist

- [ ] Enhanced root README.md
- [ ] Complete API documentation (docs/API.md)
- [ ] Architecture overview (docs/ARCHITECTURE.md)
- [ ] Deployment guide (docs/DEPLOYMENT.md)
- [ ] Contributing guide (CONTRIBUTING.md)
- [ ] Architecture diagrams (optional: Mermaid/diagrams.net)
- [ ] Troubleshooting guide
- [ ] API examples for all RPCs
- [ ] Environment setup instructions
- [ ] Rollback procedures
- [ ] Monitoring guidelines

---

## Success Criteria

✅ Section 16 Complete When:
- Documentation is comprehensive and clear
- Any developer can set up locally
- Operators understand how to use the system
- Deployment is well-documented
- API is fully documented with examples
- Architecture is explained with diagrams
- Contributing guidelines are clear
- All documentation reviewed and approved

---

## Documentation Tools

Optional tools for enhancing documentation:
- **Diagrams**: [diagrams.net](https://app.diagrams.net/) or Mermaid
- **API Docs**: Swagger/OpenAPI for interactive docs
- **Screenshots**: Use for console/mobile guides
- **Videos**: Screen recordings for complex workflows

---

## Final Handoff

Once complete:
1. Review all documentation with team
2. Test setup instructions with new developer
3. Publish to project wiki/docs site
4. Create "Getting Started" video (optional)
5. Announce documentation availability to stakeholders

