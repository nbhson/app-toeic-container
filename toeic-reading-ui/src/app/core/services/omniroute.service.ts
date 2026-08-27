import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToeicQuestion, ToeicPart6Passage, ToeicPart7Passage } from '../models/toeic.model';
import { BE_API_URL, BE_KEYS_URL } from '../constants/app.constants';

export interface KeyStatus {
  hasValue: boolean;
  masked: string;
}

@Injectable({
  providedIn: 'root',
})
export class OmnirouteService {
  private readonly http = inject(HttpClient);

  constructor() {}

  // ── Key Management ─────────────────────────────────────────────

  /**
   * Gets the status of all stored API keys from the BE.
   */
  async getKeyStatus(): Promise<Record<string, KeyStatus>> {
    const response = await firstValueFrom(
      this.http.get<{ keys: Record<string, KeyStatus> }>(BE_KEYS_URL),
    );
    return response.keys;
  }

  /**
   * Saves an API key to the BE key store.
   * @param name Key name (e.g. 'omniroute')
   * @param value Key value (empty string to remove)
   */
  async saveKey(name: string, value: string): Promise<void> {
    await firstValueFrom(
      this.http.put(BE_KEYS_URL, { name, value }),
    );
  }

  /**
   * Removes a stored API key from the BE key store.
   * @param name Key name (e.g. 'omniroute')
   */
  async deleteKey(name: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${BE_KEYS_URL}/${name}`),
    );
  }

  /**
   * Checks if the BE has an OmniRoute key stored.
   */
  async hasStoredOmniRouteKey(): Promise<boolean> {
    try {
      const keys = await this.getKeyStatus();
      return !!keys['omniroute']?.hasValue;
    } catch {
      return false;
    }
  }

  // ── TOEIC Generation ───────────────────────────────────────────

  /**
   * Generates custom TOEIC Part 5 questions via the backend API.
   * If apiKey is not provided, the backend will use its stored key or default.
   * @param count Number of questions to generate
   * @param apiKey Optional OmniRoute API Key (falls back to BE stored/default)
   */
  async generateToeicQuestions(count: number, apiKey?: string): Promise<ToeicQuestion[]> {
    const response = await firstValueFrom(
      this.http.post<{ questions: ToeicQuestion[] }>(`${BE_API_URL}/part5`, {
        count,
        apiKey: apiKey || undefined,
      }),
    );
    return response.questions;
  }

  /**
   * Generates a list of TOEIC Part 6 passages via the backend API.
   * @param count Number of passages to generate
   * @param apiKey Optional OmniRoute API Key (falls back to BE stored/default)
   */
  async generateToeicPart6Passages(count: number, apiKey?: string): Promise<ToeicPart6Passage[]> {
    const response = await firstValueFrom(
      this.http.post<{ passages: ToeicPart6Passage[] }>(`${BE_API_URL}/part6`, {
        count,
        apiKey: apiKey || undefined,
      }),
    );
    return response.passages;
  }

  /**
   * Generates a list of TOEIC Part 7 passages via the backend API.
   * @param passageType Single, Double, or Triple
   * @param count Number of passages to generate
   * @param startQuestionNumber Starting question number
   * @param apiKey Optional OmniRoute API Key (falls back to BE stored/default)
   */
  async generateToeicPart7Passages(
    passageType: 'Single' | 'Double' | 'Triple',
    count: number,
    startQuestionNumber: number,
    apiKey?: string,
  ): Promise<ToeicPart7Passage[]> {
    const response = await firstValueFrom(
      this.http.post<{ passages: ToeicPart7Passage[] }>(`${BE_API_URL}/part7`, {
        passageType,
        count,
        startQuestionNumber,
        apiKey: apiKey || undefined,
      }),
    );
    return response.passages;
  }

  /**
   * Generates multiple Part 7 batches in a SINGLE request to eliminate HTTP round-trip overhead.
   * Used for Full Mock Test (4 batches: Single×2, Double, Triple).
   */
  async generateToeicPart7Batch(
    batches: Array<{ passageType: 'Single' | 'Double' | 'Triple'; count: number; startQuestionNumber: number }>,
    apiKey?: string,
  ): Promise<ToeicPart7Passage[]> {
    const response = await firstValueFrom(
      this.http.post<{ passages: ToeicPart7Passage[] }>(`${BE_API_URL}/part7/batch`, {
        batches,
        apiKey: apiKey || undefined,
      }),
    );
    return response.passages;
  }
}
