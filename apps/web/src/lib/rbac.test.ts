import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  canAccessRoute,
  deriveLegacyRole,
  getDashboardForRole,
  getEffectiveRole,
  isLegacyRole,
  roleRouteAccess,
  type LegacyRole,
} from "./rbac";
import {
  getNavigationForRoleCode,
  type NavGroup,
} from "@/config/navigation";
import { DEMO_ACCOUNTS } from "@cipansor/shared";

/** All 81 RoleCodes, taken from the demo-account catalogue (one per role). */
const ALL_ROLE_CODES = DEMO_ACCOUNTS.map((a) => a.roleCode);

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
    expect(deriveLegacyRole("SMPIT_ALUMNI")).toBeUndefined();
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
    expect(getEffectiveRole({ role: "YAYASAN_KETUA" })).toBe("UNIT_ADMIN");
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

  it("teacher can reach teaching routes but not foundation administration", () => {
    expect(canAccessRoute("TEACHER", "/teacher")).toBe(true);
    expect(canAccessRoute("TEACHER", "/tahfidz/murojaah")).toBe(true);
    // /settings is per-user preferences (appearance/language/notifications),
    // linked from the header menu for every signed-in user — not admin config.
    expect(canAccessRoute("TEACHER", "/settings")).toBe(true);
    expect(canAccessRoute("TEACHER", "/finance")).toBe(false);
    expect(canAccessRoute("TEACHER", "/units")).toBe(false);
    expect(canAccessRoute("TEACHER", "/procurement")).toBe(false);
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

describe("rbac — navigation and route access stay in sync", () => {
  // These two files are one contract seen from both ends: navigation.ts decides
  // what a role is shown, rbac.ts decides what it may open. When they drift the
  // sidebar renders links that bounce the user to /unauthorized — which is
  // exactly what happened before this suite existed (188 of 292 links dead).
  const navToBucket: Array<[NavGroup[], LegacyRole]> = [
    [getNavigationForRoleCode("SUPER_ADMIN"), "SUPER_ADMIN"],
    [getNavigationForRoleCode("YAYASAN_KETUA"), "UNIT_ADMIN"],
    [getNavigationForRoleCode("SMPIT_GURU"), "TEACHER"],
    [getNavigationForRoleCode("SMPIT_KEPALA_SEKOLAH"), "TEACHER"],
    [getNavigationForRoleCode("PESANTREN_PENGASUH"), "TEACHER"],
    [getNavigationForRoleCode("MUSYRIF"), "TEACHER"],
    [getNavigationForRoleCode("PT_REKTOR"), "TEACHER"],
    [getNavigationForRoleCode("PT_DOSEN"), "TEACHER"],
    [getNavigationForRoleCode("SMPIT_TATA_USAHA"), "STAFF"],
    [getNavigationForRoleCode("SDIT_KOMITE"), "STAFF"],
    [getNavigationForRoleCode("SMPIT_SISWA"), "STUDENT"],
    [getNavigationForRoleCode("PT_MAHASISWA"), "STUDENT"],
    [getNavigationForRoleCode("SMPIT_ALUMNI"), "STUDENT"],
    [getNavigationForRoleCode("SMPIT_ORANG_TUA"), "PARENT"],
  ];

  it.each(navToBucket)(
    "every rendered sidebar link is reachable by its bucket",
    (nav, bucket) => {
      const unreachable = nav
        .flatMap((group) => group.items.map((item) => item.href))
        .filter((href) => !canAccessRoute(bucket, href));
      expect(unreachable).toEqual([]);
    },
  );

  it("gives every one of the 81 RoleCodes a real menu, not the stub", () => {
    // The fallback nav is Dashboard + Notifications + Settings. Any RoleCode
    // landing on it has simply been forgotten.
    const stubSize = 3;
    const forgotten = ALL_ROLE_CODES.filter((code) => {
      const nav = getNavigationForRoleCode(code);
      const items = nav.flatMap((g) => g.items);
      return items.length <= stubSize;
    });
    expect(forgotten).toEqual([]);
  });
});

describe("navigation — every menu link points at a page that exists", () => {
  // /foundation/board shipped in the Yayasan sidebar with no page behind it.
  // Because Next prefetches sidebar links, that 404 fired on *every* page load
  // for those roles. Walk the app directory so a missing page fails here first.
  const APP_DIR = path.join(process.cwd(), "src", "app");

  function routeExists(href: string): boolean {
    const segments = href.split("/").filter(Boolean);
    let dir = APP_DIR;
    for (const segment of segments) {
      const literal = path.join(dir, segment);
      if (fs.existsSync(literal) && fs.statSync(literal).isDirectory()) {
        dir = literal;
        continue;
      }
      // fall back to a dynamic segment ([id], [slug], ...)
      const dynamic = fs
        .readdirSync(dir, { withFileTypes: true })
        .find((e) => e.isDirectory() && e.name.startsWith("["));
      if (!dynamic) return false;
      dir = path.join(dir, dynamic.name);
    }
    return fs.existsSync(path.join(dir, "page.tsx"));
  }

  const ROLE_SAMPLE = [
    "SUPER_ADMIN",
    "YAYASAN_KETUA",
    "SMPIT_GURU",
    "SMPIT_KEPALA_SEKOLAH",
    "PESANTREN_PENGASUH",
    "MUSYRIF",
    "PT_REKTOR",
    "PT_DOSEN",
    "PT_MAHASISWA",
    "SMPIT_TATA_USAHA",
    "SDIT_KOMITE",
    "SMPIT_SISWA",
    "SMPIT_ALUMNI",
    "SMPIT_ORANG_TUA",
  ];

  it.each(ROLE_SAMPLE)("%s has no dead menu links", (roleCode) => {
    const dead = getNavigationForRoleCode(roleCode)
      .flatMap((group) => group.items.map((item) => item.href))
      .filter((href) => !routeExists(href));
    expect(dead).toEqual([]);
  });

  it.each(ROLE_SAMPLE)("%s lists no route twice", (roleCode) => {
    const hrefs = getNavigationForRoleCode(roleCode).flatMap((group) =>
      group.items.map((item) => item.href),
    );
    const duplicated = [...new Set(hrefs)].filter(
      (href) => hrefs.filter((h) => h === href).length > 1,
    );
    expect(duplicated).toEqual([]);
  });
});
