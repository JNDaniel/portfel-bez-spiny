import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import {
  CreateExpenseDto,
  Expense,
  ExpenseCategory,
  PaymentMethod,
} from '../../../core/models/expense.model';
import { ExpenseService } from '../../../core/services/expense.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-expense-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="isEditing() ? 'Edit Expense' : 'Create New Expense'"
      size="lg"
      (closed)="closed.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Title & Vendor -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="expense-form-title"
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Expense Title *</label
            >
            <input
              id="expense-form-title"
              type="text"
              formControlName="title"
              placeholder="e.g. AWS Cloud Infrastructure - August"
              class="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
            @if (form.get('title')?.touched && form.get('title')?.invalid) {
              <p class="text-[11px] text-rose-500 mt-1">Title is required.</p>
            }
          </div>

          <div>
            <label
              for="expense-form-vendor"
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Vendor / Provider *</label
            >
            <input
              id="expense-form-vendor"
              type="text"
              formControlName="vendor"
              placeholder="e.g. Amazon Web Services EMEA"
              class="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
            @if (form.get('vendor')?.touched && form.get('vendor')?.invalid) {
              <p class="text-[11px] text-rose-500 mt-1">Vendor is required.</p>
            }
          </div>
        </div>

        <!-- Amount, Currency, Date -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              for="expense-form-amount"
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Amount ({{ settingsService.currency() }}) *</label
            >
            <div class="relative">
              <span
                class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-semibold text-sm"
                >{{ settingsService.currencySymbol() }}</span
              >
              <input
                id="expense-form-amount"
                type="number"
                step="0.01"
                min="0.01"
                formControlName="amount"
                placeholder="0.00"
                class="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
              />
            </div>
            @if (form.get('amount')?.touched && form.get('amount')?.invalid) {
              <p class="text-[11px] text-rose-500 mt-1">Valid amount (>0) is required.</p>
            }
          </div>

          <div>
            <label
              for="expense-form-category"
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Category *</label
            >
            <select
              id="expense-form-category"
              formControlName="category"
              class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            >
              @for (cat of categories; track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>

          <div>
            <label
              for="expense-form-date"
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Date *</label
            >
            <input
              id="expense-form-date"
              type="date"
              formControlName="date"
              class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
          </div>
        </div>

        <!-- Payment Method, Status, Department -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              for="expense-form-payment-method"
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Payment Method</label
            >
            <select
              id="expense-form-payment-method"
              formControlName="paymentMethod"
              class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            >
              @for (method of paymentMethods; track method) {
                <option [value]="method">{{ method }}</option>
              }
            </select>
          </div>

          <div>
            <label
              for="expense-form-status"
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Status</label
            >
            <select
              id="expense-form-status"
              formControlName="status"
              class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            >
              <option value="cleared">Cleared</option>
              <option value="pending">Pending Approval</option>
              <option value="recurring">Recurring Monthly</option>
            </select>
          </div>

          <div>
            <label
              for="expense-form-department"
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Department</label
            >
            <input
              id="expense-form-department"
              type="text"
              formControlName="department"
              placeholder="e.g. Engineering, Marketing"
              class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
          </div>
        </div>

        <!-- Tags -->
        <div>
          <label
            for="expense-form-tags-input"
            class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >Tags (comma-separated)</label
          >
          <input
            id="expense-form-tags-input"
            type="text"
            formControlName="tagsInput"
            placeholder="e.g. AWS, Production, DevTools"
            class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            for="expense-form-description"
            class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >Description / Notes</label
          >
          <textarea
            id="expense-form-description"
            formControlName="description"
            rows="2"
            placeholder="Optional detailed context or justification..."
            class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
          ></textarea>
        </div>

        <!-- Footer Actions -->
        <div
          class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="form.invalid || expenseService.loading()"
            class="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white shadow-md shadow-brand-500/20 transition flex items-center gap-2"
          >
            @if (expenseService.loading()) {
              <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  fill="none"
                ></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            }
            <span>{{ isEditing() ? 'Save Changes' : 'Create Expense' }}</span>
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class ExpenseFormModalComponent {
  private readonly fb = inject(FormBuilder);
  readonly expenseService = inject(ExpenseService);
  readonly settingsService = inject(SettingsService);

  readonly isOpen = input.required<boolean>();
  readonly expenseToEdit = input<Expense | null>(null);

  readonly closed = output<void>();
  readonly saved = output<Expense>();

  readonly categories: ExpenseCategory[] = [
    'Cloud & Infrastructure',
    'Software & SaaS',
    'Salaries & Contractors',
    'Marketing & Ads',
    'Office & Facilities',
    'Travel & Events',
    'Legal & Compliance',
    'Equipment & Hardware',
    'Other',
  ];

  readonly paymentMethods: PaymentMethod[] = [
    'Corporate Card',
    'Bank Transfer',
    'PayPal',
    'Direct Debit',
    'Cash',
  ];

  readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    vendor: ['', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    category: ['Cloud & Infrastructure', Validators.required],
    date: [new Date().toISOString().substring(0, 10), Validators.required],
    paymentMethod: ['Corporate Card', Validators.required],
    status: ['cleared', Validators.required],
    department: [''],
    tagsInput: [''],
    description: [''],
  });

  readonly isEditing = computed(() => !!this.expenseToEdit());

  constructor() {
    effect(() => {
      const exp = this.expenseToEdit();
      if (exp) {
        this.form.patchValue({
          title: exp.title,
          vendor: exp.vendor,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          paymentMethod: exp.paymentMethod,
          status: exp.status,
          department: exp.department || '',
          tagsInput: exp.tags.join(', '),
          description: exp.description || '',
        });
      } else {
        this.form.reset({
          category: 'Cloud & Infrastructure',
          date: new Date().toISOString().substring(0, 10),
          paymentMethod: 'Corporate Card',
          status: 'cleared',
          department: '',
          tagsInput: '',
          description: '',
        });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    const v = this.form.value;
    const tags = v.tagsInput
      ? v.tagsInput
          .split(',')
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0)
      : [];

    const dto: CreateExpenseDto = {
      title: v.title,
      vendor: v.vendor,
      amount: Number(v.amount),
      currency: this.settingsService.currency(),
      category: v.category,
      date: v.date,
      paymentMethod: v.paymentMethod,
      status: v.status,
      department: v.department || undefined,
      tags,
      description: v.description || undefined,
    };

    const exp = this.expenseToEdit();
    if (exp) {
      this.expenseService.updateExpense(exp.id, dto, (updated) => {
        this.saved.emit(updated);
        this.closed.emit();
      });
    } else {
      this.expenseService.createExpense(dto, (created) => {
        this.saved.emit(created);
        this.closed.emit();
      });
    }
  }
}
