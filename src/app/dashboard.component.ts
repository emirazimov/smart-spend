import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Dashboard Component
 *
 * Displays comprehensive financial overview:
 * - Total balance
 * - Monthly spending
 * - Top categories breakdown
 * - Budget progress bars
 * - Recent transactions
 */

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors" (click)="transactionCreationModal()">
          + Add Transaction
        </button>
      </div>

      @if (showModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="closeModal()"></div>
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" (click)="$event.stopPropagation()">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              asdfasdf
            </h2>

            <form [formGroup]="transactionForm" (ngSubmit)="saveTransaction()" class="space-y-4">
              <!-- Amount -->
              <!-- <div>
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
              </div> -->

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

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="text-center py-12">
          <p class="text-gray-600">Loading...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {{ error() }}
        </div>
      }

      <!-- Dashboard Cards -->
      @if (dashboardData(); as data) {
        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Balance Card -->
          <div class="bg-white rounded-lg shadow p-6">
            <p class="text-sm text-gray-600 mb-2">Total Balance</p>
            <h3 class="text-2xl font-bold text-primary-600">
              {{ formatCurrency(data.total_balance, data.currency) }}
            </h3>
            <p class="text-xs text-gray-500 mt-2">{{ data.currency }}</p>
          </div>

          <!-- Monthly Spending Card -->
          <div class="bg-white rounded-lg shadow p-6">
            <p class="text-sm text-gray-600 mb-2">Monthly Spending</p>
            <h3 class="text-2xl font-bold text-red-600">
              {{ formatCurrency(data.monthly_spending, data.currency) }}
            </h3>
            <p class="text-xs text-gray-500 mt-2">This month</p>
          </div>

          <!-- Total Transactions Card -->
          <div class="bg-white rounded-lg shadow p-6">
            <p class="text-sm text-gray-600 mb-2">Transactions</p>
            <h3 class="text-2xl font-bold text-blue-600">{{ data.total_transactions }}</h3>
            <p class="text-xs text-gray-500 mt-2">All time</p>
          </div>

          <!-- Budgets Card -->
          <div class="bg-white rounded-lg shadow p-6">
            <p class="text-sm text-gray-600 mb-2">Active Budgets</p>
            <h3 class="text-2xl font-bold text-purple-600">{{ data.budgets_count }}</h3>
            <p class="text-xs text-gray-500 mt-2">Budget limits set</p>
          </div>
        </div>

        <!-- Top Categories Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Categories List -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Top Categories</h2>
            @if (data.top_categories && data.top_categories.length > 0) {
              <div class="space-y-4">
                @for (category of data.top_categories; track category.name) {
                  <div>
                    <div class="flex justify-between mb-2">
                      <span class="text-sm font-medium text-gray-700">{{ category.name }}</span>
                      <span class="text-sm font-bold text-gray-900">
                        {{ formatCurrency(category.amount, data.currency) }}
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-primary-600 h-2 rounded-full transition-all"
                        [style.width.%]="category.percentage">
                      </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">{{ category.percentage }}% of monthly</p>
                  </div>
                }
              </div>
            } @else {
              <p class="text-gray-500 text-center py-8">No categories yet</p>
            }
          </div>

          <!-- Summary Stats -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Summary</h2>
            <div class="space-y-4">
              <div class="flex justify-between items-center pb-4 border-b">
                <span class="text-gray-700">Categories</span>
                <span class="text-2xl font-bold text-gray-900">{{ data.categories_count }}</span>
              </div>
              <div class="flex justify-between items-center pb-4 border-b">
                <span class="text-gray-700">Budget Limits</span>
                <span class="text-2xl font-bold text-gray-900">{{ data.budgets_count }}</span>
              </div>
              <div class="flex justify-between items-center pb-4 border-b">
                <span class="text-gray-700">Avg. Transaction</span>
                <span class="text-2xl font-bold text-gray-900">
                  {{ data.total_transactions > 0 ?
                    formatCurrency(data.total_balance / data.total_transactions, data.currency) :
                    formatCurrency(0, data.currency) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-700">Spending Rate</span>
                <span class="text-2xl font-bold text-red-600">
                  {{ data.total_transactions > 0 ?
                    ((data.monthly_spending / data.total_balance) * 100).toFixed(1) :
                    '0' }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
          @if ((recentTransactions() || []).length > 0) {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-2 px-4 text-gray-700">Description</th>
                    <th class="text-left py-2 px-4 text-gray-700">Category</th>
                    <th class="text-left py-2 px-4 text-gray-700">Amount</th>
                    <th class="text-left py-2 px-4 text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tx of (recentTransactions() || []); track tx.id) {
                    <tr class="border-b hover:bg-gray-50 transition-colors" [class.bg-red-50]="tx.is_anomaly">
                      <td class="py-3 px-4">{{ tx.description || 'N/A' }}</td>
                      <td class="py-3 px-4">{{ tx.category_id }}</td>
                      <td class="py-3 px-4 font-bold">{{ formatCurrency(tx.amount, tx.currency) }}</td>
                      <td class="py-3 px-4 text-gray-500">{{ tx.transaction_date }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="text-gray-500 text-center py-8">No transactions yet</p>
          }
        </div>
      }
    </div>
  `,
  styles: [],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  // Reactive state from service
  dashboardData = computed(() => this.apiService.dashboardSummary());
  isLoading = computed(() => this.apiService.isLoading());
  error = computed(() => this.apiService.error());

  showModal = signal(false);

  recentTransactions = computed(() => {
    const txs = this.apiService.transactions();
    return txs.slice(0, 5); // Get first 5
  });

transactionCreationModal() {
    // Placeholder for transaction creation logic
    alert('Open transaction creation modal');
    this.showModal.set(true);
  }

closeModal() {
    this.showModal.set(false);
  }

  ngOnInit() {
    this.apiService.getDashboardSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    this.apiService.getBudgets()
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    this.apiService.getTransactions(undefined, undefined, undefined, undefined, 0, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
