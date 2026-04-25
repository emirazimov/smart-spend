import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Transactions</h1>
        <button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          + Add Transaction
        </button>
      </div>
      <div class="bg-white rounded-lg shadow p-12 text-center">
        <p class="text-gray-600">Transaction management coming soon...</p>
      </div>
    </div>
  `,
})
export class TransactionListComponent {}
