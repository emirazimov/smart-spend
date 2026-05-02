import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Category } from './services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Category List Component
 *
 * Features:
 * - Display hierarchical category tree
 * - Expand/collapse categories
 * - Create new category
 * - Edit category (name, icon, color)
 * - Delete category (cascade)
 * - Parent-child relationships
 */

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Categories</h1>
        <button
          (click)="openCreateModal()"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
          + Add Category
        </button>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="text-center py-12">
          <p class="text-gray-600">Loading categories...</p>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {{ error() }}
        </div>
      }

      <!-- Categories Tree -->
      @if (!isLoading() && categories().length > 0) {
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="divide-y">
            @for (category of categories(); track category.id) {
              <div class="p-4 hover:bg-gray-50 transition-colors">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 flex-1">
                    <span class="text-2xl">{{ category.icon }}</span>
                    <div>
                      <p class="font-medium text-gray-900">{{ category.name }}</p>
                      @if (category.color) {
                        <div
                          class="w-6 h-6 rounded mt-1 border-2 border-gray-300"
                          [style.backgroundColor]="category.color">
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex gap-2">
                    <button
                      (click)="editCategory(category)"
                      class="text-primary-600 hover:text-primary-800 text-sm font-medium px-3 py-1 rounded hover:bg-primary-50">
                      Edit
                    </button>
                    <button
                      (click)="deleteCategory(category.id)"
                      class="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>

                <!-- Show nested categories indicator -->
                @if (category.children && category.children.length > 0) {
                  <div class="ml-12 mt-3 text-xs text-gray-500">
                    {{ category.children.length }} subcategories
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (!isLoading() && categories().length === 0) {
        <div class="bg-gray-50 rounded-lg p-12 text-center">
          <p class="text-gray-600 mb-4">No categories yet</p>
          <button
            (click)="openCreateModal()"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Create your first category
          </button>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="closeModal()"></div>
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" (click)="$event.stopPropagation()">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              {{ editingCategory() ? 'Edit Category' : 'New Category' }}
            </h2>

            <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()" class="space-y-4">
              <!-- Name -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Name *</label>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="e.g., Food, Transportation"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                @if (categoryForm.get('name')?.errors?.['required']) {
                  <p class="text-red-600 text-xs mt-1">Name is required</p>
                }
              </div>

              <!-- Parent Category -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Parent Category (optional)</label>
                <select
                  formControlName="parent_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option [value]="null">None (Root Category)</option>
                  @for (cat of categories(); track cat.id) {
                    @if (!editingCategory() || editingCategory()!.id !== cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  }
                </select>
              </div>

              <!-- Icon -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Icon (Emoji)</label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    formControlName="icon"
                    maxlength="2"
                    placeholder="🍔"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-2xl">
                  <div class="text-4xl flex items-center justify-center">{{ categoryForm.get('icon')?.value || '📁' }}</div>
                </div>
              </div>

              <!-- Color -->
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Color</label>
                <div class="flex gap-2">
                  <input
                    type="color"
                    formControlName="color"
                    class="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer">
                  <input
                    type="text"
                    formControlName="color"
                    placeholder="#808080"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm">
                </div>
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
                  [disabled]="!categoryForm.valid || isSubmitting()"
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
export class CategoryListComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Reactive state
  categories = computed(() => this.apiService.categories());
  isLoading = computed(() => this.apiService.isLoading());
  error = computed(() => this.apiService.error());

  // Modal state
  showModal = signal(false);
  editingCategory = signal<Category | null>(null);
  isSubmitting = signal(false);

  // Form
  categoryForm: FormGroup;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      parent_id: [null],
      icon: ['📁'],
      color: ['#808080'],
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories() {
    this.apiService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  openCreateModal() {
    this.editingCategory.set(null);
    this.categoryForm.reset({
      icon: '📁',
      color: '#808080',
    });
    this.showModal.set(true);
  }

  editCategory(cat: Category) {
    this.editingCategory.set(cat);
    this.categoryForm.patchValue(cat);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingCategory.set(null);
  }

  saveCategory() {
    if (!this.categoryForm.valid) return;

    this.isSubmitting.set(true);

    const formValue = this.categoryForm.value;
    const editing = this.editingCategory();

    const request$ = editing
      ? this.apiService.updateCategory(editing.id, formValue.name, formValue.icon, formValue.color)
      : this.apiService.createCategory(formValue.name, formValue.parent_id, formValue.icon, formValue.color);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Error saving category:', err);
        },
      });
  }

  deleteCategory(id: number) {
    if (confirm('Delete this category? All transactions in it will be affected.')) {
      this.apiService
        .deleteCategory(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadCategories();
          },
          error: (err) => {
            console.error('Error deleting category:', err);
          },
        });
    }
  }
}

