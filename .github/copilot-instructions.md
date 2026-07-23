# Copilot Instructions - Cipansor Project

## Project Overview

**Cipansor** is a comprehensive **Islamic Boarding School (Pesantren) Management System** for Yayasan Pesantren Cipansor, managing 4 educational units (TK Qur'an, SD IT, SMP IT, SMA Qur'an) with 24+ integrated modules. The system emphasizes **tahfidz tracking** (Qur'an memorization) and **multi-unit management** with role-based access.

**Tech Stack:**

- **Backend:** Express 5 + TypeScript + Prisma 5 + PostgreSQL 14+
- **Frontend:** Next.js 15 (App Router) + React + TypeScript + TailwindCSS + shadcn/ui
- **Real-time:** Socket.IO 4.7 + Redis 7 (pub/sub + caching)
- **Monorepo:** pnpm workspaces (apps/api, apps/web, packages/shared)

---

## Critical Architecture Patterns

### 1. Backend Module Structure (Layered Architecture)

All backend modules follow this **exact** pattern in `apps/api/src/modules/[module-name]/`:

```
[module-name]/
├── [module].routes.ts      # Express routes + Swagger docs (OpenAPI 3.0)
├── [module].controller.ts  # Request handlers (async, try-catch required)
├── [module].service.ts     # Business logic + Prisma queries
├── [module].schema.ts      # Zod validation schemas (optional)
└── index.ts                # Named exports only
```

**Key Rules:**

- Controllers MUST use `async/await` with try-catch blocks that call `next(error)`
- Services MUST handle all Prisma operations and business logic
- Routes MUST include Swagger JSDoc annotations (see examples below)
- All database queries use Prisma Client (`prisma` singleton from `@/lib/prisma`)

**Example Controller Pattern:**

```typescript
// dashboard.controller.ts
export const getDashboardMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { unitId } = req.query;
    const metrics = await getCurrentDashboardMetrics(unitId as string);
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error); // ALWAYS pass to error middleware
  }
};
```

**Example Route with Swagger:**

```typescript
// dashboard.routes.ts
/**
 * @swagger
 * /api/dashboard/metrics:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get real-time dashboard metrics
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/metrics", authenticate, getDashboardMetrics);
```

### 2. Real-time Architecture (Socket.IO + Redis)

**Location:** `apps/api/src/lib/realtime.ts` (738 lines - DO NOT duplicate)

**Pattern:** Redis Pub/Sub with Socket.IO rooms for multi-tenant isolation

```typescript
// Publishing events (backend job/service)
import { publishDashboardMetrics } from "@/lib/realtime";
await publishDashboardMetrics(metrics, unitId); // Redis pub/sub

// Client subscribes (frontend)
socket.on("dashboard:metrics", (data) => {
  queryClient.setQueryData(["dashboard", "metrics"], data);
});
```

**Critical:**

- All WebSocket connections require JWT authentication (via `auth` query param)
- Use unit-based rooms: `dashboard:metrics:${unitId}` or `dashboard:metrics` (global)
- Redis channels use pattern subscriptions: `psubscribe('dashboard:*')`

### 3. Caching Strategy (Redis)

**Pattern:** Read-through cache with 60s TTL + automatic invalidation

```typescript
// Cache keys: 'metrics:global' or 'metrics:unit:{unitId}'
const cached = await redisPublisher.get(cacheKey);
if (cached) return JSON.parse(cached);

// After DB query
await redisPublisher.setex(cacheKey, 60, JSON.stringify(data));

// Invalidate on publish
await redisPublisher.del(cacheKey);
```

**When to cache:** Dashboard metrics (60s), student lists (5min), reports (30min)  
**Documentation:** `apps/api/docs/DASHBOARD_CACHING.md`

### 4. Frontend Real-time Hooks

**Location:** `apps/web/src/hooks/use-realtime-dashboard.ts`

**Pattern:** Custom hook with exponential backoff reconnection

```typescript
const { metrics, isConnected, reconnectAttempts } = useRealtimeDashboard({
  enabled: true,
  unitIds: ["unit-1"],
  onMetricsUpdate: (data) => console.log(data),
});
```

**Key Features:**

- Automatic reconnection with exponential backoff (1s → 30s max)
- React Query invalidation on real-time updates
- Toast notifications for connection status
- JWT authentication via localStorage token

### 5. Error Handling Pattern

**Backend:** Custom error middleware in `apps/api/src/middleware/error.ts`

```typescript
// Always throw with proper error objects
if (!user) throw new NotFoundError('User not found');

// Or use next(error) in controllers
} catch (error) {
  next(error); // Error middleware handles formatting
}
```

**Frontend:** React Error Boundaries + React Query retry logic

```typescript
// Error Boundary (apps/web/src/components/error-boundary.tsx)
<ErrorBoundary fallback={<DashboardErrorFallback />}>
  <YourComponent />
</ErrorBoundary>

// React Query retry (3 attempts with backoff)
useQuery(['key'], fetcher, {
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
});
```

---

## Database Patterns

### Prisma Schema Location

`apps/api/prisma/schema.prisma` (5,747 lines - comprehensive)

### Multi-tenant Pattern

**CRITICAL:** All queries MUST filter by `unitId` for data isolation

```typescript
// CORRECT - Unit-scoped query
const students = await prisma.student.findMany({
  where: {
    unitId: user.unitId, // REQUIRED for multi-tenant
    deletedAt: null,
  },
});

// INCORRECT - Global query (security issue)
const students = await prisma.student.findMany();
```

### Soft Delete Pattern

All major entities use `deletedAt: DateTime?` for soft deletes

```typescript
// Soft delete
await prisma.student.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Always filter soft-deleted records
where: {
  deletedAt: null;
}
```

### Enums (CRITICAL - Import from Prisma)

```typescript
// CORRECT
import { UserRole, Realm, AttendanceStatus } from "@prisma/client";

// INCORRECT - Do not redefine enums manually
enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
} // ❌
```

**Key Enums:**

- `UserRole`: SUPER_ADMIN, UNIT_ADMIN, TEACHER, STAFF, STUDENT, PARENT
- `Realm`: GLOBAL, YAYASAN, TK_QURAN, SD_IT, SMP_IT, SMA_QURAN
- `AttendanceStatus`: PRESENT, ABSENT, LATE, EXCUSED, SICK
- `AchievementLevel`: BB, MB, BSH, BSB (PAUD specific)

---

## Development Workflows

### Running the Stack

```bash
# Terminal 1 - API (port 3001)
cd apps/api
pnpm dev

# Terminal 2 - Web (port 3000)
cd apps/web
pnpm dev

# Terminal 3 - Redis (required for real-time)
redis-server
```

### Database Commands

```bash
# Push schema changes (development)
cd apps/api
pnpm db:push

# Create migration (production)
pnpm db:migrate

# Seed database (includes test data)
pnpm db:seed

# Reset database (DESTRUCTIVE)
pnpm db:reset
```

### Testing Commands

```bash
# Backend tests (Vitest)
cd apps/api
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage

# Frontend tests (Playwright E2E)
cd apps/web
pnpm test:e2e          # Run E2E tests
pnpm test:e2e:ui       # With UI
```

### API Documentation

- **Swagger UI:** http://localhost:3001/api/docs
- **Spec file:** `apps/api/src/config/swagger.ts`
- **Postman:** Import from Swagger JSON

---

## Project-Specific Conventions

### 1. Import Aliases (tsconfig paths)

```typescript
// ALWAYS use aliases, never relative paths
import { prisma } from "@/lib/prisma"; // ✅ Correct
import { prisma } from "../../../lib/prisma"; // ❌ Wrong

// Aliases:
// @/        → apps/api/src/
// @shared/  → packages/shared/src/
```

### 2. API Response Format (Standardized)

```typescript
// Success (always wrap in 'data')
{ success: true, data: {...}, meta: { page, limit, total } }

// Error (always use 'error' object)
{ success: false, error: { code: 'NOT_FOUND', message: '...' } }
```

### 3. Route Registration (apps/api/src/app.ts)

```typescript
// MUST register in app.ts after imports
app.use("/api/your-module", yourModuleRoutes);

// Order matters: Auth routes first, then feature routes
```

### 4. Authentication Middleware

```typescript
import { authenticate } from "@/middleware/auth";

// Protected route
router.get("/protected", authenticate, controller);

// Public route (no middleware)
router.get("/public", controller);
```

### 5. Scheduled Jobs (BullMQ)

**Location:** `apps/api/src/jobs/`

```typescript
// dashboard-snapshot.job.ts
export const dashboardSnapshotJob = new CronJob("*/60 * * * * *", async () => {
  const metrics = await getCurrentDashboardMetrics();
  await publishDashboardMetrics(metrics);
});
```

**Register in:** `apps/api/src/jobs/index.ts` and start in `main.ts`

---

## Integration Points

### 1. WebSocket + Redis Pub/Sub

- **Backend publishes:** `publishDashboardMetrics(data, unitId)` → Redis
- **Redis broadcasts:** Pattern `dashboard:*` to all subscribers
- **Socket.IO emits:** To room `dashboard:metrics:${unitId}`
- **Frontend receives:** Via `useRealtimeDashboard()` hook

### 2. React Query + WebSocket Sync

```typescript
// Frontend hook updates React Query cache
socket.on("dashboard:metrics", (data) => {
  queryClient.setQueryData(["dashboard", "metrics"], data);
});
```

### 3. PAUD Assessment Flow

**Multi-step process:** Indicator selection → Assessment → Evidence upload → Report generation

**Files:**

- Backend: `apps/api/src/modules/paud-assessment/`
- Frontend: `apps/web/src/app/paud/assessment/`
- Schema: Search for `PAUDDevelopmentIndicator` in Prisma

### 4. Tahfidz Tracking (Core Feature)

**Modules:** Ziyadah (new), Murojaah (review), Simaan (recitation), Tasmi (assessment)

**Backend:** `apps/api/src/modules/tahfidz/`, `apps/api/src/modules/murojaah/`  
**Frontend:** `apps/web/src/app/tahfidz/`

---

## Common Pitfalls & Solutions

### ❌ Problem: WebSocket not connecting

**Solution:** Check JWT token in localStorage, verify Redis is running, check CORS settings

### ❌ Problem: Prisma type errors after schema change

**Solution:** Run `pnpm db:generate` to regenerate Prisma Client

### ❌ Problem: Cache not invalidating

**Solution:** Ensure `publishDashboardMetrics()` deletes cache key before publishing

### ❌ Problem: Multi-tenant data leak

**Solution:** ALWAYS filter by `unitId` in queries (see Multi-tenant Pattern above)

### ❌ Problem: Error middleware not catching errors

**Solution:** Use `next(error)` in controllers, not `res.status().json()`

---

## Key Files Reference

| Purpose             | Location                                       |
| ------------------- | ---------------------------------------------- |
| Backend entry point | `apps/api/src/main.ts`                         |
| Express app config  | `apps/api/src/app.ts`                          |
| Prisma schema       | `apps/api/prisma/schema.prisma`                |
| WebSocket + Redis   | `apps/api/src/lib/realtime.ts`                 |
| JWT utilities       | `apps/api/src/lib/jwt.ts`                      |
| Auth middleware     | `apps/api/src/middleware/auth.ts`              |
| Error middleware    | `apps/api/src/middleware/error.ts`             |
| Frontend layout     | `apps/web/src/app/layout.tsx`                  |
| Real-time hook      | `apps/web/src/hooks/use-realtime-dashboard.ts` |
| Error boundaries    | `apps/web/src/components/error-boundary.tsx`   |

---

## Documentation Structure

- **Planning:** `docs/planning/` (requirements, database design, backend design)
- **Implementation:** `docs/planning/implementation-tasks.md` (420h breakdown)
- **Known issues & roadmap:** `docs/KNOWN_ISSUES.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **API Caching:** `apps/api/docs/DASHBOARD_CACHING.md`

---

## When Adding New Features

1. **Backend Module:**
   - Follow layered structure: routes → controller → service
   - Add Swagger docs in routes file
   - Register in `apps/api/src/app.ts`
   - Add Prisma model if needed (`schema.prisma`)

2. **Frontend Page:**
   - Use App Router: `apps/web/src/app/[module]/page.tsx`
   - Create React Query hooks in `apps/web/src/hooks/`
   - Use shadcn/ui components from `apps/web/src/components/ui/`
   - Add error boundaries for resilience

3. **Real-time Feature:**
   - Publish events via `apps/api/src/lib/realtime.ts` functions
   - Subscribe in frontend using `useRealtimeDashboard()` pattern
   - Use Redis pub/sub for scalability

4. **Testing:**
   - Backend: Create `[module].test.ts` in module directory
   - E2E: Add to `apps/web/e2e/[feature].spec.ts`
   - Run tests before committing

---

## Performance Considerations

- **Database:** Use `include` for related data, avoid N+1 queries
- **Caching:** Cache expensive queries (dashboard metrics, reports)
- **WebSocket:** Use rooms for targeted broadcasts (don't broadcast globally)
- **Frontend:** Lazy load large components, use React Query for deduplication
