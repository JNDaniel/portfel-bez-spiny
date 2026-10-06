import { ExpenseCategory, ExpenseClassification, ExpenseTag } from './finance.model';

export interface BankPushNotification {
  id: string;
  bankName: 'mBank' | 'Revolut' | 'PKO BP' | 'Santander' | 'ING';
  merchant: string;
  amountMinor: number;
  time: string;
  suggestedCategory: ExpenseCategory;
  suggestedClassification: ExpenseClassification;
  suggestedTags: ExpenseTag[];
  rawText: string;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  amountMinor: number;
  billingDay: number;
  category: ExpenseCategory;
  frequency: 'monthly' | 'yearly';
  daysUntilBilling: number;
  iconEmoji: string;
}

export interface AiSummary {
  biggestExpense: string;
  potentialWaste: string;
  goodNews: string;
  recommendation: string;
}
