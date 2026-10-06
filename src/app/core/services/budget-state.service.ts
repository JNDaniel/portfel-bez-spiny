import { Injectable, computed, inject, signal } from '@angular/core';

import {
  classificationAfterFolderAssign,
  classificationBreakdown,
  compareWithPreviousMonth,
  cumulativeSeries,
  effectiveLimitMinor,
  summarizeMonth,
} from '../domain/budget-summary';
import { formatMinorAmount } from '../domain/money';
import {
  formatExpenseDateLabel,
  periodLabel,
  periodOf,
  shiftPeriod,
  toIsoDate,
} from '../domain/period';
import {
  Expense,
  ExpenseCategory,
  ExpenseClassification,
  ExpenseFolder,
  ExpenseTag,
  MonthlyBudget,
  Period,
} from '../models/finance.model';
import { BankPushNotification, SubscriptionItem } from '../models/demo.model';
import { ExpenseFolderRepository } from '../repositories/expense-folder.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { MonthlyBudgetRepository } from '../repositories/monthly-budget.repository';
import { ClockService } from './clock.service';
import { HapticsService } from './haptics.service';
import { NotificationService } from './notification.service';

export type ExpenseView = Expense & {
  folder: ExpenseFolder | null;
  dateLabel: string;
  amountLabel: string;
  isExpanded: boolean;
};

export interface AddExpenseInput {
  title: string;
  amountMinor: number;
  category: ExpenseCategory;
  classification: ExpenseClassification;
  note?: string;
  tags: ExpenseTag[];
  receiptFileName?: string;
  aiComment?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BudgetStateService {
  private readonly expenseRepo = inject(ExpenseRepository);
  private readonly budgetRepo = inject(MonthlyBudgetRepository);
  private readonly folderRepo = inject(ExpenseFolderRepository);
  private readonly clock = inject(ClockService);
  private readonly haptics = inject(HapticsService);
  private readonly notification = inject(NotificationService);

  private readonly expenses = signal<Expense[]>([]);
  private readonly budgets = signal<MonthlyBudget[]>([]);
  private readonly folderList = signal<ExpenseFolder[]>([]);

  public readonly loaded = signal<boolean>(false);
  public readonly currentPeriod = signal<Period>(periodOf(this.clock.now()));

  // Selected Folder Filter (null = All)
  public readonly selectedFolderId = signal<string | null>(null);

  // Selection Mode (Long-press / Multi-select)
  public readonly isSelectionMode = signal<boolean>(false);
  public readonly selectedTxIds = signal<string[]>([]);

  // UI-only: never persisted
  public readonly expandedIds = signal<string[]>([]);

  // UI Modals
  public readonly isAiSummaryOpen = signal<boolean>(false);
  public readonly isAddModalOpen = signal<boolean>(false);
  public readonly isLimitModalOpen = signal<boolean>(false);
  public readonly isCreateFolderModalOpen = signal<boolean>(false);
  public readonly isScannerModalOpen = signal<boolean>(false);
  public readonly isVoiceModalOpen = signal<boolean>(false);
  public readonly isSubscriptionsOpen = signal<boolean>(false);
  public readonly isWasteRadarOpen = signal<boolean>(false);
  public readonly showAllTransactions = signal<boolean>(false);

  // Bank Notification Simulator
  public readonly activeBankNotification = signal<BankPushNotification | null>(null);

  public readonly currentMonthLabel = computed(() => periodLabel(this.currentPeriod()));

  public readonly canGoNext = computed(() => this.currentPeriod() < periodOf(this.clock.now()));

  public readonly folders = computed(() => this.folderList());

  public readonly limitMinor = computed(() =>
    effectiveLimitMinor(this.budgets(), this.currentPeriod()),
  );

  public readonly summary = computed(() =>
    summarizeMonth({
      expenses: this.expenses(),
      period: this.currentPeriod(),
      limitMinor: this.limitMinor(),
      today: this.clock.now(),
    }),
  );

  public readonly breakdown = computed(() => classificationBreakdown(this.summary()));

  public readonly trend = computed(() =>
    cumulativeSeries(this.expenses(), this.currentPeriod(), this.clock.now()),
  );

  public readonly vsPreviousMonth = computed(() =>
    compareWithPreviousMonth(this.expenses(), this.currentPeriod(), this.clock.now()),
  );

  // Hero numbers: whole zloty or null
  public readonly percentageUsed = computed(() => this.summary().percentUsed);

  public readonly safeToSpendDaily = computed(() => {
    const minor = this.summary().safeToSpendDailyMinor;
    return minor === null ? null : Math.round(minor / 100);
  });

  public readonly spentAmount = computed(() => Math.round(this.summary().inLimitMinor / 100));

  public readonly occasionalAmount = computed(() =>
    Math.round(this.summary().occasionalMinor / 100),
  );

  public readonly limitAmount = computed(() => {
    const minor = this.limitMinor();
    return minor === null ? null : Math.round(minor / 100);
  });

  public readonly remainingAmount = computed(() => {
    const minor = this.summary().remainingMinor;
    return minor === null ? null : Math.round(minor / 100);
  });

  public readonly monthExpenses = computed<ExpenseView[]>(() => {
    const period = this.currentPeriod();
    const now = this.clock.now();
    const folders = this.folderList();
    const expanded = this.expandedIds();
    return this.expenses()
      .filter((expense) => periodOf(expense.spentOn) === period)
      .sort((a, b) => b.spentOn.localeCompare(a.spentOn) || b.createdAt.localeCompare(a.createdAt))
      .map((expense) => ({
        ...expense,
        folder: folders.find((folder) => folder.id === expense.folderId) ?? null,
        dateLabel: formatExpenseDateLabel(expense, now),
        amountLabel: formatMinorAmount(expense.amountMinor),
        isExpanded: expanded.includes(expense.id),
      }));
  });

  // Filtered transactions by active folder
  public readonly filteredTransactions = computed(() => {
    const all = this.monthExpenses();
    const folderId = this.selectedFolderId();
    if (!folderId) return all;
    return all.filter((expense) => expense.folderId === folderId);
  });

  public readonly activeFolder = computed(() => {
    const id = this.selectedFolderId();
    if (!id) return null;
    return this.folderList().find((folder) => folder.id === id) || null;
  });

  public readonly activeFolderTotal = computed(() =>
    this.filteredTransactions().reduce((acc, expense) => acc + expense.amountMinor, 0),
  );

  public readonly visibleTransactions = computed(() => {
    const list = this.filteredTransactions();
    if (this.showAllTransactions() || this.selectedFolderId()) {
      return list;
    }
    return list.slice(0, 5);
  });

  public readonly wasteStats = computed(() => {
    const items = this.monthExpenses().filter((expense) => expense.classification === 'want');
    const totalMinor = items.reduce((acc, expense) => acc + expense.amountMinor, 0);
    const inLimitMinor = this.summary().inLimitMinor;
    return {
      items,
      totalMinor,
      percentageOfSpend: inLimitMinor > 0 ? Math.round((totalMinor * 100) / inLimitMinor) : 0,
      potentialAnnualSavings: Math.round((totalMinor * 0.5 * 12) / 100),
    };
  });

  public readonly subscriptions = computed<SubscriptionItem[]>(() => {
    const currentDay = this.clock.now().getDate();
    return this.monthExpenses()
      .filter((expense) => expense.tags.includes('Cykliczne'))
      .map((expense) => {
        const day = expense.title.includes('Czynsz')
          ? 10
          : expense.title.includes('Netflix')
            ? 11
            : expense.title.includes('PGE')
              ? 2
              : 15;
        const daysUntil = day >= currentDay ? day - currentDay : 31 - currentDay + day;

        let emoji = '💳';
        if (expense.category === 'Mieszkanie') emoji = '🏠';
        if (expense.category === 'Rozrywka') emoji = '🍿';
        if (expense.category === 'Media') emoji = '⚡';

        return {
          id: expense.id,
          name: expense.title,
          amountMinor: expense.amountMinor,
          billingDay: day,
          category: expense.category,
          frequency: 'monthly' as const,
          daysUntilBilling: daysUntil,
          iconEmoji: emoji,
        };
      })
      .sort((a, b) => a.daysUntilBilling - b.daysUntilBilling);
  });

  public readonly totalRecurringMonthly = computed(() =>
    Math.round(this.subscriptions().reduce((acc, s) => acc + s.amountMinor, 0) / 100),
  );

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    try {
      const [expenses, budgets, folders] = await Promise.all([
        this.expenseRepo.list(),
        this.budgetRepo.list(),
        this.folderRepo.list(),
      ]);
      this.expenses.set(expenses);
      this.budgets.set(budgets);
      this.folderList.set(folders);
    } catch (err) {
      this.reportError(err);
    } finally {
      this.loaded.set(true);
    }
  }

  private reportError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    this.notification.error('Nie udało się zapisać zmian', message);
  }

  private async run(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (err) {
      this.reportError(err);
      await this.reload();
    }
  }

  async previousMonth() {
    await this.haptics.impact('light');
    this.currentPeriod.update((period) => shiftPeriod(period, -1));
    this.selectedFolderId.set(null);
  }

  async nextMonth() {
    await this.haptics.impact('light');
    if (!this.canGoNext()) return;
    this.currentPeriod.update((period) => shiftPeriod(period, 1));
    this.selectedFolderId.set(null);
  }

  // FOLDERS MANAGEMENT
  async selectFolder(folderId: string | null) {
    await this.haptics.impact('light');
    this.selectedFolderId.set(folderId);
  }

  async createFolder(name: string, emoji: string, color: string, assignIds: string[] = []) {
    await this.haptics.impact('medium');
    await this.run(async () => {
      const folder = await this.folderRepo.create({ name, emoji, color });
      this.folderList.update((list) => [...list, folder]);
      if (assignIds.length > 0) {
        await this.applyFolder(assignIds, folder.id);
      }
      this.clearSelection();
      this.selectedFolderId.set(folder.id);
      this.isCreateFolderModalOpen.set(false);
    });
  }

  async assignToFolder(ids: string[], folderId: string | null) {
    await this.haptics.impact('medium');
    await this.run(async () => {
      await this.applyFolder(ids, folderId);
      this.clearSelection();
    });
  }

  private async applyFolder(ids: string[], folderId: string | null) {
    const updates = ids
      .map((id) => this.expenses().find((expense) => expense.id === id))
      .filter((expense): expense is Expense => !!expense)
      .map((expense) =>
        this.expenseRepo.update(expense.id, {
          folderId,
          classification: classificationAfterFolderAssign(expense.classification, folderId),
        }),
      );
    const updated = await Promise.all(updates);
    this.replaceExpenses(updated);
  }

  private replaceExpenses(updated: Expense[]) {
    this.expenses.update((list) =>
      list.map((expense) => updated.find((u) => u.id === expense.id) ?? expense),
    );
  }

  async deleteFolder(folderId: string) {
    await this.haptics.impact('heavy');
    await this.run(async () => {
      await this.folderRepo.delete(folderId);
      this.folderList.update((list) => list.filter((folder) => folder.id !== folderId));
      this.expenses.set(await this.expenseRepo.list());
      if (this.selectedFolderId() === folderId) {
        this.selectedFolderId.set(null);
      }
    });
  }

  // MULTI-SELECTION & GESTURES
  toggleSelectTx(id: string) {
    void this.haptics.impact('light');
    this.selectedTxIds.update((current) => {
      const exists = current.includes(id);
      const updated = exists ? current.filter((i) => i !== id) : [...current, id];
      this.isSelectionMode.set(updated.length > 0);
      return updated;
    });
  }

  enableSelectionMode(initialTxId?: string) {
    void this.haptics.impact('medium');
    this.isSelectionMode.set(true);
    if (initialTxId) {
      this.selectedTxIds.set([initialTxId]);
    }
  }

  clearSelection() {
    this.selectedTxIds.set([]);
    this.isSelectionMode.set(false);
  }

  async deleteTransaction(id: string) {
    await this.haptics.impact('heavy');
    await this.run(async () => {
      await this.expenseRepo.delete([id]);
      this.expenses.update((list) => list.filter((expense) => expense.id !== id));
    });
  }

  async bulkDeleteSelected() {
    const ids = this.selectedTxIds();
    if (ids.length === 0) return;

    await this.haptics.impact('heavy');
    await this.run(async () => {
      await this.expenseRepo.delete(ids);
      this.expenses.update((list) => list.filter((expense) => !ids.includes(expense.id)));
      this.clearSelection();
    });
  }

  // Simulator for bank push notifications
  triggerSampleBankNotification() {
    const samples: BankPushNotification[] = [
      {
        id: 'push-1',
        bankName: 'mBank',
        merchant: 'Biedronka',
        amountMinor: 6420,
        time: 'Przed chwilą',
        suggestedCategory: 'Jedzenie',
        suggestedClassification: 'everyday',
        suggestedTags: ['Spożywcze'],
        rawText: 'Płatność kartą: 64,20 zł w Biedronka Warszawa',
      },
      {
        id: 'push-2',
        bankName: 'Revolut',
        merchant: 'Uber Eats',
        amountMinor: 4850,
        time: '1 min temu',
        suggestedCategory: 'Jedzenie',
        suggestedClassification: 'want',
        suggestedTags: [],
        rawText: 'Płatność Revolut: 48,50 zł w Uber Eats',
      },
      {
        id: 'push-3',
        bankName: 'PKO BP',
        merchant: 'Stacja BP',
        amountMinor: 21000,
        time: '3 min temu',
        suggestedCategory: 'Transport',
        suggestedClassification: 'everyday',
        suggestedTags: [],
        rawText: 'Transakcja IKO: 210,00 zł Stacja Paliw BP',
      },
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    this.activeBankNotification.set(pick);
    void this.haptics.impact('heavy');
  }

  async acceptBankNotification() {
    const notif = this.activeBankNotification();
    if (!notif) return;

    await this.addExpense({
      title: notif.merchant,
      amountMinor: notif.amountMinor,
      category: notif.suggestedCategory,
      classification: notif.suggestedClassification,
      note: `Automatycznie z powiadomienia ${notif.bankName}`,
      tags: notif.suggestedTags,
      aiComment: `Płatność zarejestrowana automatycznie z powiadomienia bankowego ${notif.bankName}.`,
    });

    this.activeBankNotification.set(null);
  }

  dismissBankNotification() {
    this.activeBankNotification.set(null);
  }

  async toggleTransactionExpand(id: string) {
    if (this.isSelectionMode()) {
      this.toggleSelectTx(id);
      return;
    }

    await this.haptics.impact('light');
    this.expandedIds.update((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  }

  private async patchExpense(
    id: string,
    patch: (expense: Expense) => Partial<Expense>,
  ): Promise<void> {
    const current = this.expenses().find((expense) => expense.id === id);
    if (!current) return;
    await this.run(async () => {
      const updated = await this.expenseRepo.update(id, patch(current));
      this.replaceExpenses([updated]);
    });
  }

  async updateTransactionNote(id: string, note: string) {
    await this.patchExpense(id, () => ({ note: note.trim() || undefined }));
  }

  async toggleTransactionTag(id: string, tag: ExpenseTag) {
    await this.haptics.impact('medium');
    await this.patchExpense(id, (expense) => ({
      tags: expense.tags.includes(tag)
        ? expense.tags.filter((t) => t !== tag)
        : [...expense.tags, tag],
    }));
  }

  async setClassification(id: string, classification: ExpenseClassification) {
    await this.haptics.impact('medium');
    await this.patchExpense(id, () => ({ classification }));
  }

  async attachReceiptAndGenerateAi(id: string, fileName: string) {
    await this.haptics.impact('medium');
    await this.patchExpense(id, (expense) => ({
      receiptFileName: fileName,
      aiComment: this.generateSmartAiComment(
        expense.title,
        expense.category,
        formatMinorAmount(expense.amountMinor),
      ),
    }));
  }

  private generateSmartAiComment(title: string, category: ExpenseCategory, amount: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('biedronka') || lower.includes('lidl') || lower.includes('auchan')) {
      return `Rozpoznano paragon z ${title} (${amount} zł). Zakup w dyskoncie — oszczędność ~15% względem sklepów convenience.`;
    }
    if (lower.includes('orlen') || lower.includes('bp') || lower.includes('shell')) {
      return `Faktura paliwowa ${amount} zł. Średnia cena za litr w normie rynkowej dla województwa mazowieckiego.`;
    }
    if (lower.includes('żabka')) {
      return `Impulsowy zakup w Żabce (${amount} zł). W skali miesiąca zakupy tego typu generują ~94 zł niepotrzebnego drenażu.`;
    }
    if (lower.includes('apteka')) {
      return `Apteka: zakup leków / suplementów (${amount} zł). Wydatek sklasyfikowany jako niezbędny zdrowotny.`;
    }
    return `AI przeanalizowało załączony dokument dla ${title} (${amount} zł). Wydatek mieści się w przewidywanym budżecie kategorii ${category}.`;
  }

  async addExpense(input: AddExpenseInput) {
    await this.haptics.impact('medium');
    const now = this.clock.now();
    await this.run(async () => {
      const created = await this.expenseRepo.create({
        ...input,
        currency: 'PLN',
        spentOn: toIsoDate(now),
        createdAt: now.toISOString(),
        folderId: null,
      });
      this.expenses.update((list) => [...list, created]);
      this.currentPeriod.set(periodOf(now));
      this.isAddModalOpen.set(false);
    });
  }

  async setMonthlyLimit(limitMinor: number) {
    await this.haptics.impact('medium');
    await this.run(async () => {
      const record = await this.budgetRepo.setLimit(this.currentPeriod(), limitMinor);
      this.budgets.update((list) => [
        ...list.filter((budget) => budget.effectiveFrom !== record.effectiveFrom),
        record,
      ]);
      this.isLimitModalOpen.set(false);
    });
  }

  async toggleAiSummary() {
    await this.haptics.impact('light');
    this.isAiSummaryOpen.update((v) => !v);
  }

  async toggleShowAll() {
    await this.haptics.impact('light');
    this.showAllTransactions.update((v) => !v);
  }
}
