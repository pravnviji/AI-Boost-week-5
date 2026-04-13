import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./tasks/task-list/task-list.component').then((m) => m.TaskListComponent),
  },
  {
    path: 'tasks/new',
    loadComponent: () =>
      import('./tasks/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
  },
  {
    path: 'tasks/:id',
    loadComponent: () =>
      import('./tasks/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
  },
];
