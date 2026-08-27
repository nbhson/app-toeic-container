import { pendingChangesGuard, HasPendingChanges } from './pending-changes.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';

describe('pendingChangesGuard', () => {
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  it('should return true if component has no confirmLeave method', () => {
    const component = {} as HasPendingChanges;
    const result = pendingChangesGuard(component, mockRoute, mockState, mockState);
    expect(result).toBe(true);
  });

  it('should return true if component.confirmLeave returns true', () => {
    const component: HasPendingChanges = {
      confirmLeave: () => true,
    };
    const result = pendingChangesGuard(component, mockRoute, mockState, mockState);
    expect(result).toBe(true);
  });

  it('should return false if component.confirmLeave returns false', () => {
    const component: HasPendingChanges = {
      confirmLeave: () => false,
    };
    const result = pendingChangesGuard(component, mockRoute, mockState, mockState);
    expect(result).toBe(false);
  });

  it('should return a Promise if component.confirmLeave returns a Promise', async () => {
    const component: HasPendingChanges = {
      confirmLeave: () => Promise.resolve(true),
    };
    const result = pendingChangesGuard(component, mockRoute, mockState, mockState);
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe(true);
  });

  it('should handle Promise that resolves to false', async () => {
    const component: HasPendingChanges = {
      confirmLeave: () => Promise.resolve(false),
    };
    const result = pendingChangesGuard(component, mockRoute, mockState, mockState) as Promise<boolean>;
    await expect(result).resolves.toBe(false);
  });

  it('should handle component with undefined confirmLeave gracefully', () => {
    const component = {} as HasPendingChanges;
    const result = pendingChangesGuard(component, mockRoute, mockState, mockState);
    expect(result).toBe(true);
  });
});
