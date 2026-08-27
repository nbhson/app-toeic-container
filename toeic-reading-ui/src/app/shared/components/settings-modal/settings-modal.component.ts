import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { ToeicService } from '../../../core/services/toeic.service';
import { GeminiService } from '../../../core/services/gemini.service';
import { OmnirouteService } from '../../../core/services/omniroute.service';
import { EMPTY_STRING } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsModalComponent implements OnInit {
  private readonly toeicService = inject(ToeicService);
  private readonly geminiService = inject(GeminiService);
  private readonly omnirouteService = inject(OmnirouteService);

  // Signal Inputs and Outputs
  show = input<boolean>(false);
  close = output<void>();
  keySaved = output<void>();

  // Signal Form States for Gemini (remains localStorage-based)
  geminiApiKeyField = signal<string>(EMPTY_STRING);
  isGeminiKeyVisible = signal<boolean>(false);
  isTestingGemini = signal<boolean>(false);
  testResultGemini = signal<'success' | 'error' | null>(null);

  // Signal Form States for OmniRoute (now BE-based)
  omnirouteApiKeyField = signal<string>(EMPTY_STRING);
  isOmniRouteKeyVisible = signal<boolean>(false);
  isTestingOmniRoute = signal<boolean>(false);
  testResultOmniRoute = signal<'success' | 'error' | null>(null);

  // Computed Derived States
  hasGeminiKey = computed(() => !!this.toeicService.getGeminiApiKey());
  hasOmniRouteKey = signal<boolean>(false);
  hasAnyKey = computed(() => this.hasGeminiKey() || this.hasOmniRouteKey());

  isTestGeminiDisabled = computed(() => this.isTestingGemini() || !this.geminiApiKeyField().trim());
  isTestOmniRouteDisabled = computed(() => this.isTestingOmniRoute() || !this.omnirouteApiKeyField().trim());
  isSaveDisabled = computed(() => this.isTestingGemini() || this.isTestingOmniRoute());

  ngOnInit() {
    this.loadKeyStatus();
  }

  /**
   * Loads the OmniRoute key status from BE and Gemini from localStorage.
   */
  async loadKeyStatus() {
    // Load OmniRoute key status from BE
    try {
      const hasStored = await this.omnirouteService.hasStoredOmniRouteKey();
      this.hasOmniRouteKey.set(hasStored);
    } catch {
      // Fallback to localStorage check
      this.hasOmniRouteKey.set(!!this.toeicService.getOmniRouteApiKey());
    }

    // Load form values
    this.resetFormValue();
  }

  resetFormValue() {
    this.geminiApiKeyField.set(this.toeicService.getGeminiApiKey() || EMPTY_STRING);
    // Don't pre-fill the OmniRoute field - let user type a new key or see placeholder
    this.omnirouteApiKeyField.set(EMPTY_STRING);
    this.testResultGemini.set(null);
    this.testResultOmniRoute.set(null);
    this.isGeminiKeyVisible.set(false);
    this.isOmniRouteKeyVisible.set(false);
  }

  onGeminiKeyInput(event: Event) {
    this.geminiApiKeyField.set((event.target as HTMLInputElement).value);
  }

  onOmniRouteKeyInput(event: Event) {
    this.omnirouteApiKeyField.set((event.target as HTMLInputElement).value);
  }

  toggleGeminiKeyVisibility() {
    this.isGeminiKeyVisible.update((v) => !v);
  }

  toggleOmniRouteKeyVisibility() {
    this.isOmniRouteKeyVisible.update((v) => !v);
  }

  async testGeminiApiKey() {
    const key = this.geminiApiKeyField().trim();
    if (!key) return;

    this.isTestingGemini.set(true);
    this.testResultGemini.set(null);

    try {
      const result = await this.geminiService.generateToeicQuestions(1, key);
      if (result && result.length > 0) {
        this.testResultGemini.set('success');
      } else {
        this.testResultGemini.set('error');
      }
    } catch (e) {
      this.testResultGemini.set('error');
    } finally {
      this.isTestingGemini.set(false);
    }
  }

  async testOmniRouteApiKey() {
    const key = this.omnirouteApiKeyField().trim();
    if (!key) return;

    this.isTestingOmniRoute.set(true);
    this.testResultOmniRoute.set(null);

    try {
      // Pass the key to BE for testing
      const result = await this.omnirouteService.generateToeicQuestions(1, key);
      if (result && result.length > 0) {
        this.testResultOmniRoute.set('success');
      } else {
        this.testResultOmniRoute.set('error');
      }
    } catch (e) {
      this.testResultOmniRoute.set('error');
    } finally {
      this.isTestingOmniRoute.set(false);
    }
  }

  async saveApiKeys() {
    const geminiKey = this.geminiApiKeyField().trim();
    const omnirouteKey = this.omnirouteApiKeyField().trim();

    // Save Gemini key to localStorage (unchanged)
    this.toeicService.setGeminiApiKey(geminiKey);

    // Save OmniRoute key to BE key store
    try {
      if (omnirouteKey) {
        await this.omnirouteService.saveKey('omniroute', omnirouteKey);
      }
      // Also update localStorage for backward compatibility
      this.toeicService.setOmniRouteApiKey(omnirouteKey);
    } catch (error) {
      console.error('Error saving OmniRoute key to BE:', error);
      // Fallback: save to localStorage only
      this.toeicService.setOmniRouteApiKey(omnirouteKey);
    }

    // Refresh key status
    await this.loadKeyStatus();

    this.keySaved.emit();
    this.closeModal();
  }

  clearGeminiKey() {
    this.toeicService.setGeminiApiKey(EMPTY_STRING);
    this.geminiApiKeyField.set(EMPTY_STRING);
    this.keySaved.emit();
  }

  async clearOmniRouteKey() {
    try {
      await this.omnirouteService.deleteKey('omniroute');
    } catch (error) {
      console.error('Error deleting OmniRoute key from BE:', error);
    }
    this.toeicService.setOmniRouteApiKey(EMPTY_STRING);
    this.omnirouteApiKeyField.set(EMPTY_STRING);
    this.hasOmniRouteKey.set(false);
    this.keySaved.emit();
  }

  closeModal() {
    this.resetFormValue();
    this.close.emit();
  }
}