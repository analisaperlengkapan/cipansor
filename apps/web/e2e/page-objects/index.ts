import type { Page } from '@playwright/test';

/**
 * Dashboard Page Object Model
 * Encapsulates dashboard page interactions
 */
export class DashboardPage {
  constructor(private page: Page) {}

  // Locators
  get heading() {
    return this.page.getByRole('heading', { name: /dashboard/i });
  }

  get quickStatsCards() {
    return this.page.locator('[data-testid="quick-stats-card"]');
  }

  get totalStudentsCard() {
    return this.page.getByText(/total (santri|students)/i);
  }

  get totalTeachersCard() {
    return this.page.getByText(/total (guru|teachers)/i);
  }

  get todayAttendanceCard() {
    return this.page.getByText(/kehadiran hari ini|today.*attendance/i);
  }

  get realtimeIndicator() {
    return this.page.locator('[data-testid="realtime-indicator"]');
  }

  // Actions
  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForDataLoad() {
    await this.page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 });
  }

  async verifyQuickStats() {
    await this.totalStudentsCard.waitFor({ state: 'visible' });
    await this.totalTeachersCard.waitFor({ state: 'visible' });
    await this.todayAttendanceCard.waitFor({ state: 'visible' });
  }

  async getStatValue(statName: string): Promise<string> {
    const card = this.page.getByText(new RegExp(statName, 'i')).locator('..');
    const value = await card.locator('[data-testid="stat-value"]').textContent();
    return value || '0';
  }
}

/**
 * Tahfidz Dashboard Page Object Model
 */
export class TahfidzDashboardPage {
  constructor(private page: Page) {}

  // Locators
  get heading() {
    return this.page.getByRole('heading', { name: /dashboard tahfidz/i });
  }

  get totalRecordsCard() {
    return this.page.getByText(/total catatan/i);
  }

  get activeSantriCard() {
    return this.page.getByText(/santri aktif/i);
  }

  get totalJuzCard() {
    return this.page.getByText(/total juz/i);
  }

  get recordTypeChart() {
    return this.page.getByText(/catatan per tipe/i);
  }

  get topSantriSection() {
    return this.page.getByText(/top 10 santri/i);
  }

  get progressPerJuzSection() {
    return this.page.getByText(/progress per juz/i);
  }

  get recentRecordsTable() {
    return this.page.locator('table').filter({ hasText: /catatan terbaru/i });
  }

  // Actions
  async goto() {
    await this.page.goto('/tahfidz/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForDataLoad() {
    await this.page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 });
  }

  async selectUnit(unitName: string | RegExp) {
    const unitSelect = this.page.locator('button[role="combobox"]')
      .filter({ hasText: /semua unit|unit/i })
      .first();
    
    await unitSelect.click();
    await this.page.getByRole('option', { name: unitName }).click();
    await this.waitForDataLoad();
  }

  async verifyAllSections() {
    await this.totalRecordsCard.waitFor({ state: 'visible' });
    await this.activeSantriCard.waitFor({ state: 'visible' });
    await this.recordTypeChart.waitFor({ state: 'visible' });
    await this.topSantriSection.waitFor({ state: 'visible' });
  }

  async clickRecentRecord(index = 0) {
    const row = this.recentRecordsTable.locator('tbody tr').nth(index);
    await row.click();
  }
}

/**
 * PAUD Assessment Page Object Model
 */
export class PAUDAssessmentPage {
  constructor(private page: Page) {}

  // Locators
  get heading() {
    return this.page.getByRole('heading', { name: /penilaian paud/i });
  }

  get studentSelect() {
    return this.page.locator('button[role="combobox"]')
      .filter({ hasText: /pilih santri|select student/i });
  }

  get aspectTabs() {
    return this.page.locator('[role="tablist"]');
  }

  get indicatorCheckboxes() {
    return this.page.locator('input[type="checkbox"]');
  }

  get achievementLevelRadios() {
    return this.page.locator('input[type="radio"][name*="achievementLevel"]');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: /simpan|save/i });
  }

  // Actions
  async goto() {
    await this.page.goto('/paud/assessment');
    await this.page.waitForLoadState('networkidle');
  }

  async selectStudent(studentName: string) {
    await this.studentSelect.click();
    await this.page.getByRole('option', { name: studentName }).click();
  }

  async selectAspect(aspectName: string) {
    await this.page.getByRole('tab', { name: new RegExp(aspectName, 'i') }).click();
  }

  async selectIndicator(indicatorText: string | RegExp) {
    const checkbox = this.page.locator('label')
      .filter({ hasText: indicatorText })
      .locator('input[type="checkbox"]');
    await checkbox.check();
  }

  async setAchievementLevel(level: 'BB' | 'MB' | 'BSH' | 'BSB') {
    const radio = this.page.locator(`input[value="${level}"]`).first();
    await radio.check();
  }

  async saveAssessment() {
    await this.saveButton.click();
    // Wait for success toast
    await this.page.getByRole('status').filter({ hasText: /berhasil|success/i })
      .waitFor({ state: 'visible', timeout: 5000 });
  }
}

/**
 * Login Page Object Model
 */
export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() {
    return this.page.getByLabel(/email/i);
  }

  get passwordInput() {
    return this.page.getByLabel(/password|kata sandi/i);
  }

  get loginButton() {
    return this.page.getByRole('button', { name: /sign in|masuk|login/i });
  }

  get errorMessage() {
    return this.page.getByText(/invalid|salah|gagal/i);
  }

  // Actions
  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    
    // Wait a bit for navigation to start
    await this.page.waitForTimeout(1000);
    
    // Wait for navigation with multiple fallbacks
    await Promise.race([
      this.page.waitForURL(/dashboard/, { timeout: 20000 }).catch(() => {}),
      this.page.waitForURL(/home/, { timeout: 20000 }).catch(() => {}),
      this.page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {})
    ]);
    
    // Verify we're not still on login page
    const currentURL = this.page.url();
    if (currentURL.includes('/login')) {
      // Check if there's an error message
      const errorVisible = await this.page.locator('[role="alert"], [class*="error"]')
        .isVisible({ timeout: 2000 }).catch(() => false);
      
      if (errorVisible) {
        const errorText = await this.page.locator('[role="alert"], [class*="error"]').first().textContent();
        throw new Error(`Login failed with error: ${errorText}`);
      }
      
      throw new Error(`Login failed - still on login page: ${currentURL}`);
    }
  }
}
