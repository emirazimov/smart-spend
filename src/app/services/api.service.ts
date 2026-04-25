import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * API Service
 *
 * Centralized HTTP client for all backend API calls
 * Uses Signals for reactive state management
 * Integrates with RxJS for advanced stream processing
 */

export interface User {
  id: number;
  email: string;
  username: string;
  currency: string;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  parent_id?: number | null;
  icon: string;
  color: string;
  created_at: string;
  updated_at?: string;
  children?: Category[];
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  category_id: number;
  description?: string;
  raw_text?: string;
  location?: string;
  is_anomaly: boolean;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  limit: number;
  period: string;
  created_at: string;
  updated_at?: string;
}

export interface DashboardSummary {
  total_balance: number;
  currency: string;
  total_transactions: number;
  monthly_spending: number;
  categories_count: number;
  budgets_count: number;
  top_categories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:8000';
  private currentUserId = signal<number | null>(null);

  // Reactive state using Signals
  transactions = signal<Transaction[]>([]);
  categories = signal<Category[]>([]);
  budgets = signal<Budget[]>([]);
  dashboardSummary = signal<DashboardSummary | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {
    // Load user ID from localStorage if available
    const stored = localStorage.getItem('userId');
    if (stored) {
      this.currentUserId.set(parseInt(stored, 10));
    }
  }

  setUserId(userId: number) {
    this.currentUserId.set(userId);
    localStorage.setItem('userId', userId.toString());
  }

  getUserId(): number {
    const id = this.currentUserId();
    if (!id) {
      throw new Error('User ID not set. Please login first.');
    }
    return id;
  }

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  createUser(email: string, username: string, password: string, currency: string = 'USD'): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, {
      email,
      username,
      password,
      currency,
    });
  }

  getUser(userId: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${userId}`);
  }

  // ============================================================================
  // CATEGORY ENDPOINTS
  // ============================================================================

  createCategory(name: string, parentId?: number | null, icon: string = '📁', color: string = '#808080'): Observable<Category> {
    const userId = this.getUserId();
    return this.http
      .post<Category>(`${this.baseUrl}/users/${userId}/categories`, {
        name,
        parent_id: parentId,
        icon,
        color,
      })
      .pipe(
        tap((newCategory) => {
          this.categories.update((prev) => [newCategory, ...prev]);
          this.error.set(null);
        })
      );
  }

  getCategories(): Observable<Category[]> {
    const userId = this.getUserId();
    this.isLoading.set(true);
    return this.http.get<Category[]>(`${this.baseUrl}/users/${userId}/categories`).pipe(
      tap((data) => {
        this.categories.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      })
    );
  }

  getCategoriesFlat(): Observable<Category[]> {
    const userId = this.getUserId();
    return this.http.get<Category[]>(`${this.baseUrl}/users/${userId}/categories/flat`).pipe(
      tap((data) => {
        this.categories.set(data);
        this.error.set(null);
      })
    );
  }

  updateCategory(categoryId: number, name: string, icon: string, color: string): Observable<Category> {
    const userId = this.getUserId();
    return this.http
      .put<Category>(`${this.baseUrl}/users/${userId}/categories/${categoryId}`, {
        name,
        icon,
        color,
      })
      .pipe(
        tap((updated) => {
          this.categories.update((prev) =>
            prev.map((cat) => (cat.id === categoryId ? updated : cat))
          );
          this.error.set(null);
        })
      );
  }

  deleteCategory(categoryId: number): Observable<void> {
    const userId = this.getUserId();
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}/categories/${categoryId}`).pipe(
      tap(() => {
        this.categories.update((prev) => prev.filter((cat) => cat.id !== categoryId));
        this.error.set(null);
      })
    );
  }

  // ============================================================================
  // TRANSACTION ENDPOINTS
  // ============================================================================

  createTransaction(
    amount: number,
    categoryId: number,
    description?: string,
    location?: string,
    transactionDate?: string
  ): Observable<Transaction> {
    const userId = this.getUserId();
    return this.http
      .post<Transaction>(`${this.baseUrl}/users/${userId}/transactions`, {
        amount,
        currency: 'USD',
        category_id: categoryId,
        description,
        location,
        transaction_date: transactionDate,
      })
      .pipe(
        tap((newTransaction) => {
          this.transactions.update((prev) => [newTransaction, ...prev]);
          this.error.set(null);
        })
      );
  }

  getTransactions(
    categoryId?: number,
    startDate?: string,
    endDate?: string,
    isAnomaly?: boolean,
    skip: number = 0,
    limit: number = 20
  ): Observable<Transaction[]> {
    const userId = this.getUserId();
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (categoryId !== undefined) {
      params = params.set('category_id', categoryId.toString());
    }
    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }
    if (isAnomaly !== undefined) {
      params = params.set('is_anomaly', isAnomaly.toString());
    }

    this.isLoading.set(true);
    return this.http.get<Transaction[]>(`${this.baseUrl}/users/${userId}/transactions`, { params }).pipe(
      tap((data) => {
        this.transactions.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      })
    );
  }

  getTransaction(transactionId: number): Observable<Transaction> {
    const userId = this.getUserId();
    return this.http.get<Transaction>(`${this.baseUrl}/users/${userId}/transactions/${transactionId}`);
  }

  updateTransaction(
    transactionId: number,
    amount?: number,
    categoryId?: number,
    description?: string,
    location?: string,
    transactionDate?: string
  ): Observable<Transaction> {
    const userId = this.getUserId();
    const body: any = {};
    if (amount !== undefined) body.amount = amount;
    if (categoryId !== undefined) body.category_id = categoryId;
    if (description !== undefined) body.description = description;
    if (location !== undefined) body.location = location;
    if (transactionDate !== undefined) body.transaction_date = transactionDate;

    return this.http
      .put<Transaction>(`${this.baseUrl}/users/${userId}/transactions/${transactionId}`, body)
      .pipe(
        tap((updated) => {
          this.transactions.update((prev) =>
            prev.map((tx) => (tx.id === transactionId ? updated : tx))
          );
          this.error.set(null);
        })
      );
  }

  deleteTransaction(transactionId: number): Observable<void> {
    const userId = this.getUserId();
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}/transactions/${transactionId}`).pipe(
      tap(() => {
        this.transactions.update((prev) => prev.filter((tx) => tx.id !== transactionId));
        this.error.set(null);
      })
    );
  }

  // ============================================================================
  // BUDGET ENDPOINTS
  // ============================================================================

  createBudget(categoryId: number, limit: number, period: string = 'monthly'): Observable<Budget> {
    const userId = this.getUserId();
    return this.http
      .post<Budget>(`${this.baseUrl}/users/${userId}/budgets`, {
        category_id: categoryId,
        limit,
        period,
      })
      .pipe(
        tap((newBudget) => {
          this.budgets.update((prev) => [newBudget, ...prev]);
          this.error.set(null);
        })
      );
  }

  getBudgets(): Observable<Budget[]> {
    const userId = this.getUserId();
    this.isLoading.set(true);
    return this.http.get<Budget[]>(`${this.baseUrl}/users/${userId}/budgets`).pipe(
      tap((data) => {
        this.budgets.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      })
    );
  }

  updateBudget(budgetId: number, limit: number, period: string): Observable<Budget> {
    const userId = this.getUserId();
    return this.http
      .put<Budget>(`${this.baseUrl}/users/${userId}/budgets/${budgetId}`, {
        category_id: 0,
        limit,
        period,
      })
      .pipe(
        tap((updated) => {
          this.budgets.update((prev) =>
            prev.map((bgt) => (bgt.id === budgetId ? updated : bgt))
          );
          this.error.set(null);
        })
      );
  }

  deleteBudget(budgetId: number): Observable<void> {
    const userId = this.getUserId();
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}/budgets/${budgetId}`).pipe(
      tap(() => {
        this.budgets.update((prev) => prev.filter((bgt) => bgt.id !== budgetId));
        this.error.set(null);
      })
    );
  }

  // ============================================================================
  // DASHBOARD ENDPOINTS
  // ============================================================================

  getDashboardSummary(): Observable<DashboardSummary> {
    const userId = this.getUserId();
    this.isLoading.set(true);
    return this.http.get<DashboardSummary>(`${this.baseUrl}/users/${userId}/dashboard/summary`).pipe(
      tap((data) => {
        this.dashboardSummary.set(data);
        this.isLoading.set(false);
        this.error.set(null);
      })
    );
  }

  getMonthlyBreakdown(year: number, month: number): Observable<any> {
    const userId = this.getUserId();
    return this.http.get(`${this.baseUrl}/users/${userId}/dashboard/monthly-breakdown`, {
      params: { year: year.toString(), month: month.toString() },
    });
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  getHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }
}

