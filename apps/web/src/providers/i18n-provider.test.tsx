import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider, useI18n } from "./i18n-provider";
import {
  translations,
  resolvePath,
  dirFor,
  isLocale,
  LOCALES,
} from "@/locales";

// The provider calls `router.refresh()` so server components pick up the new
// cookie. Outside a Next app-router tree `useRouter()` throws, and the point of
// the mock is not only to prevent that — `refresh` is asserted below, because
// dropping the call is invisible in a client-only test while it silently leaves
// every server-rendered public page in the previous language.
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

beforeEach(() => {
  refresh.mockClear();
});

function Probe() {
  const { locale, setLocale, t, dir } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="save">{t("common.save")}</span>
      <button onClick={() => setLocale("ar")}>to-ar</button>
      <button onClick={() => setLocale("en")}>to-en</button>
    </div>
  );
}

describe("locales dictionaries", () => {
  it("en and ar mirror every leaf key of id (no missing translations)", () => {
    const collectPaths = (obj: object, prefix = ""): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === "string"
          ? [`${prefix}${k}`]
          : collectPaths(v as object, `${prefix}${k}.`),
      );
    const idPaths = collectPaths(translations.id);
    expect(idPaths.length).toBeGreaterThan(100);
    for (const loc of LOCALES) {
      for (const p of idPaths) {
        expect(
          resolvePath(translations[loc], p),
          `${loc} missing "${p}"`,
        ).toBeTypeOf("string");
      }
    }
  });

  it("helpers: isLocale + dirFor", () => {
    expect(isLocale("id")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("id")).toBe("ltr");
    expect(dirFor("en")).toBe("ltr");
  });
});

describe("I18nProvider", () => {
  it("defaults to Indonesian and translates", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale").textContent).toBe("id");
    expect(screen.getByTestId("dir").textContent).toBe("ltr");
    expect(screen.getByTestId("save").textContent).toBe("Simpan");
  });

  it("respects the server-provided initialLocale (SSR path)", () => {
    render(
      <I18nProvider initialLocale="en">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("save").textContent).toBe("Save");
  });

  it("switching to Arabic flips dir to rtl, persists cookie, updates <html>", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText("to-ar"));
    expect(screen.getByTestId("locale").textContent).toBe("ar");
    expect(screen.getByTestId("dir").textContent).toBe("rtl");
    expect(screen.getByTestId("save").textContent).toBe("حفظ");
    expect(document.cookie).toContain("app-locale=ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");

    fireEvent.click(screen.getByText("to-en"));
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("refreshes the server components so public pages follow the switch", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(refresh).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("to-en"));

    // The cookie must already be written when the refresh goes out, otherwise
    // the server re-renders in the language the reader just left.
    expect(document.cookie).toContain("app-locale=en");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh for a locale it rejects", () => {
    function BadProbe() {
      const { setLocale } = useI18n();
      const notALocale = "fr" as Parameters<typeof setLocale>[0];
      return <button onClick={() => setLocale(notALocale)}>to-fr</button>;
    }
    render(
      <I18nProvider>
        <BadProbe />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText("to-fr"));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("falls back id → explicit fallback → path for unknown keys", () => {
    function FallbackProbe() {
      const { t } = useI18n();
      // Cast exercises the runtime fallback chain for a key that typing
      // would normally reject.
      const missing = "common.doesNotExist" as Parameters<typeof t>[0];
      return (
        <>
          <span data-testid="fb">{t(missing, "Fallback!")}</span>
          <span data-testid="path">{t(missing)}</span>
        </>
      );
    }
    render(
      <I18nProvider>
        <FallbackProbe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("fb").textContent).toBe("Fallback!");
    expect(screen.getByTestId("path").textContent).toBe("common.doesNotExist");
  });

  it("useI18n outside the provider throws", () => {
    expect(() => render(<Probe />)).toThrow(/inside <I18nProvider>/);
  });
});
