import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ALL_ROLE_CODES } from "@cipansor/shared";
import {
  NAV_REGISTRY,
  NAV_GROUP_ORDER,
  menuEntriesForRole,
  roleCodeCanAccess,
} from "./nav-registry";

describe("nav-registry hygiene", () => {
  it("paths are unique, absolute, and have no trailing slash", () => {
    const paths = NAV_REGISTRY.map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of paths) {
      expect(p.startsWith("/")).toBe(true);
      expect(p.endsWith("/")).toBe(false);
    }
  });

  it("every entry has a known group and at least one valid roleCode", () => {
    for (const entry of NAV_REGISTRY) {
      expect(NAV_GROUP_ORDER).toContain(entry.group);
      expect(entry.roleCodes.length).toBeGreaterThan(0);
      const unknown = entry.roleCodes.filter(
        (c) => !ALL_ROLE_CODES.includes(c),
      );
      expect(unknown).toEqual([]);
    }
  });

  it("every registry path points at an existing page", () => {
    const appDir = path.resolve(__dirname, "../app");
    const missing = NAV_REGISTRY.map((e) => e.path).filter(
      (p) => !fs.existsSync(path.join(appDir, p.slice(1), "page.tsx")),
    );
    expect(missing).toEqual([]);
  });
});

describe("menu visibility implies route access (the G1 invariant)", () => {
  it("holds for every role and every visible entry", () => {
    for (const roleCode of ALL_ROLE_CODES) {
      for (const entry of menuEntriesForRole(roleCode)) {
        expect(
          roleCodeCanAccess(roleCode, entry.path),
          `${roleCode} sees ${entry.path} in the menu but cannot open it`,
        ).toBe(true);
      }
    }
  });

  it("every role has a usable menu (no empty sidebars — the G3 fix)", () => {
    for (const roleCode of ALL_ROLE_CODES) {
      expect(
        menuEntriesForRole(roleCode).length,
        `${roleCode} has an empty menu`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("least-privilege spot checks", () => {
  it("kepala sekolah does not manage users/HR/admissions (G2)", () => {
    for (const p of ["/users", "/hr", "/admissions"]) {
      expect(roleCodeCanAccess("SDIT_KEPALA_SEKOLAH", p)).toBe(false);
    }
  });

  it("pesantren mentors get dormitory/tahfidz surfaces but no admin surfaces", () => {
    expect(roleCodeCanAccess("MUSYRIF", "/dormitories")).toBe(true);
    expect(roleCodeCanAccess("MUSYRIF", "/tahfidz")).toBe(true);
    expect(roleCodeCanAccess("MUSYRIF", "/users")).toBe(false);
    expect(roleCodeCanAccess("MUSYRIF", "/finance")).toBe(false);
  });

  it("business staff get their service modules only", () => {
    expect(roleCodeCanAccess("BUSINESS_STAFF", "/canteen")).toBe(true);
    expect(roleCodeCanAccess("BUSINESS_STAFF", "/laundry")).toBe(true);
    expect(roleCodeCanAccess("BUSINESS_STAFF", "/students")).toBe(false);
  });

  it("librarian gets the library, nurse gets the clinic", () => {
    expect(roleCodeCanAccess("PUSTAKAWAN", "/library")).toBe(true);
    expect(roleCodeCanAccess("PERAWAT", "/health")).toBe(true);
    expect(roleCodeCanAccess("PUSTAKAWAN", "/health")).toBe(false);
    expect(roleCodeCanAccess("PERAWAT", "/library")).toBe(false);
  });

  it("students and parents cannot reach admin routes", () => {
    for (const role of ["SDIT_SISWA", "SDIT_ORANG_TUA"]) {
      for (const p of ["/users", "/finance", "/hr", "/settings"]) {
        expect(roleCodeCanAccess(role, p)).toBe(false);
      }
    }
  });

  it("only SUPER_ADMIN can open the frozen GRC-style modules", () => {
    for (const p of ["/risk-management", "/perencanaan", "/litbang", "/syariah"]) {
      expect(roleCodeCanAccess("SDIT_ADMIN", p)).toBe(false);
    }
    expect(roleCodeCanAccess("YAYASAN_PENGAWAS", "/risk-management")).toBe(true);
  });
});
