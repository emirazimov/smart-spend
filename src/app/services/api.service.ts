import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction } from '../transaction.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:8000/transactions';

  // Наш реактивный стейт через Сигналы
  transactions = signal<Transaction[]>([]);

  constructor(private http: HttpClient) {}

  loadAll() {
    this.http.get<Transaction[]>(this.apiUrl).subscribe(data => {
      this.transactions.set(data);
    });
  }

  add(amount: number, category_id: number, description: string) {
    return this.http.post<Transaction>(this.apiUrl, { amount, category_id, description })
      .subscribe(newTx => {
        // Мгновенно обновляем UI
        this.transactions.update(prev => [newTx, ...prev]);
      });
  }
}
