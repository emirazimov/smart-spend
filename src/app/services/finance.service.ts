import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);
  // Наш реактивный стейт
  transactions = signal<any[]>([]);

  loadHistory() {
    this.http.get<any[]>('http://localhost:8000/history')
      .subscribe(data => this.transactions.set(data));
  }

  sendText(text: string) {
    this.http.post('http://localhost:8000/process', { text })
      .subscribe(() => this.loadHistory());
  }
}
