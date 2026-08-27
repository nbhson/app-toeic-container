import { Routes } from '@angular/router';
import { EMPTY_STRING } from '../constants/app.constants';
import { pendingChangesGuard } from '../guards/pending-changes.guard';

export const routes: Routes = [
  {
    path: EMPTY_STRING,
    loadComponent: () =>
      import('../../features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'practice-part5',
    loadComponent: () =>
      import('../../features/practice-part5/practice-part5.component').then(
        (m) => m.PracticePart5Component,
      ),
    canDeactivate: [pendingChangesGuard],
  },
  {
    path: 'practice-part6',
    loadComponent: () =>
      import('../../features/practice-part6/practice-part6.component').then(
        (m) => m.PracticePart6Component,
      ),
    canDeactivate: [pendingChangesGuard],
  },
  {
    path: 'practice-part7',
    loadComponent: () =>
      import('../../features/practice-part7/practice-part7.component').then(
        (m) => m.PracticePart7Component,
      ),
    canDeactivate: [pendingChangesGuard],
  },
  { path: '**', redirectTo: EMPTY_STRING },
];
