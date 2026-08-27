import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { ToeicService } from '../../../core/services/toeic.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let toeicServiceMock: Partial<ToeicService>;

  beforeEach(async () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    toeicServiceMock = {
      showSettingsModal: signal(false) as unknown as ReturnType<typeof signal<boolean>>,
      getApiKey: vi.fn().mockReturnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: ToeicService, useValue: toeicServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize isDarkMode to true', () => {
    expect(component.isDarkMode).toBe(true);
  });

  it('should initialize hasApiKey to false', () => {
    expect(component.hasApiKey).toBe(false);
  });

  describe('openSettings', () => {
    it('should set showSettingsModal to true', () => {
      component.openSettings();
      expect(component.showModal()).toBe(true);
    });
  });

  describe('closeSettings', () => {
    it('should set showSettingsModal to false', () => {
      component.closeSettings();
      expect(component.showModal()).toBe(false);
    });
  });

  describe('onKeySaved', () => {
    it('should set hasApiKey to true when API key exists', () => {
      (toeicServiceMock.getApiKey as any).mockReturnValue('some-key');
      component.onKeySaved();
      expect(component.hasApiKey).toBe(true);
    });

    it('should set hasApiKey to false when API key is null', () => {
      (toeicServiceMock.getApiKey as any).mockReturnValue(null);
      component.onKeySaved();
      expect(component.hasApiKey).toBe(false);
    });

    it('should set hasApiKey to false when API key is empty string', () => {
      (toeicServiceMock.getApiKey as any).mockReturnValue('');
      component.onKeySaved();
      expect(component.hasApiKey).toBe(false);
    });
  });
});