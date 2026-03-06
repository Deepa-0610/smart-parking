---
description: Repository Information Overview
alwaysApply: true
---

# Smart Park Connect Information

## Summary
Smart Park Connect is a parking management application built with React, TypeScript, and Vite, utilizing Supabase for backend services (database, migrations, and edge functions). It features a modern UI using shadcn/ui and Tailwind CSS, and includes real-time parking spot monitoring.

## Structure
- **`src/`**: Main frontend application source code.
  - **`components/`**: Reusable UI components (shadcn/ui).
  - **`pages/`**: Application views/pages.
  - **`integrations/`**: Supabase client and related configurations.
  - **`test/`**: Test setup and utilities.
- **`supabase/`**: Supabase backend configuration.
  - **`functions/`**: Deno-based edge functions (`get-spot-status`, `update-spot-status`).
  - **`migrations/`**: SQL database migrations.
- **`public/`**: Static assets like icons and robots.txt.

## Language & Runtime
**Language**: TypeScript  
**Runtime**: Node.js (Frontend), Deno (Supabase Edge Functions)  
**Build System**: Vite  
**Package Manager**: npm (standard), also supports Bun (lockfiles present)

## Dependencies
**Main Dependencies**:
- `react`: ^18.3.1
- `@supabase/supabase-js`: ^2.98.0
- `@tanstack/react-query`: ^5.83.0
- `react-router-dom`: ^6.30.1
- `lucide-react`: ^0.462.0
- `zod`: ^3.25.76
- `recharts`: ^2.15.4 (for data visualization)

**Development Dependencies**:
- `vite`: ^7.3.1
- `vitest`: ^3.2.4
- `typescript`: ^5.8.3
- `tailwindcss`: ^3.4.17
- `eslint`: ^9.32.0

## Build & Installation
```bash
# Install dependencies
npm i

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing
**Framework**: Vitest
**Test Location**: `src/` (files matching `**/*.{test,spec}.{ts,tsx}`)
**Naming Convention**: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
**Configuration**: `vitest.config.ts`, `src/test/setup.ts`

**Run Command**:
```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

## Main Files & Resources
- **Entry Point**: `src/main.tsx`
- **Root Component**: `src/App.tsx`
- **Environment Config**: `.env`
- **Supabase Config**: `supabase/config.toml`
- **UI Config**: `components.json`, `tailwind.config.ts`
