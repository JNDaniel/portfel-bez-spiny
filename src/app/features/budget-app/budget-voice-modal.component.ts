import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetStateService } from '../../core/services/budget-state.service';
import { formatMinorAmount, parseAmountToMinor } from '../../core/domain/money';
import {
  ExpenseCategory,
  ExpenseClassification,
  ExpenseTag,
} from '../../core/models/finance.model';
import { HapticsService } from '../../core/services/haptics.service';

@Component({
  selector: 'app-budget-voice-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (state.isVoiceModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      >
        <div
          class="relative w-full max-w-md rounded-3xl bg-[#111827] border border-emerald-500/30 p-6 shadow-2xl space-y-5 text-center"
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>🎙️</span>
              <span>Asystent Głosowy AI</span>
            </h3>
            <button
              type="button"
              (click)="state.isVoiceModalOpen.set(false)"
              class="text-slate-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>

          <!-- Pulsing Microphone Visualizer -->
          <div class="flex flex-col items-center justify-center py-4 space-y-3">
            <button
              type="button"
              (click)="toggleListening()"
              class="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-3xl text-slate-950 shadow-2xl shadow-emerald-500/40 transition-transform active:scale-95"
              [ngClass]="isListening() ? 'animate-ping' : ''"
            >
              🎙️
            </button>
            <span class="text-xs font-semibold text-slate-300">
              {{
                isListening()
                  ? 'Słucham... powiedz np. „Wydałem 42 zł w aptece”'
                  : 'Kliknij mikrofon lub wpisz poniżej:'
              }}
            </span>
          </div>

          <!-- Voice Transcript / NLP Textbox -->
          <div>
            <input
              type="text"
              [(ngModel)]="voiceInputText"
              placeholder="np. Kupiłem obiad za 38 zł w restauracji"
              class="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Sample Quick Phrases -->
          <div class="flex flex-wrap gap-1.5 justify-center pt-1">
            <button
              type="button"
              (click)="setSamplePhrase('Wydałem 35 zł na kebaba po pracy')"
              class="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400"
            >
              „35 zł na kebaba”
            </button>
            <button
              type="button"
              (click)="setSamplePhrase('Paliwo za 200 zł na stacji Circle K')"
              class="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400"
            >
              „200 zł na paliwo”
            </button>
          </div>

          <!-- Process Button -->
          <div class="pt-2 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              (click)="state.isVoiceModalOpen.set(false)"
              class="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
            >
              Anuluj
            </button>
            <button
              type="button"
              (click)="processVoiceNlp()"
              [disabled]="!voiceInputText.trim()"
              class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              Przetwórz i dodaj
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class BudgetVoiceModalComponent {
  readonly state = inject(BudgetStateService);
  private readonly haptics = inject(HapticsService);
  readonly isListening = signal<boolean>(false);
  voiceInputText = '';

  toggleListening() {
    this.isListening.set(!this.isListening());
    void this.haptics.impact('medium');

    if (this.isListening()) {
      setTimeout(() => {
        this.voiceInputText = 'Wydałem 42,50 zł w aptece na witaminy';
        this.isListening.set(false);
        void this.haptics.impact('light');
      }, 1800);
    }
  }

  setSamplePhrase(phrase: string) {
    this.voiceInputText = phrase;
  }

  async processVoiceNlp() {
    if (!this.voiceInputText.trim()) return;

    await this.haptics.impact('medium');
    const text = this.voiceInputText.toLowerCase();

    // Extract amount
    const amountMatch = text.match(/\d+([,.]\d+)?/);
    const amountMinor = (amountMatch ? parseAmountToMinor(amountMatch[0]) : null) ?? 2500;

    let category: ExpenseCategory = 'Jedzenie';
    let title = 'Wydatek głosowy';
    let classification: ExpenseClassification = 'everyday';
    const tags: ExpenseTag[] = [];

    if (
      text.includes('paliwo') ||
      text.includes('stacji') ||
      text.includes('uber') ||
      text.includes('bolt')
    ) {
      category = 'Transport';
      title = text.includes('stacji') ? 'Stacja Paliw' : 'Przejazd / Transport';
    } else if (text.includes('aptece') || text.includes('witaminy') || text.includes('leki')) {
      category = 'Zdrowie';
      title = 'Apteka';
    } else if (
      text.includes('kebab') ||
      text.includes('obiad') ||
      text.includes('restauracji') ||
      text.includes('pizzę')
    ) {
      category = 'Jedzenie';
      title = text.includes('kebab') ? 'Kebab' : 'Restauracja / Obiad';
      classification = text.includes('kebab') ? 'want' : 'everyday';
    }

    await this.state.addExpense({
      title,
      amountMinor,
      category,
      classification,
      note: `Głos: „${this.voiceInputText}”`,
      tags,
      aiComment: `AI przetworzyło komendę głosową: ${this.voiceInputText}. Kwota: ${formatMinorAmount(amountMinor)} zł przypisana do ${category}.`,
    });

    this.voiceInputText = '';
    this.state.isVoiceModalOpen.set(false);
  }
}
