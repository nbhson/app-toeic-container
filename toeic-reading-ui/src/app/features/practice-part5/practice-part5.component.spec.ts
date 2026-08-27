import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PracticePart5Component } from './practice-part5.component';
import { ToeicService } from '../../core/services/toeic.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserStats } from '../../core/models/toeic.model';
import { signal } from '@angular/core';

const createMockStats = (): UserStats => ({
  totalAnswered: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  categoryStats: {},
  history: [],
});

describe('PracticePart5Component', () => {
  let component: PracticePart5Component;
  let fixture: ComponentFixture<PracticePart5Component>;
  let toeicServiceMock: Partial<ToeicService>;

  beforeEach(async () => {
    const mockStats = signal(createMockStats());

    toeicServiceMock = {
      stats: mockStats as unknown as ReturnType<typeof signal<UserStats>>,
      loadPracticeQuestions: vi.fn().mockResolvedValue([]),
      saveAnswer: vi.fn(),
      showSettingsModal: signal(false) as unknown as ReturnType<typeof signal<boolean>>,
    };

    await TestBed.configureTestingModule({
      imports: [PracticePart5Component],
      providers: [
        { provide: ToeicService, useValue: toeicServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticePart5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default signal values', () => {
    expect(component.currentIndex()).toBe(0);
    expect(component.selectedOption()).toBeNull();
    expect(component.isSubmitted()).toBe(false);
    expect(component.showConfirmLeaveModal()).toBe(false);
  });

  it('should initialize with empty questions list', () => {
    expect(component.questions()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.currentQuestion()).toBeUndefined();
    expect(component.progressPercentage()).toBe(0);
  });

  describe('selectOption', () => {
    it('should set selectedOption when not submitted', () => {
      component.selectOption(2);
      expect(component.selectedOption()).toBe(2);
    });

    it('should not change selectedOption when already submitted', () => {
      component.isSubmitted.set(true);
      component.selectedOption.set(0);
      component.selectOption(2);
      expect(component.selectedOption()).toBe(0);
    });
  });

  describe('submitAnswer', () => {
    it('should not submit when selectedOption is null', () => {
      component.submitAnswer();
      expect(component.isSubmitted()).toBe(false);
      expect(toeicServiceMock.saveAnswer).not.toHaveBeenCalled();
    });

    it('should not submit when already submitted', () => {
      component.isSubmitted.set(true);
      component.selectedOption.set(1);
      component.submitAnswer();
      expect(toeicServiceMock.saveAnswer).not.toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      // We need to recreate the component with the mock returning data
      fixture.destroy();
      (toeicServiceMock.loadPracticeQuestions as any).mockResolvedValue([
        { id: 'q1' }, { id: 'q2' }, { id: 'q3' },
      ]);
      fixture = TestBed.createComponent(PracticePart5Component);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should go to next question', () => {
      component.currentIndex.set(0);
      component.nextQuestion();
      expect(component.currentIndex()).toBe(1);
    });

    it('should not go beyond last question', () => {
      component.currentIndex.set(2);
      component.nextQuestion();
      expect(component.currentIndex()).toBe(2);
    });

    it('should go to previous question', () => {
      component.currentIndex.set(1);
      component.prevQuestion();
      expect(component.currentIndex()).toBe(0);
    });

    it('should not go before first question', () => {
      component.currentIndex.set(0);
      component.prevQuestion();
      expect(component.currentIndex()).toBe(0);
    });

    it('should go to specific question index', () => {
      component.goToQuestion(2);
      expect(component.currentIndex()).toBe(2);
    });

    it('should not go to invalid index', () => {
      component.goToQuestion(-1);
      expect(component.currentIndex()).toBe(0);
      component.goToQuestion(100);
      expect(component.currentIndex()).toBe(0);
    });
  });

  describe('openSettings', () => {
    it('should set showSettingsModal to true', () => {
      component.openSettings();
      expect(toeicServiceMock.showSettingsModal).toBeDefined();
      expect((toeicServiceMock as any).showSettingsModal()).toBe(true);
    });
  });

  describe('hasUnsavedProgress', () => {
    it('should return false when questions list is empty', () => {
      expect(component.hasUnsavedProgress()).toBe(false);
    });

    it('should return false when there is no selection', () => {
      component.selectedOption.set(null);
      component.isSubmitted.set(false);
      // Only called when questions exist
      expect(component.hasUnsavedProgress()).toBe(false);
    });
  });

  describe('confirmLeave', () => {
    it('should return true when there is no unsaved progress', () => {
      const result = component.confirmLeave();
      expect(result).toBe(true);
    });
  });

  describe('onConfirmLeaveResponse', () => {
    it('should hide the modal and resolve with the accept value', () => {
      component.showConfirmLeaveModal.set(true);
      component.onConfirmLeaveResponse(true);
      expect(component.showConfirmLeaveModal()).toBe(false);
    });

    it('should hide the modal and resolve with false when rejected', () => {
      component.showConfirmLeaveModal.set(true);
      component.onConfirmLeaveResponse(false);
      expect(component.showConfirmLeaveModal()).toBe(false);
    });
  });
});