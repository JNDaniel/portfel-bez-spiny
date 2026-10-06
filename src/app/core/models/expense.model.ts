export type ExpenseCategory =
  | 'Cloud & Infrastructure'
  | 'Software & SaaS'
  | 'Salaries & Contractors'
  | 'Marketing & Ads'
  | 'Office & Facilities'
  | 'Travel & Events'
  | 'Legal & Compliance'
  | 'Equipment & Hardware'
  | 'Other';

export type PaymentMethod = 'Corporate Card' | 'Bank Transfer' | 'PayPal' | 'Direct Debit' | 'Cash';

export type ExpenseStatus = 'cleared' | 'pending' | 'recurring';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string; // ISO format: YYYY-MM-DD
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  vendor: string;
  description?: string;
  department?: string;
  tags: string[];
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateExpenseDto = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExpenseDto = Partial<CreateExpenseDto>;

export interface ExpenseFilter {
  search?: string;
  category?: ExpenseCategory | 'ALL';
  status?: ExpenseStatus | 'ALL';
  paymentMethod?: PaymentMethod | 'ALL';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  department?: string | 'ALL';
  sortBy?: 'date' | 'amount' | 'title' | 'vendor' | 'category';
  sortDirection?: 'asc' | 'desc';
}

export interface ExpenseCategoryMeta {
  name: ExpenseCategory;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const CATEGORY_META: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  'Cloud & Infrastructure': {
    name: 'Cloud & Infrastructure',
    color: '#0284c7',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
    borderColor: 'border-sky-200 dark:border-sky-800',
    icon: 'cloud',
  },
  'Software & SaaS': {
    name: 'Software & SaaS',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
    icon: 'app-window',
  },
  'Salaries & Contractors': {
    name: 'Salaries & Contractors',
    color: '#10b981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    icon: 'users',
  },
  'Marketing & Ads': {
    name: 'Marketing & Ads',
    color: '#f59e0b',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: 'megaphone',
  },
  'Office & Facilities': {
    name: 'Office & Facilities',
    color: '#6366f1',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    icon: 'building',
  },
  'Travel & Events': {
    name: 'Travel & Events',
    color: '#ec4899',
    bgColor: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300',
    borderColor: 'border-pink-200 dark:border-pink-800',
    icon: 'plane',
  },
  'Legal & Compliance': {
    name: 'Legal & Compliance',
    color: '#64748b',
    bgColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-700',
    icon: 'shield-check',
  },
  'Equipment & Hardware': {
    name: 'Equipment & Hardware',
    color: '#14b8a6',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
    borderColor: 'border-teal-200 dark:border-teal-800',
    icon: 'laptop',
  },
  Other: {
    name: 'Other',
    color: '#94a3b8',
    bgColor: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: 'tag',
  },
};
