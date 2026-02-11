import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login')
        .then(m => m.Login)
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/admin.layout/admin.layout')
        .then(m => m.AdminLayout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard') 
            .then(m => m.Dashboard)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/user-management/users.component/users.component')
            .then(m => m.UsersComponent)
      },
      {
        path: 'product',
        loadComponent: () =>
          import('./pages/products/product.component/product.component')
            .then(m => m.ProductComponent)
      },
      {
        path: 'proposal',
        loadComponent: () =>
          import('./pages/proposal/proposal.component/proposal.component')
            .then(m => m.ProposalComponent)
      }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
