import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { GlobalInterceptor } from './interceptor';
import { ApiService } from './services/api.service';

/**
 * Root App Component
 *
 * Responsibilities:
 * - Bootstrap entire application
 * - Set up HTTP interceptors globally
 * - Render navigation sidebar
 * - Host router outlet for page content
 * - Manage global app state (if needed)
 */

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, HttpClientModule],
  providers: [
    ApiService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GlobalInterceptor,
      multi: true,
    },
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private router = inject(Router);

  // Navigation state
  sidebarOpen = signal(true);
  currentPage = signal('dashboard');
  isLoggedIn = signal(false);

  // Navigation items
  navigationItems = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Transactions', route: '/transactions', icon: '💳' },
    { label: 'Categories', route: '/categories', icon: '🏷️' },
    { label: 'Budgets', route: '/budgets', icon: '💰' },
  ];

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    this.isLoggedIn.set(!!(token && userId));
  }

  toggleSidebar() {
    this.sidebarOpen.update((val) => !val);
  }

  navigate(route: string) {
    this.currentPage.set(route.split('/')[1] || 'dashboard');
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }
}

