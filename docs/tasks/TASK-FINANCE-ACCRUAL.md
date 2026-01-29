# Task: Transition Student Finance to Accrual Basis

## Context
Currently, the Student Finance module operates on a **Cash Basis** (or Modified Cash Basis) for revenue recognition.
*   **Invoice Creation**: No Journal Entry is created.
*   **Payment Creation**: Credits Revenue directly (Debit Cash/Bank, Credit Revenue).

This approach fails to track **Accounts Receivable (Piutang Santri)**, which is crucial for a school to know how much tuition is outstanding in the financial statements.

## Objective
Transition to **Accrual Basis** for Student Finance.
1.  **Invoice Creation**: Recognize Revenue and Receivable immediately.
    *   Debit: Accounts Receivable (Piutang Santri)
    *   Credit: Revenue (Pendapatan SPP/etc)
2.  **Payment Creation**: Recognize Cash receipt and reduce Receivable.
    *   Debit: Cash / Bank
    *   Credit: Accounts Receivable (Piutang Santri)

## Scope of Work

### 1. Configuration
*   Add `ACCOUNT_MAPPING_ACCOUNTS_RECEIVABLE` to `accounting-config.service.ts`.
*   Update Frontend Settings UI to allow users to map this account (default: '1103' - Piutang Santri).

### 2. Backend Logic (`apps/api/src/modules/finance/service.ts`)
*   **Refactor `createInvoice`**:
    *   Lookup `ACCOUNTS_RECEIVABLE` account.
    *   Lookup `REVENUE` account (from `PaymentType.accountId`).
    *   Create Journal Entry:
        *   Dr: AR
        *   Cr: Revenue
*   **Refactor `createPayment`**:
    *   Lookup `ACCOUNTS_RECEIVABLE` account.
    *   Lookup `CASH` or `BANK` account (existing logic).
    *   Create Journal Entry:
        *   Dr: Cash/Bank
        *   Cr: AR (instead of Revenue)

### 3. Verification
*   Verify that `JournalEntry` records are created correctly for both events.
*   Verify that the Balance Sheet reflects the AR balance increasing on Invoice and decreasing on Payment.

## Notes
*   Existing data (old invoices/payments) will remain as is (Cash Basis) unless a migration script is run. For this task, we focus on new transactions.
*   If an Invoice is deleted/cancelled, we should ideally reverse the journal. (Out of scope for this specific task, but good to note).
