import { test, expect } from "@playwright/test";
import { id } from "../src/locales/id";
import { en } from "../src/locales/en";
import { ar } from "../src/locales/ar";
import { publicContentFor } from "../src/config/content.i18n";

/**
 * Language switching on the public site.
 *
 * The public pages are server components: they read the `app-locale` cookie
 * through lib/server-locale.ts rather than the client `useI18n` hook. That
 * split is the interesting part, and it is where this broke — setting React
 * state and a cookie flips the navbar, which is a client component, while the
 * article underneath it goes on being server-rendered in the previous
 * language until something asks the server again.
 *
 * So these tests assert both halves in one action: after picking a language,
 * the menu *and* the prose must have changed, without a manual reload.
 */

const LANGUAGE_LABEL = id.common.language;

/** Open the header's language menu and pick a language by its native name. */
async function switchTo(page: import("@playwright/test").Page, label: string) {
  // Both the desktop and mobile switchers are in the DOM at every width; one
  // is hidden by CSS. `.first()` would pick whichever comes first in source
  // order rather than the one on screen, so filter by visibility.
  await page
    .getByRole("button", { name: LANGUAGE_LABEL })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("menuitem", { name: label }).click();
}

test("the public header offers a language switcher at all", async ({ page }) => {
  await page.goto("/");
  await expect(
    page
      .getByRole("button", { name: LANGUAGE_LABEL })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
});

test("switching language changes the menu and the server-rendered prose", async ({
  page,
}) => {
  await page.goto("/profil");

  // Indonesian to begin with.
  await expect(
    page.getByRole("heading", { name: publicContentFor("id").profilePage.title }),
  ).toBeVisible();

  await switchTo(page, "English");

  // The client half: the navbar re-renders from the dictionary.
  await expect(
    page.getByRole("link", { name: en.public.nav.units, exact: true }).first(),
  ).toBeVisible();

  // The server half. This is the assertion that fails if the refresh after the
  // cookie write is dropped — the heading comes from a server component, so
  // nothing but a new server render can change it.
  await expect(
    page.getByRole("heading", { name: publicContentFor("en").profilePage.title }),
  ).toBeVisible();

  // And the document direction, which the root layout stamps server-side.
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("Arabic switches the document to RTL and translates the prose", async ({
  page,
}) => {
  await page.goto("/profil");
  await switchTo(page, "العربية");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(
    page.getByRole("heading", { name: publicContentFor("ar").profilePage.title }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: ar.public.nav.news, exact: true }).first(),
  ).toBeVisible();
});

test("the choice survives a reload and follows to another page", async ({
  page,
}) => {
  await page.goto("/profil");
  await switchTo(page, "English");
  await expect(
    page.getByRole("heading", { name: publicContentFor("en").profilePage.title }),
  ).toBeVisible();

  // A cookie, not component state: a fresh document must come back in English.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: publicContentFor("en").profilePage.title }),
  ).toBeVisible();

  await page.goto("/");
  await expect(
    page.getByRole("link", { name: en.public.nav.news, exact: true }).first(),
  ).toBeVisible();
});

test("facts on the legal documents are not translated", async ({ page }) => {
  // The decree number and the registered ID are transcriptions of an issued
  // document. A "translated" identifier is a wrong identifier, and Google for
  // Nonprofits checks this page against the real one.
  const DECREE = "AHU-3039.AH.01.04.Tahun 2022";
  const NPWP = "31.512.635.9-425.000";

  await page.goto("/profil");
  for (const label of ["English", "العربية"]) {
    await switchTo(page, label);
    await expect(page.getByText(DECREE).first()).toBeVisible();
    await expect(page.getByText(NPWP).first()).toBeVisible();
  }
});
