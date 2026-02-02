export interface CreateManualJournalInput {
  unitId: string;
  date: Date;
  description: string;
  entries: {
    accountId: string;
    debit: number;
    credit: number;
  }[];
}

export type TrialBalanceItem = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  startBalance: number;
  debit: number;
  credit: number;
  endBalance: number;
};
