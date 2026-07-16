import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the underlying auth hook so we can drive user state directly.
const mockUseAuth = vi.fn();
vi.mock("./use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

import {
  usePermission,
  useHasAnyPermission,
  useHasAllPermissions,
} from "./use-permission";

describe("use-permission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("grants everything to SUPER_ADMIN regardless of permissions", () => {
    mockUseAuth.mockReturnValue({ user: { role: "SUPER_ADMIN" } });
    expect(usePermission("anything.here")).toBe(true);
    expect(useHasAnyPermission(["a", "b"])).toBe(true);
    expect(useHasAllPermissions(["a", "b"])).toBe(true);
  });

  it("checks the permission list for non-super users", () => {
    mockUseAuth.mockReturnValue({
      user: { role: "TEACHER", permissions: ["students.read", "grades.write"] },
    });
    expect(usePermission("students.read")).toBe(true);
    expect(usePermission("finance.read")).toBe(false);
  });

  it("useHasAnyPermission requires at least one match", () => {
    mockUseAuth.mockReturnValue({
      user: { role: "STAFF", permissions: ["health.read"] },
    });
    expect(useHasAnyPermission(["health.read", "x"])).toBe(true);
    expect(useHasAnyPermission(["x", "y"])).toBe(false);
  });

  it("useHasAllPermissions requires every match", () => {
    mockUseAuth.mockReturnValue({
      user: { role: "STAFF", permissions: ["a", "b"] },
    });
    expect(useHasAllPermissions(["a", "b"])).toBe(true);
    expect(useHasAllPermissions(["a", "c"])).toBe(false);
  });

  it("denies when there is no user or no permissions", () => {
    mockUseAuth.mockReturnValue({ user: null });
    expect(usePermission("a")).toBe(false);
    mockUseAuth.mockReturnValue({ user: { role: "TEACHER" } });
    expect(usePermission("a")).toBe(false);
  });
});
