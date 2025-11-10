# Testing Guide - Section 14 Implementation

This guide provides instructions for running all tests created as part of Section 14: Testing & Seed Data.

## Overview

The testing suite includes:
- **Seed Data**: Comprehensive test data for development/staging
- **RLS Tests**: Database security and access control tests
- **RPC Integration Tests**: Backend function tests
- **Frontend Unit Tests**: React Native component tests
- **E2E Tests**: End-to-end tests for console app
- **Acceptance Tests**: Manual test checklist

---

## Prerequisites

### 1. Install Dependencies

```bash
# Install root dependencies
cd oasis-travel
pnpm install

# Install mobile test dependencies
cd apps/mobile
pnpm install

# Install console test dependencies
cd ../console
pnpm install
```

### 2. Start Supabase

```bash
# Start Supabase locally
supabase start

# Note the credentials:
# - API URL: http://localhost:54321
# - Anon key: (shown in output)
# - Service key: (shown in output)
```

### 3. Load Seed Data

```bash
# Load seed data
psql $DATABASE_URL -f supabase/seed.sql

# Or if using Supabase CLI
supabase db reset  # This runs seed.sql automatically
```

---

## Running Tests

### 1. Seed Data Verification

```bash
# Verify seed data loaded correctly
psql $DATABASE_URL -c "SELECT COUNT(*) FROM profiles;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM leads;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM bookings;"
```

**Expected Output:**
- Profiles: 9+ (2 operators, 1 admin, 3 customers, 3 vendors)
- Leads: 4+
- Bookings: 2+
- Trips: 1+

---

### 2. RLS Tests

```bash
# Run RLS tests
psql $DATABASE_URL -f supabase/tests/test_rls.sql

# With pgTAP (if installed)
# CREATE EXTENSION IF NOT EXISTS pgtap;
# pg_prove supabase/tests/test_rls.sql
```

**Expected:** All 10 RLS tests pass, verifying:
- Customer isolation
- Operator access
- Vendor restrictions
- Anonymous user blocking

---

### 3. RPC Integration Tests

```bash
# Set environment variables
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="your_anon_key"
export SUPABASE_SERVICE_KEY="your_service_key"

# Run RPC tests
./supabase/tests/test_rpcs.sh

# Or with bash
bash supabase/tests/test_rpcs.sh
```

**Expected:** All RPC functions tested:
- `rpc_create_lead_from_guest`
- `rpc_update_lead_stage`
- `rpc_send_quote`
- `rpc_raise_incident`
- `rpc_record_post_action`
- `rpc_confirm_booking_if_ready`
- `rpc_upload_voucher`
- `rpc_submit_cancellation`
- `rpc_sign_url`

---

### 4. Frontend Unit Tests

#### Mobile App Tests

```bash
cd apps/mobile

# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Test Files:**
- `app/components/__tests__/BotMessage.test.tsx`
- `app/components/__tests__/AccessibleButton.test.tsx`
- `app/components/__tests__/OfflineBanner.test.tsx`

**Expected Coverage:** >70% for components

#### Utils Package Tests

```bash
cd packages/utils

# Run tests (uses vitest)
npm test
```

**Test Files:**
- `src/__tests__/money.test.ts`
- `src/__tests__/date.test.ts`
- `src/__tests__/strings.test.ts`
- `src/__tests__/validation.test.ts`
- `src/__tests__/feature-flags.test.ts`

---

### 5. E2E Tests (Console)

```bash
cd apps/console

# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed
```

**Test Files:**
- `e2e/leads.spec.ts`
- `e2e/quotes.spec.ts`
- `e2e/dashboard.spec.ts`

**Note:** E2E tests require:
- Console app running (`npm run dev`)
- Test authentication setup (may need mocking)

---

### 6. Acceptance Tests

Follow the manual test checklist in `test-acceptance.md`:

```bash
# Open the checklist
cat test-acceptance.md
```

**Test Areas:**
1. RLS – Customer Isolation
2. Quote Immutability
3. Accept → Booking Pipeline
4. PO SLA Monitoring
5. Voucher Verification
6. Confirm Booking Readiness
7. Trip Posts Schedule
8. Quick Actions
9. Guest Merge
10. Cancellation Flow
11. Operator Access
12. Vendor Access
13. Incident Severity Handling
14. Audit Logging
15. Storage Access

---

## Test Coverage Goals

### Target Coverage
- **Database/RLS**: 100% of policies tested
- **RPC Functions**: 100% of functions tested
- **Frontend Components**: >70% code coverage
- **E2E Flows**: Critical user journeys covered

### Current Status
Run coverage reports to check:

```bash
# Mobile app coverage
cd apps/mobile && npm run test:coverage

# Utils package coverage
cd packages/utils && npm test -- --coverage
```

---

## Troubleshooting

### Seed Data Issues

**Problem:** Seed data fails to load
```bash
# Check if tables exist
psql $DATABASE_URL -c "\dt"

# Check for foreign key constraints
psql $DATABASE_URL -c "SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';"
```

**Solution:** Ensure all migrations are applied first:
```bash
supabase db reset
```

### RLS Test Failures

**Problem:** RLS tests fail with permission errors
```bash
# Verify RLS is enabled
psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"

# Check RLS policies
psql $DATABASE_URL -c "SELECT * FROM pg_policies WHERE schemaname = 'public';"
```

**Solution:** Ensure RLS migrations are applied.

### RPC Test Failures

**Problem:** RPC tests fail with connection errors
```bash
# Verify Supabase is running
curl http://localhost:54321/rest/v1/

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

**Solution:** Start Supabase and set correct environment variables.

### Frontend Test Failures

**Problem:** Jest/React Native tests fail
```bash
# Clear cache
cd apps/mobile
rm -rf node_modules/.cache
npm test -- --clearCache
```

**Solution:** Reinstall dependencies and clear cache.

### E2E Test Failures

**Problem:** Playwright tests fail
```bash
# Check if app is running
curl http://localhost:3000

# Install browsers
npx playwright install --with-deps
```

**Solution:** Ensure console app is running and browsers are installed.

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: supabase start
      - run: psql $DATABASE_URL -f supabase/seed.sql
      - run: psql $DATABASE_URL -f supabase/tests/test_rls.sql
      - run: ./supabase/tests/test_rpcs.sh
      - run: cd apps/mobile && npm test
      - run: cd packages/utils && npm test
```

---

## Test Data Management

### Development
- Use `supabase/seed.sql` for consistent test data
- Reset database: `supabase db reset`

### Staging
- Use same seed data
- Add production-like data volumes
- Test with realistic user scenarios

### Production
- **NEVER** run seed.sql in production
- Use migrations only
- Test with production backups in staging

---

## Reporting Issues

Use the bug report template:
`.github/ISSUE_TEMPLATE/bug_report.md`

Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs
- Priority level

---

## Success Criteria

✅ Section 14 Complete When:
- [ ] Seed data loads without errors
- [ ] All RLS tests passing
- [ ] All RPC integration tests passing
- [ ] Frontend unit tests >70% coverage
- [ ] All 15 acceptance tests passing
- [ ] No critical bugs found
- [ ] Test documentation complete
- [ ] Ready for staging deployment

---

## Resources

- [pgTAP Documentation](https://pgtap.org/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)

---

**Last Updated:** Section 14 Implementation Complete
**QA Engineer:** Section 14 Testing & Seed Data

