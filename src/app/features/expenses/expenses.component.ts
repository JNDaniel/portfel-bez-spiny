import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonRefresher, 
  IonRefresherContent, 
  IonFab, 
  IonFabButton, 
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, downloadOutline, trashOutline, createOutline, refreshOutline, funnelOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ExpenseService } from '../../core/services/expense.service';
import { SettingsService } from '../../core/services/settings.service';
import { CATEGORY_META, Expense, ExpenseCategory } from '../../core/models/expense.model';
import { ExpenseFormModalComponent } from '../../shared/components/expense-form-modal/expense-form-modal.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonRefresher, 
    IonRefresherContent, 
    IonFab, 
    IonFabButton, 
    IonIcon,
    ExpenseFormModalComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="ion-padding-bottom">
      <!-- Native Pull to Refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content pullingIcon="refresh-outline" pullingText="Pull to refresh ledger"></ion-refresher-content>
      </ion-refresher>

      <div class="space-y-6">
        <!-- Header & Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Expense Ledger</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Detailed list, advanced filtering, export, and record management.</p>
          </div>

          <div class="flex items-center gap-2">
            <!-- Export Buttons -->
            <button 
              type="button" 
              (click)="expenseService.exportCsv()"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <ion-icon name="download-outline" class="text-emerald-500 text-sm"></ion-icon>
              <span>Export CSV</span>
            </button>

            <!-- Desktop Add Button -->
            <button 
              type="button" 
              (click)="openCreateModal()"
              class="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition"
            >
              <ion-icon name="add" class="text-base"></ion-icon>
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        <!-- Filter Card -->
        <div class="glass-card p-4 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <!-- Search input -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Search</label>
              <input 
                type="text" 
                [ngModel]="expenseService.filter().search"
                (ngModelChange)="onFilterChange({ search: $event })"
                placeholder="Title, vendor, tags..."
                class="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <!-- Category filter -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Category</label>
              <select 
                [ngModel]="expenseService.filter().category"
                (ngModelChange)="onFilterChange({ category: $event })"
                class="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                <option value="ALL">All Categories</option>
                @for (cat of categories; track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            </div>

            <!-- Status filter -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Status</label>
              <select 
                [ngModel]="expenseService.filter().status"
                (ngModelChange)="onFilterChange({ status: $event })"
                class="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                <option value="ALL">All Statuses</option>
                <option value="cleared">Cleared</option>
                <option value="pending">Pending</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>

            <!-- Payment Method -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Payment Method</label>
              <select 
                [ngModel]="expenseService.filter().paymentMethod"
                (ngModelChange)="onFilterChange({ paymentMethod: $event })"
                class="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                <option value="ALL">All Methods</option>
                <option value="Corporate Card">Corporate Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="PayPal">PayPal</option>
                <option value="Direct Debit">Direct Debit</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <!-- Sort By -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Sort By</label>
              <select 
                [ngModel]="expenseService.filter().sortBy"
                (ngModelChange)="onFilterChange({ sortBy: $event })"
                class="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                <option value="date">Date (Recent First)</option>
                <option value="amount">Amount (High to Low)</option>
                <option value="title">Title (A-Z)</option>
                <option value="vendor">Vendor (A-Z)</option>
              </select>
            </div>
          </div>

          <!-- Filter Summary & Reset -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span class="text-slate-500 dark:text-slate-400">
              Showing <strong class="text-slate-900 dark:text-white">{{ expenseService.filteredExpenses().length }}</strong> of {{ expenseService.expenses().length }} records
              &bull; Filtered Total: <strong class="text-brand-600 dark:text-brand-400">{{ settingsService.formatCurrency(expenseService.filteredTotalAmount()) }}</strong>
            </span>

            <button 
              type="button" 
              (click)="expenseService.resetFilter()"
              class="text-xs text-brand-600 hover:text-brand-500 font-semibold"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Bulk Actions Bar (if any selected) -->
        @if (selectedIds().length > 0) {
          <div class="p-3 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 rounded-xl flex items-center justify-between animate-in fade-in">
            <span class="text-xs font-semibold text-brand-900 dark:text-brand-200">
              {{ selectedIds().length }} expense(s) selected
            </span>
            <button 
              type="button" 
              (click)="deleteSelected()"
              class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
            >
              Delete Selected
            </button>
          </div>
        }

        <!-- Expenses Table -->
        <div class="glass-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="p-3.5 w-10">
                    <input 
                      type="checkbox" 
                      [checked]="isAllSelected()" 
                      (change)="toggleSelectAll()"
                      class="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th class="p-3.5">Expense Details</th>
                  <th class="p-3.5">Category</th>
                  <th class="p-3.5">Date</th>
                  <th class="p-3.5">Payment Method</th>
                  <th class="p-3.5">Status</th>
                  <th class="p-3.5 text-right">Amount</th>
                  <th class="p-3.5 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (exp of expenseService.filteredExpenses(); track exp.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td class="p-3.5">
                      <input 
                        type="checkbox" 
                        [checked]="isSelected(exp.id)" 
                        (change)="toggleSelect(exp.id)"
                        class="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td class="p-3.5">
                      <div class="font-bold text-slate-900 dark:text-white">{{ exp.title }}</div>
                      <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{{ exp.vendor }}</span>
                        @if (exp.department) {
                          <span>&bull; {{ exp.department }}</span>
                        }
                      </div>
                      @if (exp.tags && exp.tags.length > 0) {
                        <div class="flex flex-wrap gap-1 mt-1.5">
                          @for (tag of exp.tags; track tag) {
                            <span class="px-1.5 py-0.2 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              #{{ tag }}
                            </span>
                          }
                        </div>
                      }
                    </td>
                    <td class="p-3.5">
                      <span class="px-2.5 py-1 rounded-lg text-[11px] font-semibold" [ngClass]="getCategoryBadgeClass(exp.category)">
                        {{ exp.category }}
                      </span>
                    </td>
                    <td class="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{{ exp.date }}</td>
                    <td class="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{{ exp.paymentMethod }}</td>
                    <td class="p-3.5">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase" [ngClass]="{
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20': exp.status === 'cleared',
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20': exp.status === 'pending',
                        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20': exp.status === 'recurring'
                      }">
                        {{ exp.status }}
                      </span>
                    </td>
                    <td class="p-3.5 text-right font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                      {{ settingsService.formatCurrency(exp.amount) }}
                    </td>
                    <td class="p-3.5 text-center">
                      <div class="flex items-center justify-center gap-1">
                        <button 
                          type="button" 
                          (click)="openEditModal(exp)"
                          title="Edit expense"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button 
                          type="button" 
                          (click)="deleteExpense(exp.id)"
                          title="Delete expense"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="p-8 text-center text-slate-400">
                      <p class="text-sm font-semibold">No expenses match the current filter</p>
                      <p class="text-xs mt-1">Try broadening your search or clear filters.</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Mobile Floating Action Button (FAB) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="sm:hidden mb-16 mr-3">
        <ion-fab-button (click)="openCreateModal()" class="shadow-xl">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- Modal for Create / Edit -->
    <app-expense-form-modal
      [isOpen]="isModalOpen()"
      [expenseToEdit]="expenseToEdit()"
      (close)="isModalOpen.set(false)"
    ></app-expense-form-modal>
  `
})
export class ExpensesComponent {
  readonly expenseService = inject(ExpenseService);
  readonly settingsService = inject(SettingsService);

  readonly isModalOpen = signal<boolean>(false);
  readonly expenseToEdit = signal<Expense | null>(null);
  readonly selectedIds = signal<string[]>([]);

  readonly categories: ExpenseCategory[] = [
    'Cloud & Infrastructure',
    'Software & SaaS',
    'Salaries & Contractors',
    'Marketing & Ads',
    'Office & Facilities',
    'Travel & Events',
    'Legal & Compliance',
    'Equipment & Hardware',
    'Other'
  ];

  constructor() {
    addIcons({ add, downloadOutline, trashOutline, createOutline, refreshOutline, funnelOutline });
  }

  async handleRefresh(event: any) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.expenseService.loadExpenses();
    setTimeout(() => {
      event.target.complete();
    }, 600);
  }

  getCategoryBadgeClass(category: any): string {
    const meta = CATEGORY_META[category as ExpenseCategory];
    return meta ? meta.bgColor : 'bg-slate-100 text-slate-700';
  }

  onFilterChange(partial: any) {
    this.expenseService.updateFilter(partial);
  }

  async openCreateModal() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.expenseToEdit.set(null);
    this.isModalOpen.set(true);
  }

  async openEditModal(exp: Expense) {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.expenseToEdit.set(exp);
    this.isModalOpen.set(true);
  }

  async deleteExpense(id: string) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    if (confirm('Are you sure you want to delete this expense record?')) {
      this.expenseService.deleteExpense(id);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  isAllSelected(): boolean {
    const list = this.expenseService.filteredExpenses();
    return list.length > 0 && list.every(e => this.selectedIds().includes(e.id));
  }

  toggleSelect(id: string) {
    this.selectedIds.update(current => 
      current.includes(id) ? current.filter(i => i !== id) : [...current, id]
    );
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedIds.set([]);
    } else {
      this.selectedIds.set(this.expenseService.filteredExpenses().map(e => e.id));
    }
  }

  async deleteSelected() {
    const ids = this.selectedIds();
    await Haptics.impact({ style: ImpactStyle.Heavy });
    if (confirm('Delete ' + ids.length + ' selected expense(s)?')) {
      this.expenseService.bulkDelete(ids);
      this.selectedIds.set([]);
    }
  }
}
