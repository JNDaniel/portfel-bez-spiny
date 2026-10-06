export type TransactionCategory =
  'Mieszkanie' | 'Jedzenie' | 'Transport' | 'Zakupy' | 'Zdrowie' | 'Rozrywka' | 'Media' | 'Inne';

export type TransactionTag =
  'Potrzebne' | 'Zachcianka' | 'Cykliczne' | 'Zbędne' | 'Służbowe' | 'Spożywcze';

export interface TransactionFolder {
  id: string;
  name: string;
  emoji: string;
  color: string;
  targetBudget?: number;
}

export interface Transaction {
  id: string;
  title: string;
  category: TransactionCategory;
  amount: number;
  date: string; // e.g. "Dziś, 14:32", "Wczoraj, 18:15", "10 lip, 11:20"
  isoDate: string; // YYYY-MM-DD
  note?: string; // e.g. "Przelew do 10-go"
  tags: TransactionTag[];
  receiptFileName?: string;
  aiComment?: string;
  isExpanded?: boolean;
  folderId?: string; // ID folderu np. wycieczki
  folderName?: string; // np. "Wycieczka Japonia"
}

export interface CategoryBreakdown {
  name: TransactionCategory;
  amount: number;
  percentage: number;
  color: string;
  barColorClass: string;
}

export interface BankPushNotification {
  id: string;
  bankName: 'mBank' | 'Revolut' | 'PKO BP' | 'Santander' | 'ING';
  merchant: string;
  amount: number;
  time: string;
  suggestedCategory: TransactionCategory;
  suggestedTags: TransactionTag[];
  rawText: string;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  billingDay: number;
  category: TransactionCategory;
  frequency: 'monthly' | 'yearly';
  daysUntilBilling: number;
  iconEmoji: string;
}

export interface MonthData {
  periodKey: string;
  label: string;
  daysInMonth: number;
  currentDay: number;
  limit: number;
  spent: number;
  vsPreviousMonthPercent: number;
  vsPreviousMonthDirection: 'more' | 'less';
  chartPoints: { day: string; amount: number }[];
  transactions: Transaction[];
  folders: TransactionFolder[];
  aiSummary: {
    biggestExpense: string;
    potentialWaste: string;
    goodNews: string;
    recommendation: string;
  };
}

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  Mieszkanie: 'home-outline',
  Jedzenie: 'cafe-outline',
  Transport: 'car-outline',
  Zakupy: 'bag-handle-outline',
  Zdrowie: 'heart-outline',
  Rozrywka: 'musical-notes-outline',
  Media: 'flash-outline',
  Inne: 'ellipsis-horizontal-outline',
};

export const CATEGORY_COLORS: Record<TransactionCategory, { hex: string; barClass: string }> = {
  Mieszkanie: { hex: '#10b981', barClass: 'bg-emerald-500' },
  Jedzenie: { hex: '#3b82f6', barClass: 'bg-blue-500' },
  Transport: { hex: '#f59e0b', barClass: 'bg-amber-500' },
  Zakupy: { hex: '#a855f7', barClass: 'bg-purple-500' },
  Zdrowie: { hex: '#f43f5e', barClass: 'bg-rose-500' },
  Rozrywka: { hex: '#10b981', barClass: 'bg-emerald-400' },
  Media: { hex: '#06b6d4', barClass: 'bg-cyan-500' },
  Inne: { hex: '#94a3b8', barClass: 'bg-slate-400' },
};

export const AVAILABLE_TAGS: { name: TransactionTag; activeClass: string }[] = [
  { name: 'Potrzebne', activeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50' },
  { name: 'Zachcianka', activeClass: 'bg-amber-950/80 text-amber-400 border-amber-500/50' },
  { name: 'Cykliczne', activeClass: 'bg-blue-950/80 text-blue-400 border-blue-500/50' },
  { name: 'Zbędne', activeClass: 'bg-rose-950/80 text-rose-400 border-rose-500/50' },
  { name: 'Służbowe', activeClass: 'bg-indigo-950/80 text-indigo-400 border-indigo-500/50' },
  { name: 'Spożywcze', activeClass: 'bg-teal-950/80 text-teal-400 border-teal-500/50' },
];
