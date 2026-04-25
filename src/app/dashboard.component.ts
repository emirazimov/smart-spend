import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
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
        <button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          + Add Transaction
        </button>
      </div>

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
            @if (data.top_categories.length > 0) {
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
            } @empty {
              <p class="text-gray-500 text-center py-8">No transactions yet</p>
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
          } @empty {
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

  recentTransactions = computed(() => {
    const txs = this.apiService.transactions();
    return txs.slice(0, 5); // Get first 5
  });

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
