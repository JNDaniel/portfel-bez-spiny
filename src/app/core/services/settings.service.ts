import { Injectable, signal, computed, effect } from '@angular/core';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  CURRENCY_SYMBOLS,
  SupportedCurrency,
} from '../models/settings.model';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly STORAGE_KEY = 'costflow_settings';
  private readonly _settings = signal<AppSettings>(this.loadSettings());

  public readonly settings = this._settings.asReadonly();
  public readonly currency = computed(() => this._settings().currency);
  public readonly currencySymbol = computed(() => this._settings().currencySymbol);
  public readonly overallMonthlyBudget = computed(() => this._settings().overallMonthlyBudget);
  public readonly isMockBackend = computed(() => this._settings().isMockBackend);
  public readonly apiUrl = computed(() => this._settings().apiUrl);

  constructor() {
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._settings()));
    });
  }

  updateSettings(partial: Partial<AppSettings>) {
    this._settings.update((curr) => {
      const updated = { ...curr, ...partial };
      if (partial.currency) {
        updated.currencySymbol = CURRENCY_SYMBOLS[partial.currency] || '€';
      }
      return updated;
    });
  }

  setCurrency(currency: SupportedCurrency) {
    this.updateSettings({
      currency,
      currencySymbol: CURRENCY_SYMBOLS[currency] || '$',
    });
  }

  setOverallBudget(budget: number) {
    this.updateSettings({ overallMonthlyBudget: budget });
  }

  formatCurrency(amount: number, options?: { hideDecimals?: boolean }): string {
    const symbol = this.currencySymbol();
    const curr = this.currency();
    const formattedNum = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: options?.hideDecimals ? 0 : 2,
      maximumFractionDigits: options?.hideDecimals ? 0 : 2,
    }).format(amount);

    if (curr === 'PLN') {
      return `${formattedNum} zł`;
    }
    return `${symbol}${formattedNum}`;
  }

  private loadSettings(): AppSettings {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage', e);
    }
    return { ...DEFAULT_SETTINGS };
  }
}
