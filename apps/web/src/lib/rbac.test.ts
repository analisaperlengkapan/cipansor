import { describe, it, expect } from "vitest";
import {
  canAccessRoute,
  deriveLegacyRole,
  getDashboardForRole,
  getEffectiveRole,
  isLegacyRole,
  roleRouteAccess,
  type LegacyRole,
} from "./rbac";

describe("rbac — legacy bucket derivation", () => {
  it("identifies the six legacy buckets", () => {
    for (const role of [
      "SUPER_ADMIN",
      "UNIT_ADMIN",
      "TEACHER",
      "STAFF",
      "STUDENT",
      "PARENT",
    ] as const) {
      expect(isLegacyRole(role)).toBe(true);
    }
    expect(isLegacyRole("SDIT_GURU")).toBe(false);
    expect(isLegacyRole(undefined)).toBe(false);
    expect(isLegacyRole(null)).toBe(false);
  });

  it("mirrors the backend deriveLegacyRole mapping", () => {
    // Admins + governance → UNIT_ADMIN
    expect(deriveLegacyRole("SDIT_ADMIN")).toBe("UNIT_ADMIN");
    expect(deriveLegacyRole("YAYASAN_BENDAHARA")).toBe("UNIT_ADMIN");
    expect(deriveLegacyRole("YAYASAN_KETUA")).toBe("UNIT_ADMIN");
    // Teachers + kepala sekolah + pesantren → TEACHER
    expect(deriveLegacyRole("SMPIT_GURU")).toBe("TEACHER");
    expect(deriveLegacyRole("TKQ_KEPALA_SEKOLAH")).toBe("TEACHER");
    expect(deriveLegacyRole("MUHAFIDZ")).toBe("TEACHER");
    // Tata usaha → STAFF
    expect(deriveLegacyRole("SMAQ_TATA_USAHA")).toBe("STAFF");
    // Students / parents
    expect(deriveLegacyRole("SDIT_SISWA")).toBe("STUDENT");
    expect(deriveLegacyRole("SMPIT_ORANG_TUA")).toBe("PARENT");
    // Identity for real legacy strings
    expect(deriveLegacyRole("SUPER_ADMIN")).toBe("SUPER_ADMIN");
    // Unknown → undefined
    expect(deriveLegacyRole("SOME_FUTURE_ROLE")).toBeUndefined();
  });

  it("maps the expanded hierarchy (rebuilt #319) like the backend", () => {
    // Granular school roles
    expect(deriveLegacyRole("SDIT_WAKASEK")).toBe("TEACHER");
    expect(deriveLegacyRole("SMPIT_WALI_KELAS")).toBe("TEACHER");
    expect(deriveLegacyRole("SMAQ_GURU_BK")).toBe("TEACHER");
    expect(deriveLegacyRole("TKQ_BENDAHARA")).toBe("STAFF");
    // Pesantren leadership + gender-segregated pembina
    expect(deriveLegacyRole("PESANTREN_PENGASUH")).toBe("TEACHER");
    expect(deriveLegacyRole("USTADZ")).toBe("TEACHER");
    expect(deriveLegacyRole("MUSYRIFAH")).toBe("TEACHER");
    expect(deriveLegacyRole("MUHAFIDZAH")).toBe("TEACHER");
    expect(deriveLegacyRole("PESANTREN_TATA_USAHA")).toBe("STAFF");
    // Perguruan Tinggi
    expect(deriveLegacyRole("PT_REKTOR")).toBe("TEACHER");
    expect(deriveLegacyRole("PT_MAHASISWA")).toBe("STUDENT");
    expect(deriveLegacyRole("PT_TATA_USAHA")).toBe("STAFF");
    // Business units → STAFF, never an admin bucket
    expect(deriveLegacyRole("BUSINESS_MANAGER")).toBe("STAFF");
    expect(deriveLegacyRole("BUSINESS_STAFF")).toBe("STAFF");
    // Cross-unit support staff (library/UKS/security/labs)
    expect(deriveLegacyRole("PUSTAKAWAN")).toBe("STAFF");
    expect(deriveLegacyRole("PERAWAT")).toBe("STAFF");
    expect(deriveLegacyRole("KEAMANAN")).toBe("STAFF");
    expect(deriveLegacyRole("LABORAN")).toBe("STAFF");
    // Komite/alumni deliberately unmapped (RoleCode-native authorization)
    expect(deriveLegacyRole("SDIT_KOMITE")).toBeUndefined();
    expect(deriveLegacyRole("SDIT_ALUMNI")).toBeUndefined();
  });
});

describe("rbac — getEffectiveRole", () => {
  it("prefers the legacy user.role bucket (backward compatible)", () => {
    expect(getEffectiveRole({ role: "SUPER_ADMIN" })).toBe("SUPER_ADMIN");
    expect(getEffectiveRole({ role: "PARENT" })).toBe("PARENT");
  });

  it("derives from the primary RoleCode assignment when role is absent", () => {
    const user = {
      userRoles: [
        { isPrimary: false, role: { code: "SDIT_SISWA" } },
        { isPrimary: true, role: { code: "SDIT_ORANG_TUA" } },
      ],
    };
    expect(getEffectiveRole(user)).toBe("PARENT");
  });

  it("falls back to the first assignment when none is primary", () => {
    const user = {
      userRoles: [{ role: { code: "SMPIT_GURU" } }],
    };
    expect(getEffectiveRole(user)).toBe("TEACHER");
  });

  it("derives from a RoleCode sitting in user.role", () => {
    expect(getEffectiveRole({ role: "YAYASAN_ADMIN" })).toBe("UNIT_ADMIN");
  });

  it("returns undefined for empty/unknown input", () => {
    expect(getEffectiveRole(null)).toBeUndefined();
    expect(getEffectiveRole(undefined)).toBeUndefined();
    expect(getEffectiveRole({})).toBeUndefined();
    expect(getEffectiveRole({ role: "MYSTERY" })).toBeUndefined();
  });
});

describe("rbac — getDashboardForRole", () => {
  const cases: Array<[LegacyRole, string]> = [
    ["SUPER_ADMIN", "/dashboard"],
    ["UNIT_ADMIN", "/dashboard"],
    ["TEACHER", "/teacher"],
    ["STAFF", "/staff"],
    ["STUDENT", "/student"],
    ["PARENT", "/parent"],
  ];
  it.each(cases)("routes %s → %s", (role, dashboard) => {
    expect(getDashboardForRole(role)).toBe(dashboard);
  });
  it("defaults to /dashboard when role is undefined", () => {
    expect(getDashboardForRole(undefined)).toBe("/dashboard");
  });
});

describe("rbac — canAccessRoute", () => {
  it("super admin reaches every route", () => {
    expect(canAccessRoute("SUPER_ADMIN", "/anything/deep")).toBe(true);
    expect(canAccessRoute("SUPER_ADMIN", "/settings/roles")).toBe(true);
  });

  it("parent is confined to /parent", () => {
    expect(canAccessRoute("PARENT", "/parent")).toBe(true);
    expect(canAccessRoute("PARENT", "/parent/finance")).toBe(true);
    expect(canAccessRoute("PARENT", "/dashboard")).toBe(false);
    expect(canAccessRoute("PARENT", "/students")).toBe(false);
  });

  it("teacher can reach teaching routes but not admin settings", () => {
    expect(canAccessRoute("TEACHER", "/teacher")).toBe(true);
    expect(canAccessRoute("TEACHER", "/tahfidz/murojaah")).toBe(true);
    expect(canAccessRoute("TEACHER", "/settings")).toBe(false);
    expect(canAccessRoute("TEACHER", "/finance")).toBe(false);
  });

  it("unit admin can reach talenta (API authorizes UNIT_ADMIN on /talenta routes)", () => {
    expect(canAccessRoute("UNIT_ADMIN", "/talenta")).toBe(true);
    expect(canAccessRoute("UNIT_ADMIN", "/talenta/succession")).toBe(true);
  });

  it("staff can reach finance but not the teacher dashboard", () => {
    expect(canAccessRoute("STAFF", "/finance")).toBe(true);
    expect(canAccessRoute("STAFF", "/teacher")).toBe(false);
  });

  it("student is confined to student routes", () => {
    expect(canAccessRoute("STUDENT", "/student")).toBe(true);
    expect(canAccessRoute("STUDENT", "/schedule")).toBe(true);
    expect(canAccessRoute("STUDENT", "/finance")).toBe(false);
  });

  it("denies when role is undefined", () => {
    expect(canAccessRoute(undefined, "/dashboard")).toBe(false);
  });

  it("every non-super role has a non-empty allow list", () => {
    (
      Object.keys(roleRouteAccess) as LegacyRole[]
    ).forEach((role) => {
      expect(roleRouteAccess[role].length).toBeGreaterThan(0);
    });
  });
});
