# DevOps Engineer Guide

**Your Role:** Infrastructure Setup & Deployment  
**Sections:** 1, 15  
**Duration:** Week 1 (Day 1-2) + Week 9  
**Dependencies:** None for Section 1; All sections for Section 15

---

## Overview

You are responsible for:
1. **Section 1**: Setting up the monorepo infrastructure (Week 1)
2. **Section 15**: Implementing CI/CD and deployment pipelines (Week 9)

Your work is **critical** - all other agents are blocked until Section 1 is complete.

---

## Section 1: Infrastructure & Monorepo Setup

### Timeline
- **Start**: Day 1 (immediately)
- **Duration**: 2 days
- **Blocks**: All other sections
- **Can work parallel with**: Section 8 (Full-Stack Engineer)

### Objective
Create a fully functional TurboRepo monorepo with:
- 3 applications (mobile, console, vendor)
- 4 shared packages (api, ui, utils, config)
- Supabase project structure
- Development environment ready for all agents

---

### Step-by-Step Instructions

#### Step 1: Initialize TurboRepo (30 minutes)

```bash
# Create project directory
mkdir oasis-travel
cd oasis-travel

# Initialize git
git init
git branch -m main

# Initialize TurboRepo
npx create-turbo@latest .
# Select: pnpm or npm as package manager
# Select: No remote caching (for now)
```

#### Step 2: Create Directory Structure (15 minutes)

```bash
# Create apps directories
mkdir -p apps/mobile
mkdir -p apps/console
mkdir -p apps/vendor

# Create packages directories
mkdir -p packages/api/src
mkdir -p packages/ui/src
mkdir -p packages/utils/src
mkdir -p packages/config

# Create Supabase directories
mkdir -p supabase/migrations
mkdir -p supabase/functions
mkdir -p supabase/tests

# Create docs directories
mkdir -p docs/api
mkdir -p docs/architecture
```

#### Step 3: Set Up Mobile App (1 hour)

```bash
cd apps/mobile

# Initialize Expo project
npx create-expo-app@latest . --template blank-typescript

# Install core dependencies
npm install @supabase/supabase-js@^2.38.0
npm install @tanstack/react-query@^5.0.0
npm install zustand@^4.4.0

# Install Expo modules
npm install expo-router@^3.0.0
npm install expo-secure-store@^12.5.0
npm install expo-notifications@^0.27.0
npm install expo-file-system@^16.0.0

# Install UI & Forms
npm install react-native-paper@^5.11.0
npm install react-hook-form@^7.48.0
npm install zod@^3.22.0
npm install @hookform/resolvers@^3.3.0

# Install navigation
npm install expo-router

cd ../..
```

**Create `apps/mobile/package.json`:**
```json
{
  "name": "@oasis/mobile",
  "version": "0.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "dev": "expo start --dev-client",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

#### Step 4: Set Up Console App (1 hour)

```bash
cd apps/console

# Initialize Next.js project
npx create-next-app@latest . --typescript --app --tailwind --eslint --no-src-dir

# Install dependencies
npm install @supabase/supabase-js@^2.38.0
npm install @tanstack/react-query@^5.0.0
npm install @radix-ui/react-dropdown-menu@^2.0.6
npm install @radix-ui/react-dialog@^1.0.5
npm install @radix-ui/react-select@^2.0.0
npm install @radix-ui/react-tabs@^1.0.4
npm install @dnd-kit/core@^6.1.0
npm install @dnd-kit/sortable@^8.0.0
npm install date-fns@^2.30.0
npm install class-variance-authority@^0.7.0
npm install clsx@^2.0.0
npm install tailwind-merge@^2.0.0

cd ../..
```

**Edit `apps/console/package.json` to add:**
```json
{
  "name": "@oasis/console",
  "version": "0.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

#### Step 5: Set Up Vendor Portal (30 minutes)

```bash
cd apps/vendor

# Initialize Next.js project
npx create-next-app@latest . --typescript --app --tailwind --eslint --no-src-dir

# Install dependencies (same as console)
npm install @supabase/supabase-js@^2.38.0
npm install @tanstack/react-query@^5.0.0
npm install @radix-ui/react-dropdown-menu@^2.0.6
npm install @radix-ui/react-dialog@^1.0.5
npm install @radix-ui/react-select@^2.0.0
npm install date-fns@^2.30.0

cd ../..
```

#### Step 6: Create Shared Packages (1 hour)

**packages/config/package.json:**
```json
{
  "name": "@oasis/config",
  "version": "0.0.0",
  "main": "index.js"
}
```

**packages/config/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

**packages/config/eslint-config.js:**
```javascript
module.exports = {
  extends: ['next', 'prettier'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};
```

**packages/api/package.json:**
```json
{
  "name": "@oasis/api",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "zod": "^3.22.0"
  }
}
```

**packages/api/src/index.ts:**
```typescript
// Placeholder - Full-Stack Engineer will populate
export const placeholder = 'API package coming soon';
```

**packages/ui/package.json:**
```json
{
  "name": "@oasis/ui",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

**packages/ui/src/index.ts:**
```typescript
// Placeholder for shared UI components
export const placeholder = 'UI package coming soon';
```

**packages/utils/package.json:**
```json
{
  "name": "@oasis/utils",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "date-fns": "^2.30.0"
  }
}
```

**packages/utils/src/index.ts:**
```typescript
// Placeholder - Full-Stack Engineer will populate
export const placeholder = 'Utils package coming soon';
```

#### Step 7: Configure TurboRepo (30 minutes)

**Root `turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", ".expo/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": []
    }
  }
}
```

**Root `package.json`:**
```json
{
  "name": "oasis-travel",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### Step 8: Create Environment Templates (30 minutes)

**apps/mobile/.env.example:**
```bash
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**apps/console/.env.example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

**apps/vendor/.env.example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Root `.env.example`:**
```bash
# Supabase Local Development
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Production (fill when deploying)
SUPABASE_PROJECT_REF=
```

#### Step 9: Configure Git (15 minutes)

**Root `.gitignore`:**
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Expo
.expo/
.expo-shared/
web-build/

# Environment files
.env
.env.local
.env.*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Turbo
.turbo/

# Supabase
.branches/
.temp/
```

#### Step 10: Initialize Supabase (30 minutes)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Initialize Supabase project
supabase init

# This creates:
# - supabase/config.toml
# - supabase/.gitignore
```

**Edit `supabase/config.toml`:**
```toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage"]

[db]
port = 54322

[studio]
enabled = true
port = 54323

[storage]
enabled = true
```

#### Step 11: Create README (30 minutes)

**Root `README.md`:**
```markdown
# Oasis Travel

Privacy-first travel management platform.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Supabase CLI

### Installation

\`\`\`bash
# Install dependencies
pnpm install

# Start Supabase locally
supabase start

# Copy environment files
cp apps/mobile/.env.example apps/mobile/.env
cp apps/console/.env.example apps/console/.env
cp apps/vendor/.env.example apps/vendor/.env

# Update .env files with Supabase credentials from previous step
\`\`\`

### Development

\`\`\`bash
# Run all apps
pnpm dev

# Run specific app
pnpm dev --filter=@oasis/mobile
pnpm dev --filter=@oasis/console
pnpm dev --filter=@oasis/vendor
\`\`\`

### Apps & Packages

- `apps/mobile` - React Native (Expo) customer app
- `apps/console` - Next.js operator console
- `apps/vendor` - Next.js vendor portal
- `packages/api` - Shared API client & types
- `packages/ui` - Shared UI components
- `packages/utils` - Shared utilities
- `packages/config` - Shared configuration

## Project Structure

See [00-PROJECT-MASTER-GUIDE.md](./00-PROJECT-MASTER-GUIDE.md) for complete documentation.
```

#### Step 12: Install & Verify (1 hour)

```bash
# Install all dependencies
pnpm install

# Start Supabase
supabase start

# Copy the credentials output and update .env files

# Test that all apps start
pnpm dev
```

**Expected output:**
```
@oasis/mobile:dev: Expo started on http://localhost:8081
@oasis/console:dev: Next.js started on http://localhost:3000
@oasis/vendor:dev: Next.js started on http://localhost:3001
```

---

### Deliverables Checklist

- [ ] TurboRepo monorepo created
- [ ] 3 apps scaffold (mobile, console, vendor)
- [ ] 4 packages scaffold (api, ui, utils, config)
- [ ] Supabase initialized
- [ ] `pnpm dev` runs all apps without errors
- [ ] Environment templates created
- [ ] README with setup instructions
- [ ] Git repository initialized with proper .gitignore
- [ ] All dependencies installed

---

### Handoff to Other Agents

Once Section 1 is complete, notify:

1. **Backend Engineer (Primary)**: "Monorepo ready. Supabase initialized. You can start Section 2 (Database Schema)."
   - Provide Supabase local credentials
   - Confirm `supabase/migrations/` directory exists

2. **Full-Stack Engineer**: "Packages scaffold ready. You can populate Section 8 (Utils) now."
   - Point to `packages/utils/src/`
   - Share package naming convention `@oasis/*`

3. **All Engineers**: Push initial commit to shared repository
   ```bash
   git add .
   git commit -m "chore: initial monorepo setup"
   git remote add origin [REPO_URL]
   git push -u origin main
   ```

---

## Section 15: CI/CD & Deployment

### Timeline
- **Start**: Week 9 (after all features complete)
- **Duration**: 5 days
- **Depends on**: All sections (1-14)

### Objective
Set up production-ready CI/CD pipelines for:
- Mobile: Expo EAS builds
- Web: Vercel deployments
- Backend: Supabase project management
- Quality: GitHub Actions for testing

---

### Prerequisites

Before starting Section 15, ensure:
- [ ] All features tested (Section 14 complete)
- [ ] All apps build successfully locally
- [ ] Environment variables documented
- [ ] Supabase production project created

---

### Step-by-Step Instructions

#### Step 1: Set Up GitHub Actions (2 hours)

**Create `.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Lint
        run: pnpm lint
        
      - name: Type check
        run: pnpm typecheck || echo "Add typecheck script to package.json"

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm test

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build all apps
        run: pnpm build
```

#### Step 2: Configure Expo EAS (3 hours)

```bash
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS
eas build:configure
```

**Create `apps/mobile/eas.json`:**
```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$SUPABASE_DEV_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$SUPABASE_DEV_ANON_KEY"
      }
    },
    "staging": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$SUPABASE_STAGING_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$SUPABASE_STAGING_ANON_KEY"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$SUPABASE_PROD_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$SUPABASE_PROD_ANON_KEY"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "track": "internal"
      },
      "ios": {
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      }
    }
  }
}
```

**Add GitHub Action for EAS builds:**

Create `.github/workflows/mobile-build.yml`:
```yaml
name: Mobile Build

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build Android (Staging)
        run: |
          cd apps/mobile
          eas build --platform android --profile staging --non-interactive
```

#### Step 3: Configure Vercel Deployment (2 hours)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login
```

**Console App - `apps/console/vercel.json`:**
```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm build --filter=@oasis/console",
  "installCommand": "cd ../.. && pnpm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_KEY": "@supabase-service-key"
  }
}
```

**Vendor App - `apps/vendor/vercel.json`:**
```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm build --filter=@oasis/vendor",
  "installCommand": "cd ../.. && pnpm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Link projects to Vercel:**
```bash
# Console
cd apps/console
vercel link

# Vendor
cd apps/vendor
vercel link
```

#### Step 4: Supabase Multi-Environment Setup (3 hours)

**Create 3 Supabase projects:**
1. Development: `oasis-travel-dev`
2. Staging: `oasis-travel-staging`
3. Production: `oasis-travel-prod`

**Create migration deployment script:**

`scripts/deploy-migrations.sh`:
```bash
#!/bin/bash

ENV=$1

if [ "$ENV" == "staging" ]; then
  PROJECT_REF=$SUPABASE_STAGING_REF
elif [ "$ENV" == "production" ]; then
  PROJECT_REF=$SUPABASE_PROD_REF
else
  echo "Usage: ./deploy-migrations.sh [staging|production]"
  exit 1
fi

echo "Deploying migrations to $ENV..."
supabase link --project-ref $PROJECT_REF
supabase db push

echo "Migrations deployed successfully!"
```

**Add to `.github/workflows/deploy-migrations.yml`:**
```yaml
name: Deploy Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Deploy to Staging
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_STAGING_REF: ${{ secrets.SUPABASE_STAGING_REF }}
        run: |
          supabase link --project-ref $SUPABASE_STAGING_REF
          supabase db push

  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    needs: deploy-staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Deploy to Production
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROD_REF: ${{ secrets.SUPABASE_PROD_REF }}
        run: |
          supabase link --project-ref $SUPABASE_PROD_REF
          supabase db push
```

#### Step 5: Configure Secrets (1 hour)

**GitHub Repository Secrets:**

Navigate to GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:
```
EXPO_TOKEN
SUPABASE_ACCESS_TOKEN
SUPABASE_STAGING_REF
SUPABASE_STAGING_URL
SUPABASE_STAGING_ANON_KEY
SUPABASE_STAGING_SERVICE_KEY
SUPABASE_PROD_REF
SUPABASE_PROD_URL
SUPABASE_PROD_ANON_KEY
SUPABASE_PROD_SERVICE_KEY
```

**Vercel Environment Variables:**

For each project (console & vendor):
1. Go to Vercel dashboard → Project → Settings → Environment Variables
2. Add for each environment (Development, Preview, Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY` (console only)

#### Step 6: Set Up Monitoring (2 hours)

**Install Sentry:**
```bash
# Console
cd apps/console
npm install @sentry/nextjs

# Vendor
cd apps/vendor
npm install @sentry/nextjs

# Mobile
cd apps/mobile
npm install @sentry/react-native
```

**Configure Sentry for Next.js:**

`apps/console/sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV || 'development',
  tracesSampleRate: 0.1,
});
```

**Configure Sentry for mobile:**

`apps/mobile/app/_layout.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_ENV || 'development',
});
```

#### Step 7: Create Deployment Documentation (1 hour)

**Create `docs/DEPLOYMENT.md`:**
```markdown
# Deployment Guide

## Environments

- **Development**: Local development with Supabase local
- **Staging**: Pre-production testing
- **Production**: Live application

## Mobile App Deployment

### Staging Build
\`\`\`bash
cd apps/mobile
eas build --platform all --profile staging
\`\`\`

### Production Build
\`\`\`bash
cd apps/mobile
eas build --platform all --profile production
eas submit --platform all --profile production
\`\`\`

## Web App Deployment

Deployments happen automatically on push to main:
- Console: https://console.oasistravel.app
- Vendor: https://vendor.oasistravel.app

### Manual Deploy
\`\`\`bash
cd apps/console
vercel --prod
\`\`\`

## Database Migrations

### Staging
\`\`\`bash
./scripts/deploy-migrations.sh staging
\`\`\`

### Production
\`\`\`bash
./scripts/deploy-migrations.sh production
\`\`\`

## Rollback Procedure

### Web Apps
Vercel Dashboard → Deployments → Select previous deployment → Promote to Production

### Mobile Apps
Cannot rollback app store submissions. Issue hotfix build.

### Database
\`\`\`bash
supabase db reset --linked
supabase db push --linked
\`\`\`
```

---

### Deliverables Checklist

- [ ] GitHub Actions CI pipeline running
- [ ] EAS build configured for mobile (dev, staging, prod)
- [ ] Vercel deployments working for console & vendor
- [ ] 3 Supabase projects created (dev, staging, prod)
- [ ] Migration deployment automation
- [ ] All secrets configured in GitHub & Vercel
- [ ] Sentry monitoring set up
- [ ] Deployment documentation complete
- [ ] Successful test deployment to staging

---

### Handoff

Once Section 15 is complete:
1. Provide deployment URLs to team
2. Share credentials document (securely)
3. Train team on deployment process
4. Set up on-call rotation for production issues

---

## Troubleshooting

### Monorepo Issues

**Problem**: Dependencies not resolving
```bash
pnpm install --force
pnpm build
```

**Problem**: TurboRepo cache issues
```bash
turbo clean
rm -rf .turbo
pnpm dev
```

### Supabase Issues

**Problem**: Migrations failing
```bash
# Check migration status
supabase migration list

# Reset local DB
supabase db reset

# Check for syntax errors in SQL files
```

**Problem**: Can't connect to local Supabase
```bash
supabase stop
supabase start
# Update .env files with new credentials
```

### Build Issues

**Problem**: Next.js build fails
```bash
# Check for TypeScript errors
cd apps/console
npm run build

# Clear Next.js cache
rm -rf .next
npm run build
```

**Problem**: Expo build fails
```bash
# Clear cache
cd apps/mobile
expo start -c

# Check eas.json configuration
```

### CI/CD Issues

**Problem**: GitHub Actions failing
- Check Actions logs in GitHub
- Verify all secrets are set
- Test build locally first

**Problem**: Vercel deployment fails
- Check build logs in Vercel dashboard
- Verify environment variables
- Test build command locally

---

## Resources

- [TurboRepo Docs](https://turbo.build/repo/docs)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## Success Criteria

### Section 1 Success
✅ All engineers can:
- Clone the repo
- Run `pnpm install`
- Run `pnpm dev`
- See all 3 apps running

### Section 15 Success
✅ Production ready when:
- CI passes on all PRs
- Mobile builds deploy to TestFlight/Internal Testing
- Web apps deploy to Vercel on merge to main
- Database migrations auto-deploy
- Monitoring shows app health
- Team trained on deployment process

