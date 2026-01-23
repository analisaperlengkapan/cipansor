# Cipansor Web Frontend

Next.js 15 (App Router) frontend for Cipansor - Islamic Boarding School Management System.

## 🚀 Getting Started

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

## 🧪 E2E Testing

### Quick Start

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI (interactive mode)
pnpm test:e2e:ui

# Run specific browser
pnpm test:e2e:chromium
pnpm test:e2e:firefox

# Smart runner with pre-flight checks
./run-e2e.sh
```

### Test Coverage

**Total: 176 E2E Tests** across 10 major modules:

- ✅ Authentication & RBAC (11 tests)
- ✅ Student Management (19 tests)
- ✅ Teacher Management (24 tests)
- ✅ Class Management (22 tests)
- ✅ Attendance (15 tests)
- ✅ Finance (24 tests)
- ✅ PAUD Assessment (15 tests)
- ✅ Tahfidz Tracking (14 tests)
- ✅ Analytics & Reports (10 tests)
- ✅ Real-time Dashboard (9 tests)
- ✅ Cross-Module Integration (7 tests)

### Documentation

- [E2E Testing Guide](./docs/E2E_TESTING_GUIDE.md)
- [E2E Infrastructure](./docs/E2E_INFRASTRUCTURE.md)
- [E2E CI/CD Setup](./docs/E2E_CI_CD_SETUP.md)
- [E2E Optimization Report](./docs/E2E_OPTIMIZATION_REPORT.md)
- [E2E Final Report](../../docs/planning/E2E_TESTING_FINAL_REPORT.md)

## 📦 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 18 + TypeScript
- **Styling:** TailwindCSS + shadcn/ui
- **State:** React Query + Zustand
- **Real-time:** Socket.IO client
- **Testing:** Playwright E2E
- **Monitoring:** Sentry

## 🏗️ Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks
├── lib/             # Utilities & configurations
├── services/        # API services
└── stores/          # Zustand stores

e2e/
├── fixtures/        # Test fixtures (auth, API)
├── helpers/         # Test utilities
├── page-objects/    # Page Object Models
└── *.spec.ts       # E2E test suites
```

## 🔗 Related Links

- [Backend API Documentation](http://localhost:3001/api/docs)
- [Project Documentation](../../docs/)
- [Deployment Guide](../../docs/DEPLOYMENT.md)

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
