# Oasis Travel - Project Master Guide

## Project Overview

Building a privacy-first travel management platform with:
- **Mobile App**: React Native (Expo) for customers
- **Web Console**: Next.js for operators
- **Vendor Portal**: Next.js for vendors
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)

## Repository Structure

```
oasis-travel/
├── apps/
│   ├── mobile/          # React Native Expo app (customers)
│   ├── console/         # Next.js operator console
│   └── vendor/          # Next.js vendor portal
├── packages/
│   ├── api/             # Shared API client & types
│   ├── ui/              # Shared UI components
│   ├── utils/           # Shared utilities
│   └── config/          # Shared configs (TS, ESLint, Prettier)
├── supabase/
│   ├── migrations/      # SQL migration files
│   ├── functions/       # Edge functions (Deno/TypeScript)
│   ├── seed.sql         # Seed data for dev/staging
│   └── tests/           # SQL and integration tests
└── docs/
    ├── api/             # API documentation
    └── architecture/    # Architecture diagrams
```

## Agent Roles & Assignments

| Agent Role | Sections | Duration | Files to Read |
|------------|----------|----------|---------------|
| **DevOps Engineer** | 1, 15 | Week 1 + Week 9 | `01-devops-engineer.md` |
| **Backend Engineer (Primary)** | 2, 3, 6 | Week 1-2 | `02-backend-engineer-primary.md` |
| **Backend Engineer (Services)** | 4, 5 | Week 2-3 | `03-backend-engineer-services.md` |
| **Full-Stack Engineer** | 7, 8 | Week 1-3 | `04-fullstack-engineer.md` |
| **Mobile Engineer (Lead)** | 9, 10 | Week 3-6 | `05-mobile-engineer-lead.md` |
| **Mobile Engineer (Features)** | 11 | Week 5-6 | `06-mobile-engineer-features.md` |
| **Frontend Engineer (Console)** | 12 | Week 4-6 | `07-frontend-engineer-console.md` |
| **Frontend Engineer (Vendor)** | 13 | Week 4-6 | `08-frontend-engineer-vendor.md` |
| **QA Engineer** | 14 | Week 8 | `09-qa-engineer.md` |
| **Technical Writer** | 16 | Week 9 | `10-technical-writer.md` |

## Execution Phases & Dependencies

### Phase 1: Foundation (Week 1)
**Must complete in this order:**
1. DevOps Engineer starts Section 1 ✓
2. Full-Stack Engineer starts Section 8 (parallel with Step 1) ✓
3. Backend Engineer (Primary) starts Section 2 (after Section 1) ✓

### Phase 2: Backend Core (Week 1-2)
**After Phase 1:**
4. Backend Engineer (Primary) does Sections 3 & 6 (can be parallel) ✓
5. Backend Engineer (Services) starts Section 4 (after Section 3) ✓

### Phase 3: Backend Services (Week 2-3)
**After Phase 2:**
6. Backend Engineer (Services) does Section 5 ✓
7. Full-Stack Engineer does Section 7 (after Section 4) ✓

### Phase 4: Frontend Applications (Week 3-6)
**After Phase 3 (all can be parallel):**
8. Mobile Engineer (Lead) does Section 9 ✓
9. Frontend Engineer (Console) does Section 12 ✓
10. Frontend Engineer (Vendor) does Section 13 ✓

### Phase 5: Frontend Features (Week 5-7)
**After Section 9:**
11. Mobile Engineer (Lead) does Section 10 ✓
12. Mobile Engineer (Features) does Section 11 (parallel with 10) ✓

### Phase 6: Quality & Deployment (Week 8-9)
**After all features:**
13. QA Engineer does Section 14 ✓
14. DevOps Engineer does Section 15 ✓
15. Technical Writer does Section 16 ✓

## Critical Dependencies

```
Section 1 (Infrastructure)
    ├── Section 2 (Database Schema)
    │   ├── Section 3 (RLS Policies)
    │   │   └── Section 4 (RPC Functions)
    │   │       ├── Section 5 (Edge Functions)
    │   │       └── Section 7 (Shared API Package)
    │   │           ├── Section 9 (Mobile Core)
    │   │           │   ├── Section 10 (Mobile Features)
    │   │           │   └── Section 11 (Mobile Support)
    │   │           ├── Section 12 (Web Console)
    │   │           └── Section 13 (Vendor Portal)
    │   └── Section 6 (Storage Buckets)
    └── Section 8 (Shared Utils) [independent]

All → Section 14 (Testing) → Section 15 (CI/CD) → Section 16 (Documentation)
```

## Communication & Coordination

### Daily Standups
Each agent should report:
1. What I completed yesterday
2. What I'm working on today
3. Any blockers or dependencies waiting

### Blocking Dependencies
If you're blocked waiting for another section:
- Check the dependency status in the shared tracker
- Review the interface/contract you need
- Mock the dependency if possible
- Communicate with the dependent agent

### Integration Points
Key integration points between agents:

1. **Backend → Full-Stack Engineer**: 
   - Share RPC function signatures
   - Share database table types
   
2. **Full-Stack → Frontend Engineers**:
   - Share API client package once ready
   - Share type definitions
   
3. **All → QA Engineer**:
   - Document testing procedures
   - Share test credentials
   
4. **All → DevOps**:
   - Provide environment variable requirements
   - Document deployment steps

## Environment Setup (All Agents)

### Prerequisites
```bash
# Install Node.js 18+
node --version  # Should be v18+

# Install pnpm or npm
npm install -g pnpm

# Install Supabase CLI
npm install -g supabase

# For mobile development
npm install -g expo-cli eas-cli
```

### Getting Started
```bash
# Clone repository (once available)
git clone [REPO_URL]
cd oasis-travel

# Install dependencies
pnpm install

# Copy environment files
cp apps/mobile/.env.example apps/mobile/.env
cp apps/console/.env.example apps/console/.env
cp apps/vendor/.env.example apps/vendor/.env

# Start Supabase locally
supabase start

# Run all apps in dev mode
pnpm dev
```

### Supabase Credentials
After running `supabase start`, you'll get:
```
API URL: http://localhost:54321
Anon key: [ANON_KEY]
Service Role key: [SERVICE_KEY]
```

Add these to your `.env` files.

## Best Practices

### Code Standards
- **TypeScript**: Strict mode enabled, no `any` types
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: Document complex business logic
- **Error Handling**: Always handle errors explicitly

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-section-name

# Make commits (atomic, descriptive)
git commit -m "feat: implement lead creation RPC"

# Push and create PR
git push origin feature/your-section-name
```

### Commit Message Format
```
feat: add new feature
fix: fix a bug
docs: documentation changes
test: add tests
refactor: code refactoring
style: formatting changes
chore: maintenance tasks
```

### Testing Requirements
- Backend RPCs: Write SQL tests
- Frontend components: Write unit tests (>70% coverage)
- Integration: Test critical user flows
- All PRs must pass CI checks

## Troubleshooting

### Common Issues

**Monorepo dependencies not resolving:**
```bash
pnpm install --force
```

**Supabase connection errors:**
```bash
supabase stop
supabase start
# Update .env files with new credentials
```

**TypeScript errors in workspace packages:**
```bash
pnpm build  # Build packages first
```

**Port conflicts:**
```bash
# Edit package.json dev scripts to use different ports
# Mobile: 8081
# Console: 3000
# Vendor: 3001
```

## Success Criteria

### Phase Completion Checklist

**Phase 1 Complete When:**
- [ ] All 3 apps start with `pnpm dev`
- [ ] Database migrations run successfully
- [ ] Shared utils package importable

**Phase 2 Complete When:**
- [ ] All RLS policies active
- [ ] Storage buckets created
- [ ] Test users can't access other users' data

**Phase 3 Complete When:**
- [ ] All RPC functions callable via curl
- [ ] Edge functions deployed
- [ ] API package exports all functions

**Phase 4 Complete When:**
- [ ] Mobile app shows auth flow
- [ ] Console shows leads board
- [ ] Vendor portal shows orders list

**Phase 5 Complete When:**
- [ ] Mobile bot flow works end-to-end
- [ ] Quote acceptance creates booking
- [ ] Trip channel displays posts

**Phase 6 Complete When:**
- [ ] All tests passing
- [ ] CI/CD pipeline green
- [ ] Documentation complete

## Support & Resources

### Reference Documents
- `prompt.md` - Complete backend specification
- `appoverview.md` - Frontend & architecture overview
- Individual agent guides (`01-*.md` through `10-*.md`)

### Supabase Resources
- [Supabase Docs](https://supabase.com/docs)
- [PostgREST API](https://postgrest.org/en/stable/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Framework Resources
- [Expo Docs](https://docs.expo.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TurboRepo Docs](https://turbo.build/repo/docs)

## Timeline Summary

| Week | Phase | Agents Active | Deliverables |
|------|-------|---------------|--------------|
| 1 | Foundation | DevOps, Backend, Full-Stack | Monorepo, DB Schema, Utils |
| 2 | Backend Core | Backend (both) | RLS, RPCs, Storage |
| 3 | Backend Services | Backend, Full-Stack | Edge Functions, API Package |
| 4-6 | Frontend Apps | Mobile, Frontend (both) | All 3 apps functional |
| 7 | Integration | All | Bug fixes, polish |
| 8 | Testing | QA, All | Test suite complete |
| 9 | Deploy & Docs | DevOps, Writer | Production ready |

**Total Duration: 9 weeks with 4-6 parallel agents**

---

**Next Steps:**
1. Each agent reads their specific guide (`XX-[role].md`)
2. DevOps starts Section 1 immediately
3. Others prepare their development environment
4. Begin daily standups once Phase 1 starts

