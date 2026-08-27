import { CanDeactivateFn } from '@angular/router';

export interface HasPendingChanges {
  confirmLeave: () => Promise<boolean> | boolean;
}

export const pendingChangesGuard: CanDeactivateFn<HasPendingChanges> = (component) => {
  console.log('[Guard] pendingChangesGuard triggered for component:', component);
  if (component) {
    console.log(
      '[Guard] component has confirmLeave method:',
      typeof component.confirmLeave === 'function',
    );
  }
  if (component && typeof component.confirmLeave === 'function') {
    return component.confirmLeave();
  }
  return true;
};
