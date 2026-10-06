import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { parseAmountToMinor } from '../../core/domain/money';
import {
  EXPENSE_CLASSIFICATIONS,
  EXPENSE_TAGS,
  ExpenseCategory,
  ExpenseClassification,
  ExpenseTag,
} from '../../core/models/finance.model';
import { BudgetStateService } from '../../core/services/budget-state.service';
import { CLASSIFICATION_META, TAG_META } from './budget-ui.meta';

@Component({
  selector: 'app-budget-add-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (state.isAddModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-add-modal-title"
          class="relative w-full max-w-lg rounded-3xl bg-[#111827] border border-slate-800 p-6 shadow-2xl space-y-4"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 id="budget-add-modal-title" class="text-base font-bold text-white">
              Dodaj nowy wydatek
            </h3>
            <button
              type="button"
              (click)="state.isAddModalOpen.set(false)"
              aria-label="Zamknij"
              class="text-slate-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4 text-xs">
            <div>
              <label for="budget-add-title" class="block text-slate-400 font-semibold mb-1"
                >Nazwa / Tytuł transakcji *</label
              >
              <input
                id="budget-add-title"
                type="text"
                formControlName="title"
                placeholder="np. Biedronka, Paliwo, Restauracja"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="budget-add-amount" class="block text-slate-400 font-semibold mb-1"
                  >Kwota (zł) *</label
                >
                <input
                  id="budget-add-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  formControlName="amount"
                  placeholder="0.00"
                  class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              <div>
                <label for="budget-add-category" class="block text-slate-400 font-semibold mb-1"
                  >Kategoria *</label
                >
                <select
                  id="budget-add-category"
                  formControlName="category"
                  class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white outline-none focus:border-emerald-500"
                >
                  <option value="Mieszkanie">Mieszkanie</option>
                  <option value="Jedzenie">Jedzenie</option>
                  <option value="Transport">Transport</option>
                  <option value="Zakupy">Zakupy</option>
                  <option value="Zdrowie">Zdrowie</option>
                  <option value="Rozrywka">Rozrywka</option>
                  <option value="Media">Media</option>
                  <option value="Inne">Inne</option>
                </select>
              </div>
            </div>

            <div>
              <label for="budget-add-note" class="block text-slate-400 font-semibold mb-1"
                >Krótki opis / Notatka</label
              >
              <input
                id="budget-add-note"
                type="text"
                formControlName="note"
                placeholder="np. „głodny po treningu”, „farba do salonu”"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white outline-none focus:border-emerald-500 italic"
              />
            </div>

            <!-- Classification Selector -->
            <div>
              <span
                id="budget-add-classification-label"
                class="block leading-[normal] text-slate-400 font-semibold mb-1.5"
                >Rodzaj wydatku</span
              >
              <div
                class="flex flex-wrap gap-2"
                role="group"
                aria-labelledby="budget-add-classification-label"
              >
                @for (c of classifications; track c) {
                  <button
                    type="button"
                    (click)="selectClassification(c)"
                    [attr.aria-pressed]="selectedClassification === c"
                    class="px-3 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1"
                    [ngClass]="
                      selectedClassification === c
                        ? classificationMeta[c].activeClass
                        : 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                    "
                  >
                    @if (selectedClassification === c) {
                      <span>✓</span>
                    }
                    <span>{{ classificationMeta[c].label }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Tags Selector -->
            <div>
              <span
                id="budget-add-tags-label"
                class="block leading-[normal] text-slate-400 font-semibold mb-1.5"
                >Tagi (opcjonalnie)</span
              >
              <div
                class="flex flex-wrap gap-2"
                role="group"
                aria-labelledby="budget-add-tags-label"
              >
                @for (tag of availableTags; track tag) {
                  <button
                    type="button"
                    (click)="toggleTag(tag)"
                    class="px-3 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1"
                    [ngClass]="
                      selectedTags.includes(tag)
                        ? tagMeta[tag].activeClass
                        : 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                    "
                  >
                    @if (selectedTags.includes(tag)) {
                      <span>✓</span>
                    }
                    <span>{{ tag }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Modal Actions -->
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="state.isAddModalOpen.set(false)"
                class="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
              >
                Anuluj
              </button>
              <button
                type="submit"
                [disabled]="form.invalid"
                class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition"
              >
                Dodaj wydatek
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class BudgetAddModalComponent {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(BudgetStateService);
  readonly availableTags = EXPENSE_TAGS;
  readonly tagMeta = TAG_META;
  readonly classifications = EXPENSE_CLASSIFICATIONS;
  readonly classificationMeta = CLASSIFICATION_META;

  selectedTags: ExpenseTag[] = [];
  selectedClassification: ExpenseClassification = 'everyday';

  readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    category: ['Jedzenie', Validators.required],
    note: [''],
  });

  selectClassification(classification: ExpenseClassification) {
    this.selectedClassification = classification;
  }

  toggleTag(tag: ExpenseTag) {
    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter((t) => t !== tag);
    } else {
      this.selectedTags = [...this.selectedTags, tag];
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const amountMinor = parseAmountToMinor(val.amount);
    if (amountMinor === null || amountMinor <= 0) return;

    void this.state.addExpense({
      title: val.title,
      amountMinor,
      category: val.category as ExpenseCategory,
      classification: this.selectedClassification,
      note: val.note || undefined,
      tags: this.selectedTags,
    });

    this.form.reset({ category: 'Jedzenie' });
    this.selectedTags = [];
    this.selectedClassification = 'everyday';
  }
}
