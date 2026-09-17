import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetStateService } from '../../core/services/budget-state.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-budget-create-folder-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (state.isCreateFolderModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
        <div class="relative w-full max-w-md rounded-3xl bg-[#111827] border border-emerald-500/30 p-6 shadow-2xl space-y-4">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>📁</span>
              <span>Utwórz nowy folder / Wycieczkę</span>
            </h3>
            <button 
              type="button" 
              (click)="state.isCreateFolderModalOpen.set(false)"
              class="text-slate-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Nazwa folderu *</label>
              <input 
                type="text" 
                formControlName="name"
                placeholder="np. Wycieczka Japonia 🇯🇵, Remont kuchni 🔨, Ślub"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <!-- Emoji Picker -->
            <div>
              <label class="block text-slate-400 font-semibold mb-1.5">Wybierz ikonę (Emoji)</label>
              <div class="flex flex-wrap gap-2">
                @for (emoji of sampleEmojis; track emoji) {
                  <button 
                    type="button" 
                    (click)="selectedEmoji = emoji"
                    class="w-10 h-10 rounded-2xl border flex items-center justify-center text-lg transition"
                    [ngClass]="selectedEmoji === emoji ? 'bg-emerald-500/20 border-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'"
                  >
                    {{ emoji }}
                  </button>
                }
              </div>
            </div>

            @if (state.selectedTxIds().length > 0) {
              <div class="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs">
                <span>✓ Do tego folderu zostanie od razu dodanych <strong>{{ state.selectedTxIds().length }}</strong> wcześniej zaznaczonych transakcji.</span>
              </div>
            }

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                (click)="state.isCreateFolderModalOpen.set(false)"
                class="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Anuluj
              </button>
              <button 
                type="submit" 
                [disabled]="form.invalid"
                class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
              >
                Utwórz folder
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class BudgetCreateFolderModalComponent {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(BudgetStateService);

  selectedEmoji: string = '🇯🇵';
  readonly sampleEmojis = ['🇯🇵', '🏖️', '🏕️', '✈️', '🔨', '🎉', '🏎️', '🍕', '💻', '🎁'];

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  onSubmit() {
    if (this.form.invalid) return;

    const name = this.form.value.name;
    const txIds = this.state.selectedTxIds();

    this.state.createFolder(name, this.selectedEmoji, '#10b981', txIds);
    this.form.reset();
  }
}
