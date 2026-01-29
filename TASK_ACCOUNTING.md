# Task: Development of Accounting Management Module

## Overview
This task involves the comprehensive development and enhancement of the Accounting Management module in the Cipansor ERP system. The goal is to ensure compliance with accounting standards (specifically ISAK 35 for non-profits/pesantren), improve system integrity (period locking), and enhance user experience.

## Objectives
1.  **Standardization:** Implement ISAK 35 standards for financial reporting (Net Assets classification).
2.  **Integrity:** Prevent data modification in closed accounting periods.
3.  **Consolidation:** Unify overlapping logic between `finance` and `finance-enhancement` modules.
4.  **Usability:** Complete the frontend integration for Reports, Settings, and Journal Management.

## Detailed Plan

### Phase 1: Backend Standardization & Integrity
- [ ] **Chart of Accounts (COA) Seeding:**
    - Create a comprehensive seeder for Pesantren context (ISAK 35).
    - Include accounts for *Aset Neto Tidak Terikat*, *Aset Neto Terikat Temporer*, and *Aset Neto Terikat Permanen*.
    - Include Zakat, Infaq, Shodaqoh, and Wakaf specific accounts.
- [ ] **Period Management:**
    - Ensure `FinancialPeriod` model is fully utilized.
    - Implement `checkPeriodLock` utility function.
    - Apply `checkPeriodLock` to `createJournalEntry`, `updateJournalEntry`, and `deleteJournalEntry`.
- [ ] **Reporting Engine:**
    - Refine `BalanceSheet` to categorize Equity according to ISAK 35.
    - Refine `CashFlow` to better categorize Operating/Investing/Financing activities based on `cashFlowCategory`.

### Phase 2: Frontend Implementation
- [ ] **Settings Module:**
    - Enhance `AccountingSettingsTab` to include "Period Management" (Open/Close periods).
    - Ensure Account Mapping covers all necessary automatic journals (Tuition, Inventory, Payroll).
- [ ] **Reporting UI:**
    - Verify `BalanceSheet`, `IncomeStatement`, and `CashFlow` rendering.
    - Add "Export to PDF/Excel" functionality (using `jspdf` or server-side generation).
- [ ] **Journal Management:**
    - Enhance `JournalEntriesTab` to allow filtering by Date Range and Account.
    - Add visual indicator for "Closed Period" entries (read-only).

### Phase 3: Integration & Testing
- [ ] **End-to-End Verification:**
    - Verify `Payment` (Tuition) creates correct `JournalEntry`.
    - Verify `Inventory` (Purchase) creates correct `JournalEntry`.
    - Verify `Payroll` (Salary Payment) creates correct `JournalEntry`.
- [ ] **Automated Tests:**
    - Add unit tests for `PeriodLock` logic.
    - Add integration tests for Report generation.

## Reference
- **ISAK 35:** Interpretation of Financial Accounting Standards for Non-Profit Entities.
- **Prisma Schema:** `JournalEntry`, `AccountCode`, `FinancialPeriod`.
