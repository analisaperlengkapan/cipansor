# Budget Management Module Enhancement Specification

## 1. Background
The "Manajemen Anggaran" (Budget Management) module is a critical component of the Finance system. It allows the institution to plan expenses (RAPB) and monitor realization against actual spending recorded in the Accounting module (Journal Entries).

Currently, a basic implementation exists (`finance-enhancement` module) supporting:
- Creating Budgets per Unit, Academic Year, and Account.
- Tracking `usedAmount` via recalculation from Journal Entries.
- Basic Frontend listing.

## 2. Problem Statement
The current implementation lacks a robust control mechanism:
- **No Approval Workflow:** Budgets are active immediately upon creation. This violates standard financial controls where budgets must be proposed (Draft) and approved by authorized personnel (Yayasan/Head).
- **No Audit Trail:** Who approved the budget and when is not tracked.
- **Limited User Feedback:** Users cannot see the status of their budget proposals.

## 3. Objectives
- Implement a standard Approval Workflow: `DRAFT` -> `PENDING_APPROVAL` -> `APPROVED` / `REJECTED`.
- Secure the approval process (Admins only).
- Enhance the UI to support this workflow.
- Ensure integration with Realization tracking remains accurate.

## 4. Technical Specifications

### 4.1 Database Schema (Prisma)
Modify `Budget` model in `schema.prisma`:

```prisma
enum BudgetStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
}

model Budget {
  // ... existing fields
  status        BudgetStatus @default(DRAFT)
  approvedById  String?      @map("approved_by_id")
  approvedAt    DateTime?    @map("approved_at")
  rejectionNote String?      @map("rejection_note")

  approvedBy    User?        @relation("BudgetApprover", fields: [approvedById], references: [id])
}
```

### 4.2 Backend API (`finance-enhancement`)
**New Endpoints:**
- `PATCH /api/finance-enhancement/budgets/:id/status`
  - Body: `{ status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED", rejectionNote?: string }`
  - Logic:
    - `APPROVED`: Sets `approvedById` (current user) and `approvedAt`.
    - `REJECTED`: Sets `rejectionNote`.
    - `PENDING_APPROVAL`: Transitions from DRAFT.

**Modifications:**
- `POST /budgets`: Ensure `status` defaults to `DRAFT`.
- `GET /budgets`: Return `status` and `approvedBy` details.

### 4.3 Frontend (`apps/web`)
**Budgeting Page (`/finance/budgeting`):**
- Display `Status` Badge (Color coded: Gray=Draft, Yellow=Pending, Green=Approved, Red=Rejected).
- **Actions:**
  - **Draft Items:** Show "Edit", "Delete", "Submit".
  - **Pending Items:** Show "Approve", "Reject" (if user has permission), "Cancel" (if owner).
  - **Approved Items:** Read-only (or Request Amendment - out of scope for now).
  - **Rejected Items:** Show "Edit" (to resubmit).

## 5. Acceptance Criteria
1.  **Creation:** Newly created budgets must have `DRAFT` status.
2.  **Submission:** User can submit a Draft budget, changing status to `PENDING_APPROVAL`.
3.  **Approval:** Admin can approve a Pending budget. Status becomes `APPROVED`.
4.  **Rejection:** Admin can reject a Pending budget with a note. Status becomes `REJECTED`.
5.  **Visibility:** The list view clearly distinguishes statuses.
6.  **Realization:** Only `APPROVED` budgets should theoretically count towards active budget limits (optional enhancement, currently we track usage regardless of status to see potential overspending).

## 6. Implementation Plan
1.  Update Schema.
2.  Generate Client.
3.  Implement Backend Service & Controller methods.
4.  Implement Frontend UI.
5.  Verify & Test.
