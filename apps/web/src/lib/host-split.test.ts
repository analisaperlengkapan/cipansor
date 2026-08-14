import { describe, it, expect } from "vitest";
import {
  hostSplitTargetFor,
  PUBLIC_HOST,
  PORTAL_HOST,
  PUBLIC_PATH_PREFIXES,
} from "./host-split";

/**
 * The split is a redirect rule applied to every request, so its failure modes
 * are the loud kind: a marketing page that bounces visitors to a login screen,
 * or an application route that lands on a host with no session and no way back.
 * These tests pin the shape of both directions.
 */
describe("hostSplitTargetFor", () => {
  describe("unknown hosts are left alone", () => {
    // `pnpm dev` serves both halves from one origin. If the split fired there,
    // every developer would be redirected to production the moment they opened
    // /dashboard.
    it.each(["localhost", "localhost:3000", "127.0.0.1:3000", "", null])(
      "%s → no redirect",
      (host) => {
        expect(hostSplitTargetFor(host, "/dashboard")).toBeNull();
        expect(hostSplitTargetFor(host, "/profil")).toBeNull();
      },
    );
  });

  describe("public host", () => {
    it("keeps the landing page", () => {
      expect(hostSplitTargetFor(PUBLIC_HOST, "/")).toBeNull();
    });

    it.each(PUBLIC_PATH_PREFIXES)("keeps %s", (prefix) => {
      expect(hostSplitTargetFor(PUBLIC_HOST, prefix)).toBeNull();
      expect(hostSplitTargetFor(PUBLIC_HOST, `${prefix}/anak`)).toBeNull();
    });

    it.each([
      "/login",
      "/dashboard",
      "/unauthorized",
      "/keuangan/invoice",
      "/perencanaan",
      "/settings/chatbot",
    ])("sends %s to the portal", (path) => {
      expect(hostSplitTargetFor(PUBLIC_HOST, path)).toBe(PORTAL_HOST);
    });

    it("treats www the same as the apex", () => {
      expect(hostSplitTargetFor(`www.${PUBLIC_HOST}`, "/dashboard")).toBe(
        PORTAL_HOST,
      );
      expect(hostSplitTargetFor(`www.${PUBLIC_HOST}`, "/profil")).toBeNull();
    });
  });

  describe("portal host", () => {
    it.each(PUBLIC_PATH_PREFIXES)("sends %s back to the public host", (prefix) => {
      expect(hostSplitTargetFor(PORTAL_HOST, prefix)).toBe(PUBLIC_HOST);
      expect(hostSplitTargetFor(PORTAL_HOST, `${prefix}/anak`)).toBe(PUBLIC_HOST);
    });

    it("keeps the root, which is the way in to the application", () => {
      // Not a marketing page here: middleware turns it into the dashboard or
      // the login screen. Bouncing it to the apex would strand anyone who typed
      // the portal's name on the marketing site instead.
      expect(hostSplitTargetFor(PORTAL_HOST, "/")).toBeNull();
    });

    it.each(["/login", "/dashboard", "/unauthorized", "/keuangan"])(
      "keeps %s",
      (path) => {
        expect(hostSplitTargetFor(PORTAL_HOST, path)).toBeNull();
      },
    );
  });

  describe("prefix matching respects segment boundaries", () => {
    // "/unit" is public; "/units" is the admin CRUD page. Matching on a bare
    // string prefix would hand the admin page to the marketing host, where
    // there is no session to open it with.
    it("does not treat /units as public", () => {
      expect(hostSplitTargetFor(PUBLIC_HOST, "/units")).toBe(PORTAL_HOST);
      expect(hostSplitTargetFor(PORTAL_HOST, "/units")).toBeNull();
    });

    it("does not treat /unit-usaha as public", () => {
      expect(hostSplitTargetFor(PUBLIC_HOST, "/unit-usaha")).toBe(PORTAL_HOST);
    });
  });

  it("is case-insensitive and port-insensitive about the host", () => {
    expect(hostSplitTargetFor("Portal.Cipansor.Or.Id:443", "/profil")).toBe(
      PUBLIC_HOST,
    );
    expect(hostSplitTargetFor("CIPANSOR.OR.ID", "/dashboard")).toBe(PORTAL_HOST);
  });

  it("never returns the host the request already arrived on", () => {
    // A rule that returns its own host is an infinite redirect loop, and it
    // would take the whole site down rather than one page.
    const paths = ["/", "/profil", "/unit/smpit", "/dashboard", "/login", "/x"];
    for (const path of paths) {
      expect(hostSplitTargetFor(PUBLIC_HOST, path)).not.toBe(PUBLIC_HOST);
      expect(hostSplitTargetFor(PORTAL_HOST, path)).not.toBe(PORTAL_HOST);
    }
  });
});
