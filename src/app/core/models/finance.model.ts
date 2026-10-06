export type Period = string; // 'YYYY-MM'
export type IsoDate = string; // 'YYYY-MM-DD' (local calendar date)
export type CurrencyCode = 'PLN';

export const EXPENSE_CLASSIFICATIONS = ['everyday', 'want', 'occasional'] as const;
export type ExpenseClassification = (typeof EXPENSE_CLASSIFICATIONS)[number];

export const EXPENSE_CATEGORIES = [
  'Mieszkanie',
  'Jedzenie',
  'Transport',
  'Zakupy',
  'Zdrowie',
  'Rozrywka',
  'Media',
  'Inne',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_TAGS = ['Cykliczne', 'Służbowe', 'Spożywcze'] as const;
export type ExpenseTag = (typeof EXPENSE_TAGS)[number];

export interface Expense {
  id: string;
  title: string;
  amountMinor: number; // integer grosze, > 0
  currency: CurrencyCode;
  classification: ExpenseClassification;
  category: ExpenseCategory;
  spentOn: IsoDate;
  createdAt: string; // ISO timestamp, source of the displayed time
  note?: string;
  tags: ExpenseTag[];
  folderId: string | null;
  receiptFileName?: string; // demo only
  aiComment?: string; // demo only
}
export type NewExpense = Omit<Expense, 'id'>;
export type ExpensePatch = Partial<
  Pick<
    Expense,
    | 'title'
    | 'amountMinor'
    | 'classification'
    | 'category'
    | 'note'
    | 'tags'
    | 'folderId'
    | 'receiptFileName'
    | 'aiComment'
  >
>;

export interface MonthlyBudget {
  id: string;
  effectiveFrom: Period; // limit applies from this month until a later record
  limitMinor: number; // integer grosze, > 0
  currency: CurrencyCode;
}

export interface ExpenseFolder {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
}
export type NewExpenseFolder = Omit<ExpenseFolder, 'id' | 'createdAt'>;
