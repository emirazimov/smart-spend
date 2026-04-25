import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Global HTTP Interceptor
 *
 * Handles:
 * - Adding auth tokens to all requests
 * - Error handling and logging
 * - Request/response timing
 */

@Injectable()
export class GlobalInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token && !req.url.includes('health')) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log error
        console.error('HTTP Error:', error);

        // Handle specific error codes
        if (error.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          // TODO: Navigate to login page
        } else if (error.status === 403) {
          console.warn('Access forbidden - insufficient permissions');
        } else if (error.status === 404) {
          console.warn('Resource not found');
        } else if (error.status >= 500) {
          console.error('Server error:', error.message);
        }

        // Re-throw error for component to handle
        return throwError(() => error);
      })
    );
  }
}
