import { Injectable, computed, signal } from '@angular/core';
import { 
  BankPushNotification,
  CategoryBreakdown, 
  CATEGORY_COLORS, 
  MonthData, 
  SubscriptionItem,
  Transaction, 
  TransactionCategory, 
  TransactionFolder, 
  TransactionTag 
} from '../models/budget-app.model';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const INITIAL_MONTHS: MonthData[] = [
  {
    periodKey: '2025-06',
    label: 'Czerwiec 2025',
    daysInMonth: 30,
    currentDay: 30,
    limit: 6000,
    spent: 3100,
    vsPreviousMonthPercent: 2,
    vsPreviousMonthDirection: 'less',
    chartPoints: [
      { day: '1 cze', amount: 2000 },
      { day: '5 cze', amount: 350 },
      { day: '10 cze', amount: 1200 },
      { day: '15 cze', amount: 450 },
      { day: '20 cze', amount: 800 },
      { day: '25 cze', amount: 200 },
      { day: '30 cze', amount: 1100 }
    ],
    folders: [
      { id: 'f-bieszczady', name: 'Weekend Bieszczady', emoji: '🏕️', color: '#10b981' }
    ],
    transactions: [
      {
        id: 't-jun-1',
        title: 'Czynsz czerwiec',
        category: 'Mieszkanie',
        amount: 2200,
        date: '01 cze, 08:00',
        isoDate: '2025-06-01',
        note: 'Przelew do 10-go',
        tags: ['Cykliczne', 'Potrzebne']
      },
      {
        id: 't-jun-2',
        title: 'Biedronka',
        category: 'Jedzenie',
        amount: 145.20,
        date: '15 cze, 17:30',
        isoDate: '2025-06-15',
        tags: ['Potrzebne', 'Spożywcze']
      }
    ],
    aiSummary: {
      biggestExpense: 'Czynsz 2 200 zł = 44% budżetu.',
      potentialWaste: 'Brak niepokojących impulsów nocnych.',
      goodNews: 'Wydatki o 2% niższe niż w maju.',
      recommendation: 'Utrzymaj obecną dyscyplinę na jedzeniu.'
    }
  },
  {
    periodKey: '2025-07',
    label: 'Lipiec 2025',
    daysInMonth: 31,
    currentDay: 12,
    limit: 6150,
    spent: 3227,
    vsPreviousMonthPercent: 4,
    vsPreviousMonthDirection: 'more',
    chartPoints: [
      { day: '1 lip', amount: 2400 },
      { day: '3 lip', amount: 1100 },
      { day: '5 lip', amount: 420 },
      { day: '7 lip', amount: 1800 },
      { day: '9 lip', amount: 550 },
      { day: '11 lip', amount: 400 },
      { day: 'Dziś', amount: 2200 }
    ],
    folders: [
      { id: 'f-japan', name: 'Wycieczka Japonia', emoji: '🇯🇵', color: '#f43f5e' },
      { id: 'f-remont', name: 'Remont Kuchni', emoji: '🔨', color: '#f59e0b' }
    ],
    transactions: [
      {
        id: 't-1',
        title: 'Biedronka',
        category: 'Jedzenie',
        amount: 84.50,
        date: 'Dziś, 14:32',
        isoDate: '2025-07-12',
        tags: ['Potrzebne'],
        aiComment: 'Standardowe zakupy codzienne — koszyk w granicach średniej domowej (84 zł).'
      },
      {
        id: 't-2',
        title: 'Czynsz lipiec',
        category: 'Mieszkanie',
        amount: 2200.00,
        date: 'Dziś, 08:00',
        isoDate: '2025-07-12',
        note: 'Przelew do 10-go',
        tags: ['Cykliczne', 'Potrzebne']
      },
      {
        id: 't-3',
        title: 'Orlen',
        category: 'Transport',
        amount: 180.00,
        date: 'Wczoraj, 18:15',
        isoDate: '2025-07-11',
        tags: ['Potrzebne'],
        aiComment: 'Tankowałeś w godzinach szczytu. Średnia cena za litr o 4% wyższa niż poza miastem.'
      },
      {
        id: 't-4',
        title: 'Netflix',
        category: 'Rozrywka',
        amount: 49.00,
        date: 'Wczoraj, 00:00',
        isoDate: '2025-07-11',
        note: 'Plan rodzinny',
        tags: ['Zachcianka', 'Cykliczne']
      },
      {
        id: 't-5',
        title: 'Apteka Dbam o Zdrowie',
        category: 'Zdrowie',
        amount: 67.80,
        date: '10 lip, 11:20',
        isoDate: '2025-07-10',
        tags: ['Potrzebne']
      },
      {
        id: 't-6',
        title: 'Żabka nocna',
        category: 'Jedzenie',
        amount: 23.40,
        date: '09 lip, 23:15',
        isoDate: '2025-07-09',
        note: 'Przekąski',
        tags: ['Zbędne'],
        aiComment: 'Klasyczny impuls po 22:00. W skali miesiąca takie wizyty kosztują Cię ~94 zł.'
      },
      {
        id: 't-7',
        title: 'Bolt po imprezie',
        category: 'Transport',
        amount: 34.50,
        date: '06 lip, 02:40',
        isoDate: '2025-07-06',
        tags: ['Zbędne'],
        aiComment: 'Przejazd nocny taryfą dynamiczną (+35% względem standardu dziennego).'
      },
      {
        id: 't-8',
        title: 'Zara Man',
        category: 'Zakupy',
        amount: 280.00,
        date: '05 lip, 16:30',
        isoDate: '2025-07-05',
        note: 'Koszule do pracy',
        tags: ['Potrzebne', 'Służbowe']
      },
      {
        id: 't-9',
        title: 'Spotify Premium',
        category: 'Rozrywka',
        amount: 19.99,
        date: '01 lip, 00:00',
        isoDate: '2025-07-01',
        tags: ['Cykliczne']
      },
      {
        id: 't-10',
        title: 'PGE Rachunek Prąd',
        category: 'Mieszkanie',
        amount: 287.81,
        date: '02 lip, 10:00',
        isoDate: '2025-07-02',
        note: 'Prognoza czerwiec-lipiec',
        tags: ['Cykliczne', 'Potrzebne']
      }
    ],
    aiSummary: {
      biggestExpense: 'Czynsz 2 200 zł = 42% budżetu. Cel: zejść do 30% — rozważ podnajęcie pokoju lub negocjację czynszu.',
      potentialWaste: 'Żabka nocna 23,40 zł + Bolt po imprezie 34,50 zł = 57,90 zł. Łatwe do wyeliminowania impulsy nocne.',
      goodNews: 'Transport 8% poniżej limitu, zdrowie w normie. Oszczędzasz 860 zł względem budżetu — tak trzymaj!',
      recommendation: 'Zastąp 2 wizyty w Żabce zakupami w dyskoncie → ~80 zł/mies. Woda butelkowana → filtr → ~45 zł/mies. Razem 125 zł oszczędności.'
    }
  }
];

@Injectable({
  providedIn: 'root'
})
export class BudgetStateService {
  private readonly STORAGE_KEY = 'budzetapp_v2_data';
  
  private readonly _months = signal<MonthData[]>(this.loadFromStorage());
  private readonly _currentMonthIndex = signal<number>(1); // Lipiec 2025
  
  // Selected Folder Filter (null = All)
  public readonly selectedFolderId = signal<string | null>(null);

  // Selection Mode (Long-press / Multi-select)
  public readonly isSelectionMode = signal<boolean>(false);
  public readonly selectedTxIds = signal<string[]>([]);

  // UI Modals
  public readonly isAiSummaryOpen = signal<boolean>(false);
  public readonly isAddModalOpen = signal<boolean>(false);
  public readonly isCreateFolderModalOpen = signal<boolean>(false);
  public readonly isScannerModalOpen = signal<boolean>(false);
  public readonly isVoiceModalOpen = signal<boolean>(false);
  public readonly isSubscriptionsOpen = signal<boolean>(false);
  public readonly isWasteRadarOpen = signal<boolean>(false);
  public readonly showAllTransactions = signal<boolean>(false);

  // Bank Notification Simulator
  public readonly activeBankNotification = signal<BankPushNotification | null>(null);

  public readonly currentMonth = computed(() => {
    const list = this._months();
    const idx = this._currentMonthIndex();
    return list[idx] || list[0];
  });

  public readonly folders = computed(() => {
    return this.currentMonth().folders || [];
  });

  // Filtered transactions by active folder
  public readonly filteredTransactions = computed(() => {
    const all = this.currentMonth().transactions;
    const folderId = this.selectedFolderId();
    if (!folderId) return all;
    return all.filter(t => t.folderId === folderId);
  });

  public readonly activeFolder = computed(() => {
    const id = this.selectedFolderId();
    if (!id) return null;
    return this.folders().find(f => f.id === id) || null;
  });

  public readonly activeFolderTotal = computed(() => {
    return this.filteredTransactions().reduce((acc, t) => acc + t.amount, 0);
  });

  public readonly spentAmount = computed(() => {
    const txs = this.currentMonth().transactions;
    return Math.round(txs.reduce((acc, t) => acc + t.amount, 0));
  });

  public readonly limitAmount = computed(() => this.currentMonth().limit);

  public readonly remainingAmount = computed(() => {
    return this.limitAmount() - this.spentAmount();
  });

  public readonly percentageUsed = computed(() => {
    const limit = this.limitAmount();
    if (!limit || limit <= 0) return 0;
    return Math.round((this.spentAmount() / limit) * 100);
  });

  public readonly safeToSpendDaily = computed(() => {
    const m = this.currentMonth();
    const totalDays = Number(m.daysInMonth) || 31;
    const dayNow = Number(m.currentDay) || 12;
    const daysLeft = Math.max(1, totalDays - dayNow + 1);
    const rem = this.remainingAmount();
    if (rem <= 0) return 0;
    const result = Math.round(rem / daysLeft);
    return isNaN(result) ? 153 : result;
  });

  public readonly wasteStats = computed(() => {
    const txs = this.currentMonth().transactions;
    const wasteList = txs.filter(t => t.tags.includes('Zbędne') || t.tags.includes('Zachcianka'));
    const totalWaste = wasteList.reduce((acc, t) => acc + t.amount, 0);
    const percentageOfSpend = this.spentAmount() > 0 ? Math.round((totalWaste / this.spentAmount()) * 100) : 0;
    const potentialAnnualSavings = Math.round(totalWaste * 0.5 * 12);

    return {
      items: wasteList,
      totalAmount: totalWaste,
      percentageOfSpend,
      potentialAnnualSavings
    };
  });

  public readonly subscriptions = computed<SubscriptionItem[]>(() => {
    const txs = this.currentMonth().transactions.filter(t => t.tags.includes('Cykliczne'));
    const currentDay = this.currentMonth().currentDay;
    
    return txs.map(t => {
      const day = t.title.includes('Czynsz') ? 10 : (t.title.includes('Netflix') ? 11 : (t.title.includes('PGE') ? 2 : 15));
      const daysUntil = day >= currentDay ? (day - currentDay) : (31 - currentDay + day);
      
      let emoji = '💳';
      if (t.category === 'Mieszkanie') emoji = '🏠';
      if (t.category === 'Rozrywka') emoji = '🍿';
      if (t.category === 'Media') emoji = '⚡';

      return {
        id: t.id,
        name: t.title,
        amount: t.amount,
        billingDay: day,
        category: t.category,
        frequency: 'monthly' as const,
        daysUntilBilling: daysUntil,
        iconEmoji: emoji
      };
    }).sort((a, b) => a.daysUntilBilling - b.daysUntilBilling);
  });

  public readonly totalRecurringMonthly = computed(() => {
    return Math.round(this.subscriptions().reduce((acc, s) => acc + s.amount, 0));
  });

  public readonly categoriesBreakdown = computed<CategoryBreakdown[]>(() => {
    const txs = this.currentMonth().transactions;
    const total = this.spentAmount() || 1;
    
    const categories: TransactionCategory[] = [
      'Mieszkanie', 'Jedzenie', 'Transport', 'Zakupy', 'Zdrowie', 'Rozrywka', 'Media'
    ];

    return categories.map(cat => {
      const sum = txs.filter(t => t.category === cat).reduce((acc, t) => acc + t.amount, 0);
      const pct = Math.round((sum / total) * 100);
      const meta = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Inne'];
      return {
        name: cat,
        amount: Math.round(sum),
        percentage: pct,
        color: meta.hex,
        barColorClass: meta.barClass
      };
    });
  });

  public readonly visibleTransactions = computed(() => {
    const list = this.filteredTransactions();
    if (this.showAllTransactions() || this.selectedFolderId()) {
      return list;
    }
    return list.slice(0, 5);
  });

  constructor() {}

  private loadFromStorage(): MonthData[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed: MonthData[] = JSON.parse(saved);
        return parsed.map(m => ({
          ...m,
          daysInMonth: m.daysInMonth || 31,
          currentDay: m.currentDay || 12,
          folders: m.folders || []
        }));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return INITIAL_MONTHS;
  }

  private persist() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._months()));
    } catch (e) {
      console.warn('Save error:', e);
    }
  }

  async previousMonth() {
    await Haptics.impact({ style: ImpactStyle.Light });
    if (this._currentMonthIndex() > 0) {
      this._currentMonthIndex.update(i => i - 1);
      this.selectedFolderId.set(null);
    }
  }

  async nextMonth() {
    await Haptics.impact({ style: ImpactStyle.Light });
    if (this._currentMonthIndex() < this._months().length - 1) {
      this._currentMonthIndex.update(i => i + 1);
      this.selectedFolderId.set(null);
    }
  }

  // FOLDERS MANAGEMENT
  async selectFolder(folderId: string | null) {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.selectedFolderId.set(folderId);
  }

  async createFolder(name: string, emoji: string, color: string, txIdsToAssign: string[] = []) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    const id = 'f-' + Math.random().toString(36).substring(2, 9);
    const newFolder: TransactionFolder = { id, name, emoji, color };
    const idx = this._currentMonthIndex();

    this._months.update(months => {
      const copy = [...months];
      const m = { ...copy[idx] };
      m.folders = [...(m.folders || []), newFolder];

      if (txIdsToAssign.length > 0) {
        m.transactions = m.transactions.map(t => {
          if (txIdsToAssign.includes(t.id)) {
            return { ...t, folderId: id, folderName: name };
          }
          return t;
        });
      }
      copy[idx] = m;
      return copy;
    });

    this.persist();
    this.clearSelection();
    this.selectedFolderId.set(id);
    this.isCreateFolderModalOpen.set(false);
  }

  async assignSelectedToFolder(folderId: string) {
    const folder = this.folders().find(f => f.id === folderId);
    if (!folder) return;

    await Haptics.impact({ style: ImpactStyle.Medium });
    const txIds = this.selectedTxIds();
    const idx = this._currentMonthIndex();

    this._months.update(months => {
      const copy = [...months];
      const m = { ...copy[idx] };
      m.transactions = m.transactions.map(t => {
        if (txIds.includes(t.id)) {
          return { ...t, folderId, folderName: folder.name };
        }
        return t;
      });
      copy[idx] = m;
      return copy;
    });

    this.persist();
    this.clearSelection();
  }

  async deleteFolder(folderId: string) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    const idx = this._currentMonthIndex();

    this._months.update(months => {
      const copy = [...months];
      const m = { ...copy[idx] };
      m.folders = (m.folders || []).filter(f => f.id !== folderId);
      m.transactions = m.transactions.map(t => {
        if (t.folderId === folderId) {
          const { folderId: _, folderName: __, ...rest } = t;
          return rest as Transaction;
        }
        return t;
      });
      copy[idx] = m;
      return copy;
    });

    this.persist();
    if (this.selectedFolderId() === folderId) {
      this.selectedFolderId.set(null);
    }
  }

  // MULTI-SELECTION & GESTURES
  toggleSelectTx(id: string) {
    Haptics.impact({ style: ImpactStyle.Light });
    this.selectedTxIds.update(current => {
      const exists = current.includes(id);
      const updated = exists ? current.filter(i => i !== id) : [...current, id];
      if (updated.length === 0) {
        this.isSelectionMode.set(false);
      } else {
        this.isSelectionMode.set(true);
      }
      return updated;
    });
  }

  enableSelectionMode(initialTxId?: string) {
    Haptics.impact({ style: ImpactStyle.Medium });
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
    await Haptics.impact({ style: ImpactStyle.Heavy });
    const idx = this._currentMonthIndex();
    this._months.update(months => {
      const copy = [...months];
      const m = { ...copy[idx] };
      m.transactions = m.transactions.filter(t => t.id !== id);
      copy[idx] = m;
      return copy;
    });
    this.persist();
  }

  async bulkDeleteSelected() {
    const ids = this.selectedTxIds();
    if (ids.length === 0) return;

    await Haptics.impact({ style: ImpactStyle.Heavy });
    const idx = this._currentMonthIndex();
    this._months.update(months => {
      const copy = [...months];
      const m = { ...copy[idx] };
      m.transactions = m.transactions.filter(t => !ids.includes(t.id));
      copy[idx] = m;
      return copy;
    });
    this.persist();
    this.clearSelection();
  }

  // Simulator for bank push notifications
  triggerSampleBankNotification(bank: 'mBank' | 'Revolut' | 'PKO BP' = 'mBank') {
    const samples: BankPushNotification[] = [
      {
        id: 'push-1',
        bankName: 'mBank',
        merchant: 'Biedronka',
        amount: 64.20,
        time: 'Przed chwilą',
        suggestedCategory: 'Jedzenie',
        suggestedTags: ['Potrzebne', 'Spożywcze'],
        rawText: 'Płatność kartą: 64,20 zł w Biedronka Warszawa'
      },
      {
        id: 'push-2',
        bankName: 'Revolut',
        merchant: 'Uber Eats',
        amount: 48.50,
        time: '1 min temu',
        suggestedCategory: 'Jedzenie',
        suggestedTags: ['Zachcianka'],
        rawText: 'Płatność Revolut: 48,50 zł w Uber Eats'
      },
      {
        id: 'push-3',
        bankName: 'PKO BP',
        merchant: 'Stacja BP',
        amount: 210.00,
        time: '3 min temu',
        suggestedCategory: 'Transport',
        suggestedTags: ['Potrzebne'],
        rawText: 'Transakcja IKO: 210,00 zł Stacja Paliw BP'
      }
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    this.activeBankNotification.set(pick);
    Haptics.impact({ style: ImpactStyle.Heavy });
  }

  async acceptBankNotification() {
    const notif = this.activeBankNotification();
    if (!notif) return;

    await Haptics.impact({ style: ImpactStyle.Medium });
    const now = new Date();
    const formattedTime = `Dziś, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.addTransaction({
      title: notif.merchant,
      amount: notif.amount,
      category: notif.suggestedCategory,
      date: formattedTime,
      isoDate: now.toISOString().substring(0, 10),
      note: `Automatycznie z powiadomienia ${notif.bankName}`,
      tags: notif.suggestedTags,
      aiComment: `Płatność zarejestrowana automatycznie z powiadomienia bankowego ${notif.bankName}.`
    });

    this.activeBankNotification.set(null);
  }

  dismissBankNotification() {
    this.activeBankNotification.set(null);
  }

  async toggleTransactionExpand(txId: string) {
    if (this.isSelectionMode()) {
      this.toggleSelectTx(txId);
      return;
    }

    await Haptics.impact({ style: ImpactStyle.Light });
    const idx = this._currentMonthIndex();
    this._months.update(months => {
      const copy = [...months];
      const targetMonth = { ...copy[idx] };
      targetMonth.transactions = targetMonth.transactions.map(t => {
        if (t.id === txId) {
          return { ...t, isExpanded: !t.isExpanded };
        }
        return t;
      });
      copy[idx] = targetMonth;
      return copy;
    });
    this.persist();
  }

  async updateTransactionNote(txId: string, note: string) {
    const idx = this._currentMonthIndex();
    this._months.update(months => {
      const copy = [...months];
      const targetMonth = { ...copy[idx] };
      targetMonth.transactions = targetMonth.transactions.map(t => {
        if (t.id === txId) {
          return { ...t, note: note.trim() || undefined };
        }
        return t;
      });
      copy[idx] = targetMonth;
      return copy;
    });
    this.persist();
  }

  async toggleTransactionTag(txId: string, tag: TransactionTag) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    const idx = this._currentMonthIndex();
    this._months.update(months => {
      const copy = [...months];
      const targetMonth = { ...copy[idx] };
      targetMonth.transactions = targetMonth.transactions.map(t => {
        if (t.id === txId) {
          const hasTag = t.tags.includes(tag);
          const newTags = hasTag ? t.tags.filter(tg => tg !== tag) : [...t.tags, tag];
          return { ...t, tags: newTags };
        }
        return t;
      });
      copy[idx] = targetMonth;
      return copy;
    });
    this.persist();
  }

  async attachReceiptAndGenerateAi(txId: string, fileName: string) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    const idx = this._currentMonthIndex();
    
    this._months.update(months => {
      const copy = [...months];
      const targetMonth = { ...copy[idx] };
      targetMonth.transactions = targetMonth.transactions.map(t => {
        if (t.id === txId) {
          const simulatedAi = this.generateSmartAiComment(t.title, t.category, t.amount);
          return { 
            ...t, 
            receiptFileName: fileName,
            aiComment: simulatedAi
          };
        }
        return t;
      });
      copy[idx] = targetMonth;
      return copy;
    });
    this.persist();
  }

  private generateSmartAiComment(title: string, category: TransactionCategory, amount: number): string {
    const lower = title.toLowerCase();
    if (lower.includes('biedronka') || lower.includes('lidl') || lower.includes('auchan')) {
      return `Rozpoznano paragon z ${title} (${amount.toFixed(2)} zł). Zakup w dyskoncie — oszczędność ~15% względem sklepów convenience.`;
    }
    if (lower.includes('orlen') || lower.includes('bp') || lower.includes('shell')) {
      return `Faktura paliwowa ${amount.toFixed(2)} zł. Średnia cena za litr w normie rynkowej dla województwa mazowieckiego.`;
    }
    if (lower.includes('żabka')) {
      return `Impulsowy zakup w Żabce (${amount.toFixed(2)} zł). W skali miesiąca zakupy tego typu generują ~94 zł niepotrzebnego drenażu.`;
    }
    if (lower.includes('apteka')) {
      return `Apteka: zakup leków / suplementów (${amount.toFixed(2)} zł). Wydatek sklasyfikowany jako niezbędny zdrowotny.`;
    }
    return `AI przeanalizowało załączony dokument dla ${title} (${amount.toFixed(2)} zł). Wydatek mieści się w przewidywanym budżecie kategorii ${category}.`;
  }

  async addTransaction(newTx: Omit<Transaction, 'id'>) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    const id = 't-' + Math.random().toString(36).substring(2, 9);
    const tx: Transaction = { ...newTx, id };
    const idx = this._currentMonthIndex();

    this._months.update(months => {
      const copy = [...months];
      const targetMonth = { ...copy[idx] };
      targetMonth.transactions = [tx, ...targetMonth.transactions];
      copy[idx] = targetMonth;
      return copy;
    });
    this.persist();
    this.isAddModalOpen.set(false);
  }

  async toggleAiSummary() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.isAiSummaryOpen.update(v => !v);
  }

  async toggleShowAll() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.showAllTransactions.update(v => !v);
  }
}
