import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsModalComponent } from './settings-modal.component';
import { ToeicService } from '../../../core/services/toeic.service';
import { GeminiService } from '../../../core/services/gemini.service';
import { OmnirouteService } from '../../../core/services/omniroute.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SettingsModalComponent', () => {
  let component: SettingsModalComponent;
  let fixture: ComponentFixture<SettingsModalComponent>;
  let toeicServiceMock: Partial<ToeicService>;
  let geminiServiceMock: Partial<GeminiService>;
  let omnirouteServiceMock: Partial<OmnirouteService>;

  beforeEach(async () => {
    toeicServiceMock = {
      getGeminiApiKey: vi.fn().mockReturnValue(null),
      setGeminiApiKey: vi.fn(),
      getOmniRouteApiKey: vi.fn().mockReturnValue(null),
      setOmniRouteApiKey: vi.fn(),
    };

    geminiServiceMock = {
      generateToeicQuestions: vi.fn(),
    };

    omnirouteServiceMock = {
      generateToeicQuestions: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsModalComponent],
      providers: [
        { provide: ToeicService, useValue: toeicServiceMock },
        { provide: GeminiService, useValue: geminiServiceMock },
        { provide: OmnirouteService, useValue: omnirouteServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load API keys from service on init', () => {
    expect(toeicServiceMock.getGeminiApiKey).toHaveBeenCalled();
    expect(toeicServiceMock.getOmniRouteApiKey).toHaveBeenCalled();
    expect(component.geminiApiKeyField()).toBe('');
    expect(component.omnirouteApiKeyField()).toBe('');
  });

  it('should initialize with correct default states', () => {
    expect(component.isGeminiKeyVisible()).toBe(false);
    expect(component.isOmniRouteKeyVisible()).toBe(false);
    expect(component.isTestingGemini()).toBe(false);
    expect(component.isTestingOmniRoute()).toBe(false);
    expect(component.testResultGemini()).toBeNull();
    expect(component.testResultOmniRoute()).toBeNull();
  });

  describe('hasAnyKey computed', () => {
    it('should return true when OmniRoute key exists', () => {
      (toeicServiceMock.getOmniRouteApiKey as any).mockReturnValue('or-key');
      const modal = TestBed.createComponent(SettingsModalComponent).componentInstance;
      expect(modal.hasAnyKey()).toBe(true);
    });

    it('should return true when Gemini key exists', () => {
      (toeicServiceMock.getGeminiApiKey as any).mockReturnValue('gemini-key');
      const modal = TestBed.createComponent(SettingsModalComponent).componentInstance;
      expect(modal.hasAnyKey()).toBe(true);
    });

    it('should return false when neither key exists', () => {
      expect(component.hasAnyKey()).toBe(false);
    });
  });

  describe('isSaveDisabled computed', () => {
    it('should be disabled when testing is in progress', () => {
      component.isTestingGemini.set(true);
      expect(component.isSaveDisabled()).toBe(true);
    });

    it('should be enabled when not testing', () => {
      component.isTestingGemini.set(false);
      component.isTestingOmniRoute.set(false);
      expect(component.isSaveDisabled()).toBe(false);
    });
  });

  describe('toggleGeminiKeyVisibility', () => {
    it('should toggle Gemini key visibility', () => {
      expect(component.isGeminiKeyVisible()).toBe(false);
      component.toggleGeminiKeyVisibility();
      expect(component.isGeminiKeyVisible()).toBe(true);
      component.toggleGeminiKeyVisibility();
      expect(component.isGeminiKeyVisible()).toBe(false);
    });
  });

  describe('toggleOmniRouteKeyVisibility', () => {
    it('should toggle OmniRoute key visibility', () => {
      expect(component.isOmniRouteKeyVisible()).toBe(false);
      component.toggleOmniRouteKeyVisibility();
      expect(component.isOmniRouteKeyVisible()).toBe(true);
      component.toggleOmniRouteKeyVisibility();
      expect(component.isOmniRouteKeyVisible()).toBe(false);
    });
  });

  describe('testOmniRouteApiKey', () => {
    it('should set testResultOmniRoute to success when API call succeeds', async () => {
      component.omnirouteApiKeyField.set('valid-key');
      (omnirouteServiceMock.generateToeicQuestions as any).mockResolvedValue([
        { id: 'test' },
      ]);

      await component.testOmniRouteApiKey();

      expect(component.testResultOmniRoute()).toBe('success');
      expect(component.isTestingOmniRoute()).toBe(false);
    });

    it('should set testResultOmniRoute to error when API call throws', async () => {
      component.omnirouteApiKeyField.set('valid-key');
      (omnirouteServiceMock.generateToeicQuestions as any).mockRejectedValue(
        new Error('API Error'),
      );

      await component.testOmniRouteApiKey();

      expect(component.testResultOmniRoute()).toBe('error');
      expect(component.isTestingOmniRoute()).toBe(false);
    });

    it('should not call API if key is empty', async () => {
      component.omnirouteApiKeyField.set('');
      await component.testOmniRouteApiKey();
      expect(omnirouteServiceMock.generateToeicQuestions).not.toHaveBeenCalled();
    });
  });

  describe('testGeminiApiKey', () => {
    it('should set testResultGemini to success when API call succeeds', async () => {
      component.geminiApiKeyField.set('valid-key');
      (geminiServiceMock.generateToeicQuestions as any).mockResolvedValue([
        { id: 'test' },
      ]);

      await component.testGeminiApiKey();

      expect(component.testResultGemini()).toBe('success');
      expect(component.isTestingGemini()).toBe(false);
    });

    it('should set testResultGemini to error when API call throws', async () => {
      component.geminiApiKeyField.set('valid-key');
      (geminiServiceMock.generateToeicQuestions as any).mockRejectedValue(
        new Error('API Error'),
      );

      await component.testGeminiApiKey();

      expect(component.testResultGemini()).toBe('error');
      expect(component.isTestingGemini()).toBe(false);
    });

    it('should not call API if key is empty', async () => {
      component.geminiApiKeyField.set('');
      await component.testGeminiApiKey();
      expect(geminiServiceMock.generateToeicQuestions).not.toHaveBeenCalled();
    });
  });

  describe('saveApiKeys', () => {
    it('should save both keys and emit close/keySaved events', () => {
      let closeEmitted = false;
      let keySavedEmitted = false;
      component.close.subscribe(() => (closeEmitted = true));
      component.keySaved.subscribe(() => (keySavedEmitted = true));

      component.geminiApiKeyField.set('gemini-key');
      component.omnirouteApiKeyField.set('or-key');
      component.saveApiKeys();

      expect(toeicServiceMock.setGeminiApiKey).toHaveBeenCalledWith('gemini-key');
      expect(toeicServiceMock.setOmniRouteApiKey).toHaveBeenCalledWith('or-key');
      expect(closeEmitted).toBe(true);
      expect(keySavedEmitted).toBe(true);
    });
  });

  describe('clearGeminiKey', () => {
    it('should clear the Gemini API key and reset field', () => {
      let keySavedEmitted = false;
      component.keySaved.subscribe(() => (keySavedEmitted = true));

      component.geminiApiKeyField.set('existing-key');
      component.clearGeminiKey();

      expect(toeicServiceMock.setGeminiApiKey).toHaveBeenCalledWith('');
      expect(component.geminiApiKeyField()).toBe('');
      expect(keySavedEmitted).toBe(true);
    });
  });

  describe('clearOmniRouteKey', () => {
    it('should clear the OmniRoute API key and reset field', () => {
      let keySavedEmitted = false;
      component.keySaved.subscribe(() => (keySavedEmitted = true));

      component.omnirouteApiKeyField.set('existing-key');
      component.clearOmniRouteKey();

      expect(toeicServiceMock.setOmniRouteApiKey).toHaveBeenCalledWith('');
      expect(component.omnirouteApiKeyField()).toBe('');
      expect(keySavedEmitted).toBe(true);
    });
  });

  describe('closeModal', () => {
    it('should reset form and emit close event', () => {
      let closeEmitted = false;
      component.close.subscribe(() => (closeEmitted = true));

      component.geminiApiKeyField.set('dirty-value');
      component.omnirouteApiKeyField.set('dirty-value');
      component.testResultGemini.set('success');
      component.testResultOmniRoute.set('success');
      component.isGeminiKeyVisible.set(true);
      component.isOmniRouteKeyVisible.set(true);

      component.closeModal();

      expect(component.geminiApiKeyField()).toBe('');
      expect(component.omnirouteApiKeyField()).toBe('');
      expect(component.testResultGemini()).toBeNull();
      expect(component.testResultOmniRoute()).toBeNull();
      expect(component.isGeminiKeyVisible()).toBe(false);
      expect(component.isOmniRouteKeyVisible()).toBe(false);
      expect(closeEmitted).toBe(true);
    });
  });
});