import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Categories</h1>
        <button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          + Add Category
        </button>
      </div>
      <div class="bg-white rounded-lg shadow p-12 text-center">
        <p class="text-gray-600">Category management coming soon...</p>
      </div>
    </div>
  `,
})
export class CategoryListComponent {}
