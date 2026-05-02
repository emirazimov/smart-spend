import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Transaction, Category } from './services/api.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

/**
 * Transaction List Component
 *
 * Features:
 * - List all transactions with pagination
 * - Create new transaction via modal
 * - Edit existing transaction
 * - Delete transaction
 * - Filter by category, date range, anomaly flag
 * - Search by description
 * - Display anomalies with red highlight
 *
 * Uses:
 * - Signals for reactive state
 * - RxJS debounceTime for search
 * - Form validation with Reactive Forms
 */

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          (click)="openCreateModal()"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
          + Add Transaction
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search by description -->
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Search</label>
            <input
              type="text"
              [formControl]="searchControl"
              placeholder="Search description..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          </div>

          <!-- Category filter -->
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Category</label>
            <select
              [(ngModel)]="filterCategory"
              (ngModelChange)="applyFilters()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="">All Categories</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Date range -->
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">From</label>
            <input
              type="date"
              [(ngModel)]="filterStartDate"
              (ngModelChange)="applyFilters()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">To</label>
            <input
              type="date"
              [(ngModel)]="filterEndDate"
              (ngModelChange)="applyFilters()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          </div>
        </div>

        <!-- Anomaly filter -->
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="showAnomaliesOnly"
              (ngModelChange)="applyFilters()"
              class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500">
            <span class="text-sm text-gray-700">Show Anomalies Only</span>
          </label>
          <button
            (click)="clearFilters()"
            class="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Loading/Error states -->
      @if (isLoading()) {
        <div class="text-center py-12">
          <p class="text-gray-600">Loading transactions...</p>
        </div>
      }
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {{ error() }}
        </div>
      }

      <!-- Transactions table -->
      @if (!isLoading() && transactions().length > 0) {
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700">Status</th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (tx of transactions(); track tx.id) {
                <tr
                  class="border-b hover:bg-gray-50 transition-colors"
                  [class.bg-red-50]="tx.is_anomaly">
                  <td class="px-6 py-4 text-sm text-gray-900">{{ tx.transaction_date }}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ tx.description || 'N/A' }}
                    @if (tx.location) {
                      <div class="text-xs text-gray-500">📍 {{ tx.location }}</div>
                    }
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ getCategoryName(tx.category_id) }}</td>
                  <td class="px-6 py-4 text-sm font-bold text-right">
                    {{ formatCurrency(tx.amount, tx.currency) }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    @if (tx.is_anomaly) {
                      <span class="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        ⚠️ Anomaly
                      </span>
                    } @else {
                      <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ✓ Normal
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4 text-center">
                    <button
                      (click)="editTransaction(tx)"
                      class="text-primary-600 hover:text-primary-800 text-sm font-medium mr-3">
                      Edit
                    </button>
                    <button
                      (click)="deleteTransaction(tx.id)"
                      class="text-red-600 hover:text-red-800 text-sm font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-600">
            Showing {{ currentPage() * pageSize + 1 }} - {{ (currentPage() + 1) * pageSize }}
          </p>
          <div class="flex gap-2">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 0"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300">
              ← Previous
            </button>
            <span class="px-4 py-2 text-gray-700">Page {{ currentPage() + 1 }}</span>
            <button
              (click)="nextPage()"
              [disabled]="transactions().length < pageSize"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300">
              Next →
            </button>
          </div>
        </div>
      }

      @if (!isLoading() && transactions().length === 0) {
        <div class="bg-gray-50 rounded-lg p-12 text-center">
          <p class="text-gray-600 mb-4">No transactions found</p>
          <button
            (click)="openCreateModal()"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Create your first transaction
          </button>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="closeModal()"></div>
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" (click)="$event.stopPropagation()">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              {{ editingTransaction() ? 'Edit Transaction' : 'New Transaction' }}
            </h2>

            <form [formGroup]="transactionForm" (ngSubmit)="saveTransaction()" class="space-y-4">
              <!-- Amount -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  formControlName="amount"
                  placeholder="0.00"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                @if (transactionForm.get('amount')?.errors?.['required']) {
                  <p class="text-red-600 text-xs mt-1">Amount is required</p>
                }
              </div>

              <!-- Category -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Category *</label>
                <select
                  formControlName="category_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="">Select category</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
                @if (transactionForm.get('category_id')?.errors?.['required']) {
                  <p class="text-red-600 text-xs mt-1">Category is required</p>
                }
              </div>

              <!-- Description -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <input
                  type="text"
                  formControlName="description"
                  placeholder="What was this for?"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              </div>

              <!-- Location -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Location</label>
                <input
                  type="text"
                  formControlName="location"
                  placeholder="Where did you spend?"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              </div>

              <!-- Date -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Date *</label>
                <input
                  type="date"
                  formControlName="transaction_date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              </div>

              <!-- Buttons -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!transactionForm.valid || isSubmitting()"
                  class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50">
                  {{ isSubmitting() ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class TransactionListComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Form control for search
  searchControl = this.fb.control('');

  // Reactive state
  transactions = computed(() => this.apiService.transactions());
  categories = computed(() => this.apiService.categories());
  isLoading = computed(() => this.apiService.isLoading());
  error = computed(() => this.apiService.error());

  // Modal state
  showModal = signal(false);
  editingTransaction = signal<Transaction | null>(null);
  isSubmitting = signal(false);

  // Form
  transactionForm: FormGroup;

  // Filters
  filterCategory: number | string = '';
  filterStartDate = '';
  filterEndDate = '';
  showAnomaliesOnly = false;

  // Pagination
  currentPage = signal(0);
  pageSize = 20;

  constructor() {
    this.transactionForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category_id: ['', Validators.required],
      description: [''],
      location: [''],
      transaction_date: [new Date().toISOString().split('T')[0], Validators.required],
    });
  }

  ngOnInit() {
    // Load categories
    this.apiService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Error loading categories:', err);
        }
      });

    // Load transactions
    this.loadTransactions();

    // Search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          // For now, filter client-side
          this.loadTransactions();
          return [];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTransactions() {
    this.currentPage.set(0);
    this.apiService
      .getTransactions(
        this.filterCategory ? (this.filterCategory as number) : undefined,
        this.filterStartDate || undefined,
        this.filterEndDate || undefined,
        this.showAnomaliesOnly ? true : undefined,
        0,
        this.pageSize
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Error loading transactions:', err);
        }
      });
  }

  applyFilters() {
    this.loadTransactions();
  }

  clearFilters() {
    this.filterCategory = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.showAnomaliesOnly = false;
    this.searchControl.setValue('');
    this.loadTransactions();
  }

  openCreateModal() {
    this.editingTransaction.set(null);
    this.transactionForm.reset({
      transaction_date: new Date().toISOString().split('T')[0],
    });
    this.showModal.set(true);
  }

  editTransaction(tx: Transaction) {
    this.editingTransaction.set(tx);
    this.transactionForm.patchValue(tx);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingTransaction.set(null);
  }

  saveTransaction() {
    if (!this.transactionForm.valid) return;

    this.isSubmitting.set(true);

    const formValue = this.transactionForm.value;
    const editing = this.editingTransaction();

    const request$ = editing
      ? this.apiService.updateTransaction(editing.id, formValue.amount, formValue.category_id, formValue.description, formValue.location, formValue.transaction_date)
      : this.apiService.createTransaction(formValue.amount, formValue.category_id, formValue.description, formValue.location, formValue.transaction_date);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadTransactions();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const errorMsg = err.error?.detail || err.message || 'Failed to save transaction';
          console.error('Error saving transaction:', err);
          alert(errorMsg);
        },
      });
  }

  deleteTransaction(id: number) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.apiService
        .deleteTransaction(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadTransactions();
          },
          error: (err) => {
            const errorMsg = err.error?.detail || err.message || 'Failed to delete transaction';
            console.error('Error deleting transaction:', err);
            alert(errorMsg);
          },
        });
    }
  }

  previousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.apiService
        .getTransactions(
          this.filterCategory ? (this.filterCategory as number) : undefined,
          this.filterStartDate || undefined,
          this.filterEndDate || undefined,
          this.showAnomaliesOnly ? true : undefined,
          this.currentPage() * this.pageSize,
          this.pageSize
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => {
            console.error('Error loading previous page:', err);
          }
        });
    }
  }

  nextPage() {
    this.currentPage.update((p) => p + 1);
    this.apiService
      .getTransactions(
        this.filterCategory ? (this.filterCategory as number) : undefined,
        this.filterStartDate || undefined,
        this.filterEndDate || undefined,
        this.showAnomaliesOnly ? true : undefined,
        this.currentPage() * this.pageSize,
        this.pageSize
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Error loading next page:', err);
        }
      });
  }

  getCategoryName(categoryId: number): string {
    const cat = this.categories().find((c) => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    const symbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      KGS: 'с',
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

