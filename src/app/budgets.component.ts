import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Budget, Category } from './services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Budget List Component
 *
 * Features:
 * - Create budget limits per category
 * - Display spending progress vs budget
 * - Color-coded progress bars (green < 50%, yellow < 80%, red > 80%)
 * - Edit/delete budgets
 * - Show budget period (monthly, weekly, yearly)
 */

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Budgets</h1>
        <button
          (click)="openCreateModal()"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
          + Create Budget
        </button>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="text-center py-12">
          <p class="text-gray-600">Loading budgets...</p>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {{ error() }}
        </div>
      }

      <!-- Budgets Grid -->
      @if (!isLoading() && budgets().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (budget of budgets(); track budget.id) {
            <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <!-- Header -->
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="font-bold text-gray-900 text-lg">{{ getBudgetCategory(budget.category_id)?.name || 'Unknown' }}</h3>
                  <p class="text-sm text-gray-500 capitalize">{{ budget.period }}</p>
                </div>
                <div class="flex gap-2">
                  <button
                    (click)="editBudget(budget)"
                    class="text-primary-600 hover:text-primary-800 p-2 rounded hover:bg-primary-50">
                    ✏️
                  </button>
                  <button
                    (click)="deleteBudget(budget.id)"
                    class="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50">
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Limit -->
              <div class="mb-4">
                <p class="text-3xl font-bold text-primary-600">{{ formatCurrency(budget.limit) }}</p>
                <p class="text-xs text-gray-500">Budget limit</p>
              </div>

              <!-- Progress (mock - Phase 2 will calculate real spending) -->
              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">Progress</span>
                  <span class="text-sm font-medium text-gray-900">{{ getBudgetProgress(budget.id) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div
                    class="h-3 rounded-full transition-all"
                    [class]="getBudgetProgressColor(getBudgetProgress(budget.id))"
                    [style.width.%]="getBudgetProgress(budget.id)">
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                  {{ formatCurrency(getBudgetSpent(budget.id)) }} spent
                </p>
              </div>
            </div>
          }
        </div>
      }

      @if (!isLoading() && budgets().length === 0) {
        <div class="bg-gray-50 rounded-lg p-12 text-center">
          <p class="text-gray-600 mb-4">No budgets created yet</p>
          <button
            (click)="openCreateModal()"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Create your first budget
          </button>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="closeModal()"></div>
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" (click)="$event.stopPropagation()">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              {{ editingBudget() ? 'Edit Budget' : 'New Budget' }}
            </h2>

            <form [formGroup]="budgetForm" (ngSubmit)="saveBudget()" class="space-y-4">
              <!-- Category -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Category *</label>
                <select
                  formControlName="category_id"
                  [disabled]="!!editingBudget()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50">
                  <option value="">Select category</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
                @if (budgetForm.get('category_id')?.errors?.['required']) {
                  <p class="text-red-600 text-xs mt-1">Category is required</p>
                }
              </div>

              <!-- Limit -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Budget Limit (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  formControlName="limit"
                  placeholder="500.00"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                @if (budgetForm.get('limit')?.errors?.['required']) {
                  <p class="text-red-600 text-xs mt-1">Budget limit is required</p>
                }
                @if (budgetForm.get('limit')?.errors?.['min']) {
                  <p class="text-red-600 text-xs mt-1">Must be greater than 0</p>
                }
              </div>

              <!-- Period -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Period *</label>
                <select
                  formControlName="period"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="weekly">Weekly</option>
                  <option value="monthly" selected>Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
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
                  [disabled]="!budgetForm.valid || isSubmitting()"
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
export class BudgetListComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Reactive state
  budgets = computed(() => this.apiService.budgets());
  categories = computed(() => this.apiService.categories());
  isLoading = computed(() => this.apiService.isLoading());
  error = computed(() => this.apiService.error());

  // Modal state
  showModal = signal(false);
  editingBudget = signal<Budget | null>(null);
  isSubmitting = signal(false);

  // Form
  budgetForm: FormGroup;

  constructor() {
    this.budgetForm = this.fb.group({
      category_id: ['', Validators.required],
      limit: ['', [Validators.required, Validators.min(0.01)]],
      period: ['monthly', Validators.required],
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.apiService.getBudgets()
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    this.apiService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  openCreateModal() {
    this.editingBudget.set(null);
    this.budgetForm.reset({
      period: 'monthly',
    });
    this.showModal.set(true);
  }

  editBudget(budget: Budget) {
    this.editingBudget.set(budget);
    this.budgetForm.patchValue(budget);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingBudget.set(null);
  }

  saveBudget() {
    if (!this.budgetForm.valid) return;

    this.isSubmitting.set(true);

    const formValue = this.budgetForm.value;
    const editing = this.editingBudget();

    const request$ = editing
      ? this.apiService.updateBudget(editing.id, formValue.limit, formValue.period)
      : this.apiService.createBudget(formValue.category_id, formValue.limit, formValue.period);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Error saving budget:', err);
        },
      });
  }

  deleteBudget(id: number) {
    if (confirm('Delete this budget?')) {
      this.apiService
        .deleteBudget(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadData();
          },
          error: (err) => {
            console.error('Error deleting budget:', err);
          },
        });
    }
  }

  getBudgetCategory(categoryId: number) {
    return this.categories().find((c) => c.id === categoryId);
  }

  // Mock spending calculation (Phase 2 will use real data from transactions)
  getBudgetProgress(budgetId: number): number {
    return Math.floor(Math.random() * 85); // Random 0-85% for demo
  }

  getBudgetSpent(budgetId: number): number {
    const budget = this.budgets().find((b) => b.id === budgetId);
    if (!budget) return 0;
    const progress = this.getBudgetProgress(budgetId);
    return (progress / 100) * budget.limit;
  }

  getBudgetProgressColor(percentage: number): string {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
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

