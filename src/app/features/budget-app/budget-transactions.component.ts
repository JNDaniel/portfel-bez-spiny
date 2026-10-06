import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonList,
  IonItemSliding, 
  IonItem, 
  IonItemOptions, 
  IonItemOption
} from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

import { 
  AVAILABLE_TAGS, 
  Transaction, 
  TransactionTag 
} from '../../core/models/budget-app.model';
import { DEMO_FEATURES_ENABLED } from '../../core/config/demo-features';
import { BudgetStateService } from '../../core/services/budget-state.service';
import { BudgetAiSummaryComponent } from './budget-ai-summary.component';
import { BudgetFoldersBarComponent } from './budget-folders-bar.component';

@Component({
  selector: 'app-budget-transactions',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonList,
    IonItemSliding, 
    IonItem, 
    IonItemOptions, 
    IonItemOption, 
    BudgetAiSummaryComponent,
    BudgetFoldersBarComponent
  ],
  styles: [`
    ion-item {
      --background: transparent !important;
      --color: #ffffff !important;
      --inner-padding-end: 0px !important;
      --padding-start: 0px !important;
      --min-height: auto !important;
      --ripple-color: transparent !important;
    }
    ion-list {
      background: transparent !important;
      padding: 0 !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <!-- Folders Bar (Wycieczki / Grupy) -->
    <app-budget-folders-bar></app-budget-folders-bar>

    <!-- Floating Bulk Selection Action Bar -->
    @if (state.isSelectionMode() && state.selectedTxIds().length > 0) {
      <div class="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div class="rounded-3xl bg-[#111827]/95 border-2 border-emerald-500/80 p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 ring-4 ring-emerald-500/20">
          <div>
            <span class="text-xs font-bold text-white block">
              Zaznaczono: <strong class="text-emerald-400 font-mono">{{ state.selectedTxIds().length }}</strong> transakcji
            </span>
            <span class="text-[10px] text-slate-400">Wykonaj akcję zbiorczą</span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Create / Assign to Folder -->
            <button 
              type="button" 
              (click)="openFolderAssignModal()"
              class="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <span>📁</span>
              <span>Folderuj</span>
            </button>

            <!-- Bulk Delete -->
            <button 
              type="button" 
              (click)="bulkDelete()"
              class="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1"
            >
              <span>🗑️</span>
              <span>Usuń</span>
            </button>

            <!-- Cancel -->
            <button 
              type="button" 
              (click)="state.clearSelection()"
              class="p-2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Main Transactions Card -->
    <div class="w-full rounded-3xl bg-[#111827]/90 border border-slate-800/80 p-5 md:p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <!-- Section Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div class="flex items-center gap-2">
          <h3 class="text-base font-extrabold text-white">Transakcje</h3>
          @if (state.selectedFolderId()) {
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/30">
              Folder: {{ state.activeFolder()?.name }}
            </span>
          }
        </div>

        <div class="flex items-center gap-3">
          <!-- Multi-Select Toggle Button -->
          <button 
            type="button" 
            (click)="toggleMultiSelectMode()"
            class="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
          >
            {{ state.isSelectionMode() ? 'Anuluj wybór' : 'Zaznacz wiele' }}
          </button>

          <span class="text-xs font-medium text-slate-500 font-mono">
            {{ state.filteredTransactions().length }} pozycji
          </span>
        </div>
      </div>

      <!-- Transaction List with Swipe Actions & Long-Press Selection -->
      <ion-list class="divide-y divide-slate-800/60 bg-transparent">
        @for (tx of state.visibleTransactions(); track tx.id) {
          <ion-item-sliding class="bg-transparent group overflow-hidden rounded-2xl">
            
            <!-- Left Swipe Option: Quick Assign to Folder -->
            <ion-item-options side="start">
              <ion-item-option 
                color="primary" 
                (click)="quickAssignFolder(tx)"
                class="px-4 bg-blue-600 hover:bg-blue-500 font-bold"
              >
                <div class="flex flex-col items-center justify-center text-xs">
                  <span class="text-base">📁</span>
                  <span class="text-[10px] uppercase font-bold mt-0.5">Folder</span>
                </div>
              </ion-item-option>
            </ion-item-options>

            <!-- Main Transaction Row Item -->
            <ion-item 
              lines="none"
              style="--background: transparent; --color: #ffffff;"
              class="w-full bg-transparent"
            >
              <div 
                class="w-full py-3.5 transition select-none"
                (pointerdown)="startLongPress(tx.id, $event)"
                (pointerup)="cancelLongPress()"
                (pointerleave)="cancelLongPress()"
                (contextmenu)="onContextMenu(tx.id, $event)"
              >
                <div 
                  (click)="handleRowClick(tx.id)"
                  class="flex items-center justify-between cursor-pointer select-none"
                >
                  <!-- Left Checkbox & Category Icon & Details -->
                  <div class="flex items-center gap-3.5 min-w-0">
                    <!-- Checkbox in Selection Mode -->
                    @if (state.isSelectionMode()) {
                      <input 
                        type="checkbox" 
                        [checked]="state.selectedTxIds().includes(tx.id)"
                        (click)="$event.stopPropagation(); state.toggleSelectTx(tx.id)"
                        class="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer shrink-0"
                      />
                    }

                    <!-- Circular Category Icon -->
                    <div class="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-300 text-lg shrink-0 shadow-inner">
                      <span>{{ getCategoryEmoji(tx.category) }}</span>
                    </div>

                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-bold text-white text-sm truncate">{{ tx.title }}</span>
                        
                        <!-- Folder Badge -->
                        @if (tx.folderName) {
                          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                            📁 {{ tx.folderName }}
                          </span>
                        }

                        <!-- Tags Badges -->
                        @for (tag of tx.tags; track tag) {
                          <span 
                            class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                            [ngClass]="getTagBadgeClass(tag)"
                          >
                            {{ tag }}
                          </span>
                        }
                      </div>
                      
                      <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                        <span>{{ tx.category }}</span>
                        <span>&bull;</span>
                        <span>{{ tx.date }}</span>
                      </div>
                      
                      @if (tx.note && !tx.isExpanded) {
                        <p class="text-[11px] text-slate-400 italic mt-0.5 truncate">
                          „{{ tx.note }}”
                        </p>
                      }
                    </div>
                  </div>

                  <!-- Right: Amount & Quick Desktop Actions & Toggle Chevron -->
                  <div class="flex items-center gap-3 shrink-0 ml-3">
                    <!-- Quick Delete / Folder on Desktop Hover -->
                    <div class="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition mr-1">
                      <button 
                        type="button" 
                        (click)="$event.stopPropagation(); quickAssignFolder(tx)"
                        title="Dodaj do folderu / wycieczki"
                        class="p-1 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800"
                      >
                        📁
                      </button>
                      <button 
                        type="button" 
                        (click)="$event.stopPropagation(); deleteSwipe(tx.id)"
                        title="Usuń transakcję"
                        class="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                      >
                        🗑️
                      </button>
                    </div>

                    <span class="font-bold text-rose-500 text-sm md:text-base font-mono whitespace-nowrap">
                      -{{ tx.amount.toFixed(2).replace('.', ',') }} zł
                    </span>
                    <span class="text-slate-500 text-xs transition-transform duration-200" [class.rotate-180]="tx.isExpanded">
                      ▼
                    </span>
                  </div>
                </div>

                <!-- Expanded Details Drawer -->
                @if (tx.isExpanded && !state.isSelectionMode()) {
                  <div class="mt-3.5 pt-3.5 border-t border-slate-800/40 space-y-3.5 animate-in fade-in duration-200 pl-2">
                    <!-- Editable Description Note -->
                    <div class="flex items-center gap-2 text-xs">
                      <span class="text-slate-400">✏️</span>
                      <input 
                        type="text" 
                        [ngModel]="tx.note || ''"
                        (ngModelChange)="state.updateTransactionNote(tx.id, $event)"
                        placeholder="Dodaj opis..."
                        class="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-xs italic focus:ring-0"
                      />
                    </div>

                    <!-- Interactive Tag Selector Pills -->
                    <div class="flex items-center gap-2 flex-wrap text-xs">
                      <span class="text-slate-400 text-xs mr-1">🏷️</span>
                      @for (t of availableTags; track t.name) {
                        <button 
                          type="button" 
                          (click)="state.toggleTransactionTag(tx.id, t.name)"
                          class="px-2.5 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1"
                          [ngClass]="tx.tags.includes(t.name) ? t.activeClass : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:bg-slate-800'"
                        >
                          @if (tx.tags.includes(t.name)) {
                            <span>✓</span>
                          }
                          <span>{{ t.name }}</span>
                        </button>
                      }
                    </div>

                    <!-- Assign Folder inside drawer -->
                    <div class="flex items-center gap-2 text-xs text-slate-400">
                      <span>📁 Folder:</span>
                      <select 
                        [ngModel]="tx.folderId || ''"
                        (ngModelChange)="assignSingleTxFolder(tx.id, $event)"
                        class="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                      >
                        <option value="">Brak folderu</option>
                        @for (f of state.folders(); track f.id) {
                          <option [value]="f.id">{{ f.emoji }} {{ f.name }}</option>
                        }
                      </select>
                    </div>

                    @if (demoFeaturesEnabled) {
                      <!-- Receipt Upload Box & AI Comment Generator -->
                      <div>
                        <label class="block cursor-pointer">
                          <div class="p-3 rounded-2xl border border-dashed border-slate-700 hover:border-purple-500/60 bg-slate-900/40 hover:bg-slate-900/80 transition flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-purple-300">
                            <span>⬆</span>
                            <span>{{ tx.receiptFileName ? ('Załączono: ' + tx.receiptFileName + ' (Zmień)') : 'Wgraj paragon lub fakturę → komentarz AI' }}</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            (change)="onFileSelected(tx.id, $event)" 
                            class="hidden" 
                          />
                        </label>

                        <!-- AI Contextual Comment Display -->
                        @if (tx.aiComment) {
                          <div class="mt-2.5 p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs text-purple-200 flex items-start gap-2 animate-in fade-in">
                            <span class="text-purple-400 shrink-0">✨</span>
                            <p class="leading-relaxed"><strong class="text-purple-400 font-semibold">AI:</strong> {{ tx.aiComment }}</p>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </ion-item>

            <!-- Right Swipe Option: Delete Transaction -->
            <ion-item-options side="end">
              <ion-item-option 
                color="danger" 
                (click)="deleteSwipe(tx.id)"
                class="px-4 bg-rose-600 hover:bg-rose-500 font-bold"
              >
                <div class="flex flex-col items-center justify-center text-xs">
                  <span class="text-base">🗑️</span>
                  <span class="text-[10px] uppercase font-bold mt-0.5">Usuń</span>
                </div>
              </ion-item-option>
            </ion-item-options>

          </ion-item-sliding>
        }
      </ion-list>

      <!-- Pagination & AI Summary Trigger Button (Bottom of list) -->
      @let showPagination = state.filteredTransactions().length > 5 && !state.selectedFolderId();
      @if (showPagination || demoFeaturesEnabled) {
        <div class="pt-3 border-t border-slate-800/80 flex flex-col items-center gap-3">
          @if (showPagination) {
            <button 
              type="button" 
              (click)="state.toggleShowAll()"
              class="text-xs font-semibold text-slate-400 hover:text-white transition py-1"
            >
              {{ state.showAllTransactions() ? 'Zwiń listę' : '+ Pokaż wszystkie (' + (state.filteredTransactions().length - 5) + ' więcej)' }}
            </button>
          }

          @if (demoFeaturesEnabled) {
            <!-- AI Summary Trigger Button -->
            <button 
              type="button" 
              (click)="state.toggleAiSummary()"
              class="w-full py-2.5 rounded-2xl bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-xs font-semibold text-slate-300 hover:text-purple-300 flex items-center justify-center gap-2 shadow-lg transition"
            >
              <span>📊</span>
              <span>Analizuj cały {{ state.currentMonth().label.split(' ')[0] }} — podsumowanie AI</span>
            </button>
          }
        </div>
      }
    </div>

    <!-- AI Summary Bottom Card -->
    @if (demoFeaturesEnabled) {
      <app-budget-ai-summary class="block mt-4"></app-budget-ai-summary>
    }
  `
})
export class BudgetTransactionsComponent {
  readonly state = inject(BudgetStateService);
  readonly availableTags = AVAILABLE_TAGS;
  readonly demoFeaturesEnabled = DEMO_FEATURES_ENABLED;

  private longPressTimer: any = null;
  private isLongPressTriggered = false;

  getCategoryEmoji(category: string): string {
    switch (category) {
      case 'Mieszkanie': return '🏠';
      case 'Jedzenie': return '☕';
      case 'Transport': return '🚗';
      case 'Zakupy': return '🛍️';
      case 'Zdrowie': return '❤️';
      case 'Rozrywka': return '🎵';
      case 'Media': return '⚡';
      default: return '💳';
    }
  }

  getTagBadgeClass(tag: TransactionTag): string {
    switch (tag) {
      case 'Potrzebne': return 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40';
      case 'Zachcianka': return 'bg-amber-950/70 text-amber-400 border-amber-500/40';
      case 'Cykliczne': return 'bg-blue-950/70 text-blue-400 border-blue-500/40';
      case 'Zbędne': return 'bg-rose-950/70 text-rose-400 border-rose-500/40';
      case 'Służbowe': return 'bg-indigo-950/70 text-indigo-400 border-indigo-500/40';
      case 'Spożywcze': return 'bg-teal-950/70 text-teal-400 border-teal-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  startLongPress(txId: string, event: PointerEvent) {
    this.isLongPressTriggered = false;
    this.longPressTimer = setTimeout(() => {
      this.isLongPressTriggered = true;
      Haptics.impact({ style: ImpactStyle.Heavy });
      this.state.enableSelectionMode(txId);
    }, 450); // 450ms long press threshold
  }

  cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  onContextMenu(txId: string, event: Event) {
    event.preventDefault();
    this.cancelLongPress();
    this.state.enableSelectionMode(txId);
  }

  handleRowClick(txId: string) {
    if (this.isLongPressTriggered) {
      this.isLongPressTriggered = false;
      return;
    }
    this.state.toggleTransactionExpand(txId);
  }

  toggleMultiSelectMode() {
    if (this.state.isSelectionMode()) {
      this.state.clearSelection();
    } else {
      this.state.enableSelectionMode();
    }
  }

  async quickAssignFolder(tx: Transaction) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.state.enableSelectionMode(tx.id);
    this.state.isCreateFolderModalOpen.set(true);
  }

  async deleteSwipe(txId: string) {
    await this.state.deleteTransaction(txId);
  }

  async assignSingleTxFolder(txId: string, folderId: string) {
    if (!folderId) {
      const idx = this.state['_currentMonthIndex']();
      this.state['_months'].update(months => {
        const copy = [...months];
        const m = { ...copy[idx] };
        m.transactions = m.transactions.map(t => {
          if (t.id === txId) {
            const { folderId: _, folderName: __, ...rest } = t;
            return rest as Transaction;
          }
          return t;
        });
        copy[idx] = m;
        return copy;
      });
      this.state['persist']();
      return;
    }

    const folder = this.state.folders().find(f => f.id === folderId);
    if (folder) {
      const idx = this.state['_currentMonthIndex']();
      this.state['_months'].update(months => {
        const copy = [...months];
        const m = { ...copy[idx] };
        m.transactions = m.transactions.map(t => {
          if (t.id === txId) {
            return { ...t, folderId: folder.id, folderName: folder.name };
          }
          return t;
        });
        copy[idx] = m;
        return copy;
      });
      this.state['persist']();
    }
  }

  openFolderAssignModal() {
    this.state.isCreateFolderModalOpen.set(true);
  }

  async bulkDelete() {
    if (confirm('Czy na pewno chcesz usunąć ' + this.state.selectedTxIds().length + ' transakcji?')) {
      await this.state.bulkDeleteSelected();
    }
  }

  onFileSelected(txId: string, event: any) {
    const file = event.target.files[0];
    if (file) {
      this.state.attachReceiptAndGenerateAi(txId, file.name);
    }
  }
}
