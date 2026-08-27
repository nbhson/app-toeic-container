import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title()).toBe('Xác nhận rời khỏi trang');
  });

  it('should have default message', () => {
    expect(component.message()).toContain('Bạn đang làm bài dở dang');
  });

  it('should have default confirm text', () => {
    expect(component.confirmText()).toBe('Rời khỏi');
  });

  it('should have default cancel text', () => {
    expect(component.cancelText()).toBe('Ở lại tiếp tục');
  });

  it('should emit confirm event', () => {
    let emitted = false;
    component.confirm.subscribe(() => (emitted = true));
    component.confirm.emit();
    expect(emitted).toBe(true);
  });

  it('should emit cancel event', () => {
    let emitted = false;
    component.cancel.subscribe(() => (emitted = true));
    component.cancel.emit();
    expect(emitted).toBe(true);
  });
});
