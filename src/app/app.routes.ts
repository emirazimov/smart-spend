import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { TransactionListComponent } from './transactions.component';
import { CategoryListComponent } from './categories.component';
import { BudgetListComponent } from './budgets.component';
import { LoginComponent } from './login.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { title: 'Dashboard' },
  },
  {
    path: 'transactions',
    component: TransactionListComponent,
    canActivate: [AuthGuard],
    data: { title: 'Transactions' },
  },
  {
    path: 'categories',
    component: CategoryListComponent,
    canActivate: [AuthGuard],
    data: { title: 'Categories' },
  },
  {
    path: 'budgets',
    component: BudgetListComponent,
    canActivate: [AuthGuard],
    data: { title: 'Budgets' },
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
