# AGENTS.md — apps/api

Express 5 + Prisma 7 REST API. Read the root `AGENTS.md` first.

## Module layout (the standard)

```
src/modules/<name>/
  routes.ts      # Router; authenticate/authorize/validate; -> controller
  controller.ts  # thin; asyncHandler; ApiResponse.success/error/paginated
  service.ts     # business logic; the only layer that touches Prisma
  schema.ts      # Zod schemas; export types via z.infer
  index.ts       # export { <name>Routes }
  tests/         # vitest, Prisma mocked
```

Layering: **routes never call Prisma; controllers never embed business logic.**
Mount new modules in `src/app.ts`.

> Naming is currently inconsistent (some modules use `controller.ts`, others
> `<name>.controller.ts`; a few keep handlers inline in `routes.ts`). New code
> should follow the layout above. Standardizing the rest is tracked in
> `docs/KNOWN_ISSUES.md`.

## Reuse, don't reinvent

- Responses: `src/utils/response.ts` (`ApiResponse`).
- Errors/validation: `src/middleware/error.ts` — throw `Errors.notFound()`,
  `Errors.badRequest()`, etc.; wrap async handlers in `asyncHandler`; validate
  with `validate(schema)` / `validateQuery(schema)`.
- Auth/RBAC: `src/middleware/auth.ts` — `authorize(RoleCode.X, ...)`,
  `hasPermission('perm')`, `isAdmin`, `isSuperAdmin`, `isTeacherOrAbove`.
- Infra: `src/lib/{prisma,redis,jwt,logger,event-bus,realtime}.ts`.
- Cross-module side effects: emit via `eventBus` (typed `AppEvents`), don't reach
  into other modules' services.

## Prisma 7 specifics

- The client connects through the **`@prisma/adapter-pg` driver adapter** in
  `src/lib/prisma.ts`; the connection URL lives in `prisma/prisma.config.ts`, not
  in `schema.prisma`. Standalone scripts use `prisma/client.ts`'s
  `createPrismaClient()`.
- `Decimal` is imported from `@prisma/client/runtime/client` (not `/runtime/library`).
- Import DB enums and `Prisma` namespace from `@prisma/client`.
- Always add the matching `include`/`select` for any relation/field you access on
  a query result, or TypeScript will (correctly) reject the access.

## Auth & roles

- `req.user` (`JwtPayload`) carries `roleCode`, `permissions[]`, `unitId`, and a
  deprecated `role` string. Gate routes on `RoleCode`/permissions.
- 2FA uses **otplib 13's functional API**: `generateSecret()`, `generateURI()`,
  `await verify({ token, secret })` → `{ valid }`.
- Privilege-escalation guards (e.g. unit admins cannot mint governance roles)
  live in `modules/auth/auth.service.ts`; keep them and cover with tests.

## Testing

- `vitest run`. Unit tests mock Prisma (see existing `tests/unit/**` patterns).
- Test setup: `tests/setup.ts`. Keep services pure enough to unit-test.

## Build

- `pnpm build` uses `tsconfig.build.json` (lenient). `pnpm build:strict` uses the
  full strict config and is the real quality target. NOTE: `strictNullChecks:false`
  in the lenient config degrades Zod inference (makes all fields optional); prefer
  fixing toward the strict build over relaxing further.
