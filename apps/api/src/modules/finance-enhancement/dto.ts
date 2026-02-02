export interface CreateManualJournalInput {
  unitId: string;
  date: string | Date;
  description: string;
  entries: {
    accountId: string;
    debit: number;
    credit: number;
  }[];
}
