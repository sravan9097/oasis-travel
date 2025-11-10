# Quick Start Guide - For All Agents

## Prerequisites

```bash
# Install Node.js 18+
node --version  # Should be v18 or higher

# Install pnpm (recommended) or use npm
npm install -g pnpm

# Install Supabase CLI
npm install -g supabase

# For mobile developers
npm install -g expo-cli eas-cli
```

## Initial Setup (All Agents)

### 1. Clone Repository (when available)
```bash
git clone [REPO_URL]
cd oasis-travel
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Up Local Supabase
```bash
# Start Supabase locally
supabase start

# You'll get output like:
# API URL: http://localhost:54321
# Anon key: eyJhbGc...
# Service Role key: eyJhbGc...
```

### 4. Configure Environment Variables
```bash
# Mobile app
cp apps/mobile/.env.example apps/mobile/.env
# Edit apps/mobile/.env with your Supabase credentials

# Console app
cp apps/console/.env.example apps/console/.env
# Edit apps/console/.env with your Supabase credentials

# Vendor app
cp apps/vendor/.env.example apps/vendor/.env
# Edit apps/vendor/.env with your Supabase credentials
```

### 5. Start Development
```bash
# Run all apps
pnpm dev

# Or run specific app
pnpm dev --filter=@oasis/mobile
pnpm dev --filter=@oasis/console
pnpm dev --filter=@oasis/vendor
```

## Access Points

Once running:
- **Mobile App**: Expo DevTools at http://localhost:8081
- **Console App**: http://localhost:3000
- **Vendor Portal**: http://localhost:3001
- **Supabase Studio**: http://localhost:54323

## Your Agent-Specific Guide

Find your detailed instructions in:

| Role | Guide File |
|------|-----------|
| DevOps Engineer | `01-devops-engineer.md` |
| Backend Engineer (Primary) | `02-backend-engineer-primary.md` |
| Backend Engineer (Services) | `03-backend-engineer-services.md` |
| Full-Stack Engineer | `04-fullstack-engineer.md` |
| Mobile Engineer (Lead) | `05-mobile-engineer-lead.md` |
| Mobile Engineer (Features) | `06-mobile-engineer-features.md` |
| Frontend Engineer (Console) | `07-frontend-engineer-console.md` |
| Frontend Engineer (Vendor) | `08-frontend-engineer-vendor.md` |
| QA Engineer | `09-qa-engineer.md` |
| Technical Writer | `10-technical-writer.md` |

## Dependency Check

**Before you start your section, ensure:**

| Section | Dependencies | Check Command |
|---------|-------------|---------------|
| 1 | None | Start immediately |
| 2 | Section 1 | `pnpm dev` should work |
| 3 | Section 2 | `supabase db reset` succeeds |
| 4 | Section 3 | RLS policies exist |
| 5 | Section 4 | RPCs callable via `psql` |
| 6 | Section 2 | Database schema exists |
| 7 | Section 4 | RPCs defined |
| 8 | None | Start immediately |
| 9 | Sections 7, 8 | Packages importable |
| 10 | Section 9 | Mobile app runs |
| 11 | Section 9 | Mobile app runs |
| 12 | Sections 7, 8 | Packages importable |
| 13 | Sections 7, 8 | Packages importable |
| 14 | Sections 2-6 | All backend complete |
| 15 | All sections | All features done |
| 16 | All sections | All features done |

## Common Commands

```bash
# Install new dependency in an app
cd apps/mobile
pnpm add <package-name>

# Install new dependency in a package
cd packages/api
pnpm add <package-name>

# Run tests
pnpm test

# Lint
pnpm lint

# Build all apps
pnpm build

# Clean everything
pnpm clean
rm -rf node_modules
pnpm install

# Supabase commands
supabase status          # Check status
supabase db reset        # Reset and run migrations
supabase db dump         # Export schema
supabase migration new <name>  # Create migration
supabase functions deploy <name>  # Deploy edge function
```

## Troubleshooting

### Can't install dependencies
```bash
pnpm install --force
```

### Supabase won't start
```bash
supabase stop
supabase start
```

### Port conflicts
Edit the dev script in the affected app's `package.json` to use a different port.

### TurboRepo cache issues
```bash
turbo clean
rm -rf .turbo
pnpm dev
```

## Getting Help

1. Check your agent-specific guide
2. Check `00-PROJECT-MASTER-GUIDE.md`
3. Review `prompt.md` and `appoverview.md` for specs
4. Ask in team chat/standups

## Daily Workflow

1. **Morning**: Pull latest changes
   ```bash
   git pull origin main
   pnpm install
   ```

2. **Start work**: Create feature branch
   ```bash
   git checkout -b feature/your-section-name
   ```

3. **Develop**: Make changes, commit often
   ```bash
   git add .
   git commit -m "feat: implement X"
   ```

4. **End of day**: Push your branch
   ```bash
   git push origin feature/your-section-name
   ```

5. **Ready for review**: Create PR on GitHub

## Success Indicators

✅ **You're on track if:**
- Your dev environment runs without errors
- You can import shared packages (`@oasis/api`, `@oasis/utils`)
- Tests pass locally
- You're meeting your section's timeline

❌ **You're blocked if:**
- Dependencies from other sections aren't ready
- Supabase migrations failing
- Can't import shared packages

**If blocked**: Notify the team immediately and check which dependency is missing.

---

**Remember**: Read your agent-specific guide (`XX-[your-role].md`) for detailed step-by-step instructions!

