# Oasis Travel - Documentation Index

## Overview

This project has been organized into **detailed, role-specific guides** that allow different agents/developers to work independently on their assigned sections.

---

## Master Documents

### 1. `00-PROJECT-MASTER-GUIDE.md` ⭐ **START HERE**
**Read this first!**

Contains:
- Project overview and architecture
- Complete execution order with phase dependencies
- Agent role assignments
- Critical path and parallel work streams
- Communication protocols
- Environment setup for all agents
- Success criteria and timeline

**Who should read**: Everyone

---

### 2. `QUICK-START.md` ⚡
**Quick reference for getting started**

Contains:
- Prerequisites installation
- Initial setup steps
- Environment configuration
- Common commands
- Troubleshooting guide
- Daily workflow

**Who should read**: Everyone (for quick setup)

---

### 3. `prompt.md` 📋
**Complete backend specification**

Contains:
- Database schema (all tables)
- RPC function specifications
- Edge function requirements
- Storage bucket policies
- Security & privacy principles
- Status state machines
- Acceptance tests

**Who should read**: All backend engineers

---

### 4. `appoverview.md` 🎨
**Frontend architecture & specifications**

Contains:
- Mobile app structure (React Native)
- Web console structure (Next.js)
- Vendor portal structure
- Shared packages architecture
- UI/UX specifications
- Navigation flows
- Implementation steps

**Who should read**: All frontend engineers

---

## Agent-Specific Guides

Each guide contains:
- ✅ Role responsibilities
- ✅ Section assignments
- ✅ Timeline and duration
- ✅ Dependencies (what must be done first)
- ✅ Detailed step-by-step instructions
- ✅ Code examples and templates
- ✅ Test requirements
- ✅ Deliverables checklist
- ✅ Handoff instructions

---

### `01-devops-engineer.md`
**Agent:** DevOps/Infrastructure Engineer  
**Sections:** 1 (Week 1), 15 (Week 9)  
**Duration:** 2 days + 5 days

**Responsibilities:**
- Section 1: Monorepo setup (TurboRepo, apps, packages)
- Section 15: CI/CD pipelines (GitHub Actions, EAS, Vercel)

**Blocks:** All other sections (Section 1 must complete first)

**Contents:**
- Complete TurboRepo initialization
- Expo, Next.js app scaffolding
- Package structure setup
- Environment templates
- CI/CD configuration
- Deployment automation

---

### `02-backend-engineer-primary.md`
**Agent:** Backend Engineer (Primary)  
**Sections:** 2, 3, 6  
**Duration:** 6-8 days (Week 1-2)

**Responsibilities:**
- Section 2: Database schema & migrations (20+ tables)
- Section 3: Row-Level Security policies
- Section 6: Storage buckets & policies

**Depends on:** Section 1  
**Blocks:** Sections 4, 5, 7

**Contents:**
- 7 migration files with full SQL
- Complete RLS policies for all tables
- Storage bucket setup
- Signed URL generation
- Test scripts

---

### `03-backend-engineer-services.md`
**Agent:** Backend Engineer (Services)  
**Sections:** 4, 5  
**Duration:** 5-6 days (Week 2-3)

**Responsibilities:**
- Section 4: RPC Functions (business logic in SQL)
- Section 5: Edge Functions (TypeScript serverless)

**Depends on:** Sections 2, 3  
**Blocks:** Section 7

**Contents:**
- 10+ RPC functions (leads, quotes, bookings, trips, incidents)
- 4 edge functions (PDF gen, schedulers, SLA monitor)
- Audit logging implementation
- Cron job setup

---

### `04-fullstack-engineer.md`
**Agent:** Full-Stack Engineer  
**Sections:** 7, 8  
**Duration:** 5 days (Week 1-3)

**Responsibilities:**
- Section 8: Shared Utils Package (dates, money, strings, validation)
- Section 7: Shared API Package (typed Supabase client, Zod schemas)

**Section 8 depends on:** Nothing (start immediately)  
**Section 7 depends on:** Section 4  
**Blocks:** Sections 9, 10, 11, 12, 13

**Contents:**
- Complete utility library (date, money, strings, validation, feature flags)
- TypeScript types for all database tables
- Zod schemas for validation
- Typed RPC wrappers
- PostgREST query helpers

---

### `05-mobile-engineer-lead.md`
**Agent:** Mobile Engineer (Lead)  
**Sections:** 9, 10  
**Duration:** 10-12 days (Week 3-6)

**Responsibilities:**
- Section 9: Mobile app core (auth, navigation, state management)
- Section 10: Core features (bot intake, quotes, trips)

**Depends on:** Sections 7, 8  
**Blocks:** Section 11

**Contents:**
- Expo Router navigation setup
- Guest mode → OTP → merge auth flow
- React Query + Zustand state management
- Bot intake 3-step flow
- Quotes list/detail/compare screens
- Trip screen (dayboard, vouchers, channel)

---

### `06-mobile-engineer-features.md`
**Agent:** Mobile Engineer (Features)  
**Sections:** 11  
**Duration:** 5-7 days (Week 5-6)

**Responsibilities:**
- Section 11: Support & emergency features

**Depends on:** Section 9

**Contents:**
- Support screen with incident reporting
- Emergency bottom sheet (P0 incidents)
- Push notifications setup
- Accessibility implementation
- Offline caching

---

### `07-frontend-engineer-console.md`
**Agent:** Frontend Engineer (Console)  
**Sections:** 12  
**Duration:** 10-12 days (Week 4-6)

**Responsibilities:**
- Section 12: Operator web console (Next.js)

**Depends on:** Sections 7, 8

**Contents:**
- Next.js App Router structure
- Leads Kanban board
- Quote builder with day timeline
- Unified Trip Workspace (6 tabs)
- PO management with SLA timers
- Incident management panel

---

### `08-frontend-engineer-vendor.md`
**Agent:** Frontend Engineer (Vendor)  
**Sections:** 13  
**Duration:** 8-10 days (Week 4-6)

**Responsibilities:**
- Section 13: Vendor portal (Next.js)

**Depends on:** Sections 7, 8

**Contents:**
- Vendor-specific auth
- PO orders list/detail
- Voucher upload with validation checklist
- Rate plans season editor
- Driver roster management

---

### `09-qa-engineer.md`
**Agent:** QA Engineer  
**Sections:** 14  
**Duration:** 7-10 days (Week 8)

**Responsibilities:**
- Section 14: Testing & seed data

**Depends on:** All feature sections (2-13)

**Contents:**
- Seed data creation (users, vendors, sample trips)
- SQL/pgTAP tests for RLS
- Integration tests for RPCs
- Frontend unit tests
- E2E test scripts (optional)

---

### `10-technical-writer.md`
**Agent:** Technical Writer  
**Sections:** 16  
**Duration:** 5-7 days (Week 9)

**Responsibilities:**
- Section 16: Complete documentation

**Depends on:** All sections

**Contents:**
- Comprehensive README
- API documentation with curl examples
- Architecture diagrams
- Deployment guide
- Troubleshooting guide

---

## Execution Order

### ✅ Can Start Immediately:
1. Section 1 (DevOps) - **CRITICAL PATH**
2. Section 8 (Utils Package)

### ✅ After Section 1:
3. Section 2 (Database Schema)

### ✅ After Section 2:
4. Section 3 (RLS Policies)
5. Section 6 (Storage Buckets) - can parallel with Section 3

### ✅ After Section 3:
6. Section 4 (RPC Functions)

### ✅ After Section 4:
7. Section 5 (Edge Functions)
8. Section 7 (API Package)

### ✅ After Sections 7 & 8:
9. Section 9 (Mobile Core)
10. Section 12 (Web Console) - parallel with 9
11. Section 13 (Vendor Portal) - parallel with 9

### ✅ After Section 9:
12. Section 10 (Mobile Features)
13. Section 11 (Mobile Support) - parallel with 10

### ✅ Final Sequence:
14. Section 14 (Testing) - after all features
15. Section 15 (CI/CD) - after testing
16. Section 16 (Documentation) - final step

---

## Critical Path (Longest Sequential Dependency Chain)

```
Section 1 → Section 2 → Section 3 → Section 4 → Section 7 → Section 9 → Section 10
```

**Estimated duration on critical path:** ~5 weeks

All other sections can be parallelized around this path.

---

## File Structure Created

```
oasis-travel/
├── 00-PROJECT-MASTER-GUIDE.md        ⭐ Main project guide
├── QUICK-START.md                     ⚡ Setup quick reference
├── DOCUMENTATION-INDEX.md             📚 This file
│
├── 01-devops-engineer.md              🔧 Infrastructure & CI/CD
├── 02-backend-engineer-primary.md     💾 Database & RLS
├── 03-backend-engineer-services.md    ⚙️  RPCs & Edge Functions
├── 04-fullstack-engineer.md           🔗 Shared Packages
├── 05-mobile-engineer-lead.md         📱 Mobile Core & Features
├── 06-mobile-engineer-features.md     🎯 Mobile Support
├── 07-frontend-engineer-console.md    🖥️  Operator Console
├── 08-frontend-engineer-vendor.md     🏪 Vendor Portal
├── 09-qa-engineer.md                  🧪 Testing & Quality
├── 10-technical-writer.md             📝 Documentation
│
├── prompt.md                          📋 Backend Specification
└── appoverview.md                     🎨 Frontend Architecture
```

---

## How to Use This Documentation

### For Project Managers / Leads:
1. Read `00-PROJECT-MASTER-GUIDE.md` for complete project overview
2. Assign agents to their respective guides
3. Track progress using the phase structure
4. Monitor critical path dependencies

### For Individual Developers / Agents:
1. Start with `QUICK-START.md` to set up your environment
2. Read `00-PROJECT-MASTER-GUIDE.md` to understand the big picture
3. **Find your role** in the list above
4. **Open your specific guide** (e.g., `05-mobile-engineer-lead.md`)
5. **Check dependencies** - ensure prerequisite sections are complete
6. **Follow step-by-step instructions** in your guide
7. **Complete deliverables checklist** before marking done
8. **Handoff to next agent** as instructed

### For Backend Engineers:
Also read: `prompt.md` for complete specification

### For Frontend Engineers:
Also read: `appoverview.md` for complete specification

---

## Success Metrics

Each guide includes:
- ✅ Deliverables checklist
- ✅ Success criteria
- ✅ Test requirements
- ✅ Handoff procedures

**Project is complete when:**
- [ ] All 16 sections marked complete
- [ ] All tests passing
- [ ] CI/CD pipeline green
- [ ] Documentation complete
- [ ] Apps deployed to staging

---

## Estimated Timeline

With **4-6 agents working in parallel**:

| Week | Phase | Sections | Agents Active |
|------|-------|----------|---------------|
| 1 | Foundation | 1, 2, 8 | 3 agents |
| 2 | Backend Core | 3, 4, 6 | 2 agents |
| 3 | Backend Services | 5, 7 | 2 agents |
| 4-6 | Frontend Apps | 9-13 | 4 agents |
| 7 | Integration | - | All agents |
| 8 | Testing | 14 | 2 agents |
| 9 | Deploy & Docs | 15, 16 | 2 agents |

**Total: ~9 weeks with optimal parallelization**

---

## Questions?

- Check your agent-specific guide first
- Review the master guide
- Consult specification documents (`prompt.md`, `appoverview.md`)
- Ask in team standups

---

**Generated for the Oasis Travel project**  
**Privacy-first travel management platform**

