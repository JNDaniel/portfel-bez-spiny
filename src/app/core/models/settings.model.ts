export type SupportedCurrency = "USD" | "EUR" | "PLN" | "GBP";

export interface AppSettings {
  currency: SupportedCurrency;
  currencySymbol: string;
  overallMonthlyBudget: number;
  companyName: string;
  fiscalYearStartMonth: number;
  isMockBackend: boolean;
  apiUrl: string;
  simulateNetworkLatencyMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  currency: "EUR",
  currencySymbol: "€",
  overallMonthlyBudget: 45000,
  companyName: "Acme Technologies Inc.",
  fiscalYearStartMonth: 1,
  isMockBackend: true,
  apiUrl: "https://api.costflow.internal/v1",
  simulateNetworkLatencyMs: 300
};

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: "$",
  EUR: "€",
  PLN: "zł",
  GBP: "£"
};
