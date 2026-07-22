import { describe, it, expect } from "vitest";
import {
  yayasanOrganOf,
  yayasanOrganConflict,
  YAYASAN_ORGAN_BY_ROLE,
} from "./yayasan-organ";

/**
 * Mirrors apps/api/src/utils/role-eligibility.test.ts. The API and the DB
 * trigger are what enforce this; these tests exist so the form's guidance does
 * not quietly disagree with them.
 */
describe("yayasan organ exclusivity (UI mirror)", () => {
  it("covers exactly the six yayasan organ roles", () => {
    expect(Object.keys(YAYASAN_ORGAN_BY_ROLE).sort()).toEqual([
      "YAYASAN_ANGGOTA",
      "YAYASAN_BENDAHARA",
      "YAYASAN_KETUA",
      "YAYASAN_PEMBINA",
      "YAYASAN_PENGAWAS",
      "YAYASAN_SEKRETARIS",
    ]);
  });

  it("maps the four pengurus seats to one organ", () => {
    for (const code of [
      "YAYASAN_KETUA",
      "YAYASAN_SEKRETARIS",
      "YAYASAN_BENDAHARA",
      "YAYASAN_ANGGOTA",
    ]) {
      expect(yayasanOrganOf(code)).toBe("PENGURUS");
    }
  });

  it("ignores roles outside the yayasan", () => {
    expect(yayasanOrganOf("SDIT_GURU")).toBeUndefined();
    expect(yayasanOrganConflict("SDIT_GURU", ["YAYASAN_PEMBINA"])).toBeNull();
  });

  // The exact arrangement the seed used to produce.
  it("refuses Pembina for someone already Pengurus, and the reverse", () => {
    expect(yayasanOrganConflict("YAYASAN_PEMBINA", ["YAYASAN_KETUA"])).toMatch(
      /Pasal 29/,
    );
    expect(yayasanOrganConflict("YAYASAN_KETUA", ["YAYASAN_PEMBINA"])).toMatch(
      /Pasal 29/,
    );
  });

  it("refuses Pengawas alongside either of the others", () => {
    expect(
      yayasanOrganConflict("YAYASAN_PENGAWAS", ["YAYASAN_PEMBINA"]),
    ).not.toBeNull();
    expect(
      yayasanOrganConflict("YAYASAN_PENGAWAS", ["YAYASAN_BENDAHARA"]),
    ).not.toBeNull();
  });

  it("allows two seats within the same organ", () => {
    expect(
      yayasanOrganConflict("YAYASAN_BENDAHARA", ["YAYASAN_KETUA"]),
    ).toBeNull();
  });

  it("allows a yayasan role alongside a school role", () => {
    expect(
      yayasanOrganConflict("YAYASAN_BENDAHARA", [
        "SDIT_BENDAHARA",
        "SDIT_ORANG_TUA",
      ]),
    ).toBeNull();
  });

  it("allows the first yayasan role a person is given", () => {
    expect(yayasanOrganConflict("YAYASAN_PEMBINA", [])).toBeNull();
  });
});
