import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  BalanceSheetReport,
  IncomeExpenseReport,
  TrialBalanceReport,
  GeneralLedgerReport,
  CashFlowReport
} from "@cipansor/shared";

export function useBalanceSheet(unitId: string, date: Date) {
  return useQuery({
    queryKey: ['balance-sheet', unitId, date],
    queryFn: async () => {
      const { data } = await api.get<{ data: BalanceSheetReport }>(
        `/finance-enhancement/reports/balance-sheet`,
        { params: { unitId, date: date.toISOString() } }
      );
      return data.data;
    },
    enabled: !!unitId,
  });
}

export function useIncomeStatement(unitId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['income-statement', unitId, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get<{ data: IncomeExpenseReport }>(
        `/finance-enhancement/reports/income-statement`,
        { params: { unitId, startDate: startDate.toISOString(), endDate: endDate.toISOString() } }
      );
      return data.data;
    },
    enabled: !!unitId,
  });
}

export function useTrialBalance(unitId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['trial-balance', unitId, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get<{ data: TrialBalanceReport }>(
        `/finance-enhancement/reports/trial-balance`,
        { params: { unitId, startDate: startDate.toISOString(), endDate: endDate.toISOString() } }
      );
      return data.data;
    },
    enabled: !!unitId,
  });
}

export function useGeneralLedger(unitId: string, accountId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['general-ledger', unitId, accountId, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get<{ data: GeneralLedgerReport }>(
        `/finance-enhancement/reports/general-ledger`,
        { params: { unitId, accountId, startDate: startDate.toISOString(), endDate: endDate.toISOString() } }
      );
      return data.data;
    },
    enabled: !!unitId && !!accountId,
  });
}

export function useCashFlowStatement(unitId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['cash-flow', unitId, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get<{ data: CashFlowReport }>(
        `/finance-enhancement/reports/cash-flow`,
        { params: { unitId, startDate: startDate.toISOString(), endDate: endDate.toISOString() } }
      );
      return data.data;
    },
    enabled: !!unitId,
  });
}
