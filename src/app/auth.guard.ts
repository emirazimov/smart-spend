import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Auth Guard
 *
 * Protects routes by checking if user is authenticated
 * Redirects to login if no valid auth token
 */

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
