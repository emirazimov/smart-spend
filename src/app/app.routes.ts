import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { TransactionListComponent } from './transactions.component';
import { CategoryListComponent } from './categories.component';
import { BudgetListComponent } from './budgets.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: { title: 'Dashboard' },
  },
  {
    path: 'transactions',
    component: TransactionListComponent,
    data: { title: 'Transactions' },
  },
  {
    path: 'categories',
    component: CategoryListComponent,
    data: { title: 'Categories' },
  },
  {
    path: 'budgets',
    component: BudgetListComponent,
    data: { title: 'Budgets' },
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
