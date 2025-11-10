# Oasis Travel - Agent-Based Development Guide

## 🎯 What is This?

This project has been organized into **independent, detailed guides** for multiple agents/developers to work in parallel on building the Oasis Travel platform - a privacy-first travel management system.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Supabase CLI

### Installation

```bash
# Install dependencies
pnpm install

# Start Supabase locally
supabase start

# Copy environment files
cp apps/mobile/.env.example apps/mobile/.env
cp apps/console/.env.example apps/console/.env
cp apps/vendor/.env.example apps/vendor/.env

# Update .env files with Supabase credentials from previous step
```

### Development

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm dev --filter=@oasis/mobile
pnpm dev --filter=@oasis/console
pnpm dev --filter=@oasis/vendor
```

### Apps & Packages

- `apps/mobile` - React Native (Expo) customer app
- `apps/console` - Next.js operator console
- `apps/vendor` - Next.js vendor portal
- `packages/api` - Shared API client & types
- `packages/ui` - Shared UI components
- `packages/utils` - Shared utilities
- `packages/config` - Shared configuration

## 📚 Documentation

### New to the Project?

1. **Read First**: [`00-PROJECT-MASTER-GUIDE.md`](./00-PROJECT-MASTER-GUIDE.md) ⭐
   - Complete project overview
   - Execution phases
   - Dependencies
   
2. **Set Up Environment**: [`QUICK-START.md`](./QUICK-START.md) ⚡
   - Prerequisites
   - Installation steps
   - Common commands

3. **Find Your Role**: [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md) 📚
   - All agent guides listed
   - Execution order
   - Success criteria

4. **Start Working**: Open your agent-specific guide (`01-XX.md` through `10-XX.md`)

## Project Structure

See [00-PROJECT-MASTER-GUIDE.md](./00-PROJECT-MASTER-GUIDE.md) for complete documentation.

---

## 📋 Agent Guides

| # | Role | Guide | Duration | Start When |
|---|------|-------|----------|------------|
| 1 | DevOps Engineer | [`01-devops-engineer.md`](./01-devops-engineer.md) | Week 1 + 9 | Now |
| 2 | Backend Engineer (Primary) | [`02-backend-engineer-primary.md`](./02-backend-engineer-primary.md) | Week 1-2 | After #1 |
| 3 | Backend Engineer (Services) | [`03-backend-engineer-services.md`](./03-backend-engineer-services.md) | Week 2-3 | After #2, #3 |
| 4 | Full-Stack Engineer | [`04-fullstack-engineer.md`](./04-fullstack-engineer.md) | Week 1-3 | #8 now, #7 after #4 |
| 5 | Mobile Engineer (Lead) | [`05-mobile-engineer-lead.md`](./05-mobile-engineer-lead.md) | Week 3-6 | After #4 |
| 6 | Mobile Engineer (Features) | `06-mobile-engineer-features.md` | Week 5-6 | After #5 |
| 7 | Frontend Engineer (Console) | `07-frontend-engineer-console.md` | Week 4-6 | After #4 |
| 8 | Frontend Engineer (Vendor) | `08-frontend-engineer-vendor.md` | Week 4-6 | After #4 |
| 9 | QA Engineer | `09-qa-engineer.md` | Week 8 | After all features |
| 10 | Technical Writer | `10-technical-writer.md` | Week 9 | After all |

---

## 🏗️ Project Structure

```
oasis-travel/
├── apps/
│   ├── mobile/          # React Native (Expo) - Customer app
│   ├── console/         # Next.js - Operator console
│   └── vendor/          # Next.js - Vendor portal
├── packages/
│   ├── api/             # Shared API client (Supabase + types)
│   ├── ui/              # Shared UI components
│   ├── utils/           # Shared utilities
│   └── config/          # Shared configs
└── supabase/
    ├── migrations/      # SQL migrations
    ├── functions/       # Edge functions
    └── tests/           # Tests
```

---

## 📊 Execution Flow

### Phase 1: Foundation (Week 1)
```
Section 1 (DevOps) ────┐
                       ├──► Section 2 (Database)
Section 8 (Utils) ─────┘
```

### Phase 2: Backend Core (Week 1-2)
```
Section 2 ──► Section 3 (RLS) ──► Section 4 (RPCs)
          └─► Section 6 (Storage)
```

### Phase 3: Backend Services (Week 2-3)
```
Section 4 ──► Section 5 (Edge Functions)
          └─► Section 7 (API Package)
```

### Phase 4-5: Frontend (Week 3-7)
```
Sections 7 & 8 ──┬──► Section 9 (Mobile Core) ──┬──► Section 10 (Mobile Features)
                 │                               └──► Section 11 (Mobile Support)
                 ├──► Section 12 (Web Console)
                 └──► Section 13 (Vendor Portal)
```

### Phase 6: Quality & Deploy (Week 8-9)
```
All Sections ──► Section 14 (Testing) ──► Section 15 (CI/CD) ──► Section 16 (Docs)
```

---

## 🎯 Key Features

### For Customers (Mobile)
- ✨ Guest mode → OTP sign-in → seamless merge
- 🤖 AI-powered travel planning bot
- 📄 Quote management with version comparison
- 🗺️ Trip channel with announcements
- 🚨 Emergency support (P0 incidents, ≤5 min SLA)
- 📴 Offline-first with React Query caching

### For Operators (Web Console)
- 📊 Leads Kanban board (NEW → SCOPING → QUOTED → WON/LOST)
- ✏️ Quote builder with day-wise timeline
- 🏢 Unified trip workspace (6 tabs)
- ⏱️ SLA monitoring with countdown timers
- 🚦 Incident management panel
- 📊 Real-time vendor PO tracking

### For Vendors (Web Portal)
- 📦 PO orders list with status tracking
- 📄 Voucher upload with validation checklist
- 💰 Rate plan seasonal editor
- 🚗 Driver roster management

---

## 🔐 Security & Privacy

- **RLS (Row-Level Security)**: Customer A can't see Customer B's data
- **Private Storage**: All files require signed URLs (60-300s TTL)
- **No PII in Trip Channel**: Display names only, no phone numbers
- **Driver Numbers Hidden**: Customers call operator, not drivers
- **Audit Log**: All mutations tracked with before/after states

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native (Expo), TypeScript, Expo Router |
| **Web** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL 15+, Auth, Storage, Edge Functions) |
| **State** | React Query, Zustand |
| **UI** | React Native Paper (mobile), Radix UI (web) |
| **Validation** | Zod schemas |
| **Monorepo** | TurboRepo |

---

## 📝 Development Guidelines

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

### Code Standards
- TypeScript strict mode enabled
- No `any` types
- Comprehensive error handling
- >70% test coverage
- Document complex business logic

### Git Workflow
```bash
git checkout -b feature/your-section-name
# Make changes
git commit -m "feat: implement X"
git push origin feature/your-section-name
# Create PR
```

---

## 🧪 Testing Strategy

- **Unit Tests**: All utility functions, components
- **RLS Tests**: Customer isolation verified
- **Integration Tests**: All RPC functions via HTTP
- **E2E Tests** (optional): Critical user flows

---

## 📦 Deliverables

Each agent delivers:
- ✅ Functional code in their section
- ✅ Tests passing
- ✅ Documentation updated
- ✅ Deliverables checklist complete
- ✅ Handoff to next agent

---

## 🎓 Reference Documents

- **Backend Spec**: [`prompt.md`](./prompt.md) - Complete database schema, RPCs, edge functions
- **Frontend Spec**: [`appoverview.md`](./appoverview.md) - UI/UX flows, components, screens
- **Master Guide**: [`00-PROJECT-MASTER-GUIDE.md`](./00-PROJECT-MASTER-GUIDE.md) - Project overview
- **Documentation Index**: [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md) - All guides listed

---

## 🚦 Status Tracking

Track your progress:

| Section | Status | Agent | Started | Completed |
|---------|--------|-------|---------|-----------|
| 1 | ⬜ | DevOps | - | - |
| 2 | ⬜ | Backend (Primary) | - | - |
| 3 | ⬜ | Backend (Primary) | - | - |
| 4 | ⬜ | Backend (Services) | - | - |
| 5 | ⬜ | Backend (Services) | - | - |
| 6 | ⬜ | Backend (Primary) | - | - |
| 7 | ⬜ | Full-Stack | - | - |
| 8 | ⬜ | Full-Stack | - | - |
| 9 | ⬜ | Mobile (Lead) | - | - |
| 10 | ⬜ | Mobile (Lead) | - | - |
| 11 | ⬜ | Mobile (Features) | - | - |
| 12 | ⬜ | Frontend (Console) | - | - |
| 13 | ⬜ | Frontend (Vendor) | - | - |
| 14 | ⬜ | QA | - | - |
| 15 | ⬜ | DevOps | - | - |
| 16 | ⬜ | Tech Writer | - | - |

---

## ⏱️ Estimated Timeline

With **4-6 parallel agents**:
- **Week 1**: Foundation
- **Week 2**: Backend Core
- **Week 3**: Backend Services
- **Week 4-6**: Frontend Apps
- **Week 7**: Integration
- **Week 8**: Testing
- **Week 9**: Deploy & Documentation

**Total: ~9 weeks**

---

## 💡 Tips for Success

1. **Start with your dependencies** - Don't start until prerequisite sections are done
2. **Communicate blockers early** - If you're blocked, notify immediately
3. **Test as you go** - Don't wait until the end
4. **Document decisions** - Update guides if you deviate
5. **Ask questions** - Better to clarify than guess

---

## 🤝 Support

- **Questions**: Check your agent guide first, then master guide
- **Bugs**: Create GitHub issue with detailed description
- **Blockers**: Notify in team chat immediately
- **Suggestions**: PRs welcome with clear explanation

---

## 📄 License

[Add your license here]

---

## 🎉 Let's Build!

This is a well-structured project with clear dependencies and independent workstreams. Each agent has everything they need to succeed.

**Ready to start?** → Read [`00-PROJECT-MASTER-GUIDE.md`](./00-PROJECT-MASTER-GUIDE.md) now!

