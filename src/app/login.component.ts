import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * Login Component
 *
 * Features:
 * - User login with email and password
 * - Form validation
 * - Error handling
 * - Token storage
 * - Redirect to dashboard on success
 */

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-primary-600 mb-2">💰 SmartSpend</h1>
          <p class="text-gray-600 text-sm">Financial Ecosystem</p>
        </div>

        <!-- Tab toggle -->
        <div class="flex gap-4 mb-6 border-b">
          <button
            (click)="setMode('login')"
            [class.border-b-2]="mode() === 'login'"
            [class.border-primary-600]="mode() === 'login'"
            [class.text-primary-600]="mode() === 'login'"
            class="px-4 py-2 text-sm font-medium text-gray-600 transition-colors">
            Login
          </button>
          <button
            (click)="setMode('register')"
            [class.border-b-2]="mode() === 'register'"
            [class.border-primary-600]="mode() === 'register'"
            [class.text-primary-600]="mode() === 'register'"
            class="px-4 py-2 text-sm font-medium text-gray-600 transition-colors">
            Register
          </button>
        </div>

        <!-- Error message -->
        @if (error()) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
            {{ error() }}
          </div>
        }

        <!-- Login Form -->
        @if (mode() === 'login') {
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <input
                type="email"
                formControlName="email"
                placeholder="you@example.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              @if (loginForm.get('email')?.errors?.['required']) {
                <p class="text-red-600 text-xs mt-1">Email is required</p>
              }
              @if (loginForm.get('email')?.errors?.['email']) {
                <p class="text-red-600 text-xs mt-1">Please enter a valid email</p>
              }
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <input
                type="password"
                formControlName="password"
                placeholder="••••••••"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              @if (loginForm.get('password')?.errors?.['required']) {
                <p class="text-red-600 text-xs mt-1">Password is required</p>
              }
            </div>

            <button
              type="submit"
              [disabled]="!loginForm.valid || isSubmitting()"
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSubmitting() ? 'Logging in...' : 'Login' }}
            </button>
          </form>
        }

        <!-- Register Form -->
        @if (mode() === 'register') {
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <input
                type="email"
                formControlName="email"
                placeholder="you@example.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              @if (registerForm.get('email')?.errors?.['required']) {
                <p class="text-red-600 text-xs mt-1">Email is required</p>
              }
              @if (registerForm.get('email')?.errors?.['email']) {
                <p class="text-red-600 text-xs mt-1">Please enter a valid email</p>
              }
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Username</label>
              <input
                type="text"
                formControlName="username"
                placeholder="Your name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              @if (registerForm.get('username')?.errors?.['required']) {
                <p class="text-red-600 text-xs mt-1">Username is required</p>
              }
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <input
                type="password"
                formControlName="password"
                placeholder="••••••••"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              @if (registerForm.get('password')?.errors?.['required']) {
                <p class="text-red-600 text-xs mt-1">Password is required</p>
              }
              @if (registerForm.get('password')?.errors?.['minlength']) {
                <p class="text-red-600 text-xs mt-1">Password must be at least 6 characters</p>
              }
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Currency</label>
              <select
                formControlName="currency"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="KGS">KGS (с)</option>
              </select>
            </div>

            <button
              type="submit"
              [disabled]="!registerForm.valid || isSubmitting()"
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSubmitting() ? 'Registering...' : 'Register' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  mode = signal<'login' | 'register'>('login');
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      currency: ['USD'],
    });
  }

  setMode(newMode: 'login' | 'register') {
    this.mode.set(newMode);
    this.error.set(null);
  }

  onLogin() {
    if (!this.loginForm.valid) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    const { email, password } = this.loginForm.value;

    console.log('Attempting login:', { email });

    this.http
      .post<any>('http://localhost:8000/login', { email, password })
      .subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.isSubmitting.set(false);
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userId', response.id);
          console.log('Token and userId stored in localStorage');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Login error:', err);
          this.isSubmitting.set(false);
          const errorMsg = err.error?.detail || err.message || 'Login failed. Please check your credentials.';
          this.error.set(errorMsg);
        },
      });
  }

  onRegister() {
    if (!this.registerForm.valid) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    const { email, username, password, currency } = this.registerForm.value;

    console.log('Registering user:', { email, username, currency });

    this.http
      .post<any>('http://localhost:8000/users', {
        email,
        username,
        password,
        currency,
      })
      .subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.isSubmitting.set(false);
          this.mode.set('login');
          this.loginForm.patchValue({ email });
          this.error.set(null);
          // Show success message temporarily
          alert(`✅ Registration successful! Please log in with your credentials.`);
          // Auto-focus password field
          setTimeout(() => {
            const passwordInput = document.querySelector(
              'input[type="password"]'
            ) as HTMLInputElement;
            if (passwordInput) {
              passwordInput.focus();
            }
          });
        },
        error: (err) => {
          console.error('Registration error:', err);
          this.isSubmitting.set(false);
          const errorMsg = err.error?.detail || err.message || 'Registration failed. Please try again.';
          this.error.set(errorMsg);
        },
      });
  }
}
