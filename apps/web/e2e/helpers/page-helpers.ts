import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Page Helper Utilities
 * Reusable functions for common page interactions
 */

/**
 * Wait for loading spinner to disappear
 */
export async function waitForLoadingComplete(page: Page, timeout = 15000) {
  const spinner = page.locator('.animate-spin, [role="progressbar"], .loading');
  await expect(spinner).not.toBeVisible({ timeout });
}

/**
 * Wait for toast notification
 */
export async function waitForToast(
  page: Page,
  message?: string | RegExp,
  type: "success" | "error" | "info" = "success",
) {
  const toast = message
    ? page.getByRole("status").filter({ hasText: message })
    : page.getByRole("status");

  await expect(toast).toBeVisible({ timeout: 5000 });
  return toast;
}

/**
 * Fill form fields by label
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    const input = page.getByLabel(new RegExp(label, "i"));
    await input.fill(value);
  }
}

/**
 * Select from shadcn/ui Select (combobox)
 */
export async function selectOption(
  page: Page,
  triggerText: string | RegExp,
  optionText: string | RegExp,
) {
  // Click the combobox trigger
  const trigger = page
    .locator('button[role="combobox"]')
    .filter({ hasText: triggerText })
    .first();
  await trigger.click();

  // Select the option
  const option = page.getByRole("option", { name: optionText });
  await option.click();
}

/**
 * Click table row by index or text
 */
export async function clickTableRow(
  page: Page,
  identifier: number | string | RegExp,
  tableSelector = "table",
) {
  const table = page.locator(tableSelector);

  if (typeof identifier === "number") {
    const row = table.locator("tbody tr").nth(identifier);
    await row.click();
  } else {
    const row = table.locator("tbody tr").filter({ hasText: identifier });
    await row.first().click();
  }
}

/**
 * Wait for API call to complete
 */
export async function waitForAPICall(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000,
): Promise<any> {
  const response = await page.waitForResponse(
    (resp) => {
      const url = resp.url();
      if (typeof urlPattern === "string") {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout },
  );

  return response.json();
}

/**
 * Navigate to page and wait for load
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await waitForLoadingComplete(page);
}

/**
 * Check if element has data
 */
export async function hasData(locator: Locator): Promise<boolean> {
  try {
    await expect(locator).toBeVisible({ timeout: 3000 });
    const text = await locator.textContent();
    return text !== null && text.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Verify page has no console errors
 */
export async function checkNoConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return {
    getErrors: () => errors,
    hasErrors: () => errors.length > 0,
  };
}

/**
 * Wait for WebSocket connection
 */
export async function waitForWebSocket(
  page: Page,
  timeout = 10000,
): Promise<void> {
  await page
    .waitForFunction(
      () => {
        // @ts-ignore
        return window.__wsConnected === true;
      },
      { timeout },
    )
    .catch(() => {
      console.warn("WebSocket connection not detected, continuing anyway...");
    });
}

/**
 * Get table data as array
 */
export async function getTableData(
  page: Page,
  tableSelector = "table",
): Promise<string[][]> {
  const table = page.locator(tableSelector);
  const rows = await table.locator("tbody tr").all();

  const data: string[][] = [];
  for (const row of rows) {
    const cells = await row.locator("td").allTextContents();
    data.push(cells);
  }

  return data;
}
