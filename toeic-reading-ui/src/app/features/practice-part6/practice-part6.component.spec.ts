import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PracticePart6Component } from './practice-part6.component';
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

describe('PracticePart6Component', () => {
  let component: PracticePart6Component;
  let fixture: ComponentFixture<PracticePart6Component>;
  let toeicServiceMock: Partial<ToeicService>;

  beforeEach(async () => {
    const mockStats = signal(createMockStats());

    toeicServiceMock = {
      stats: mockStats as unknown as ReturnType<typeof signal<UserStats>>,
      loadPart6Passages: vi.fn().mockResolvedValue([]),
      saveAnswer: vi.fn(),
      showSettingsModal: signal(false) as unknown as ReturnType<typeof signal<boolean>>,
    };

    await TestBed.configureTestingModule({
      imports: [PracticePart6Component],
      providers: [
        { provide: ToeicService, useValue: toeicServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticePart6Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default signal values', () => {
    expect(component.currentPassageIndex()).toBe(0);
    expect(component.selectedAnswers()).toEqual({});
    expect(component.isSubmitted()).toEqual({});
    expect(component.showTranslation()).toBe(false);
    expect(component.showConfirmLeaveModal()).toBe(false);
  });

  it('should initialize with empty passages list', () => {
    expect(component.passages()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.currentPassage()).toBeUndefined();
  });

  describe('openSettings', () => {
    it('should set showSettingsModal to true', () => {
      component.openSettings();
      expect((toeicServiceMock as any).showSettingsModal()).toBe(true);
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      fixture.destroy();
      (toeicServiceMock.loadPart6Passages as any).mockResolvedValue([
        { id: 'p1', questions: [{ id: 'q1' }] },
        { id: 'p2', questions: [{ id: 'q2' }] },
        { id: 'p3', questions: [{ id: 'q3' }] },
      ]);
      fixture = TestBed.createComponent(PracticePart6Component);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should go to next passage', () => {
      component.currentPassageIndex.set(0);
      component.nextPassage();
      expect(component.currentPassageIndex()).toBe(1);
    });

    it('should not go beyond last passage', () => {
      component.currentPassageIndex.set(2);
      component.nextPassage();
      expect(component.currentPassageIndex()).toBe(2);
    });

    it('should go to previous passage', () => {
      component.currentPassageIndex.set(1);
      component.prevPassage();
      expect(component.currentPassageIndex()).toBe(0);
    });

    it('should not go before first passage', () => {
      component.currentPassageIndex.set(0);
      component.prevPassage();
      expect(component.currentPassageIndex()).toBe(0);
    });

    it('should go to specific passage index', () => {
      component.goToPassage(2);
      expect(component.currentPassageIndex()).toBe(2);
    });

    it('should not go to invalid index', () => {
      component.goToPassage(-1);
      expect(component.currentPassageIndex()).toBe(0);
      component.goToPassage(100);
      expect(component.currentPassageIndex()).toBe(0);
    });
  });

  describe('selectOption', () => {
    beforeEach(async () => {
      fixture.destroy();
      (toeicServiceMock.loadPart6Passages as any).mockResolvedValue([
        { id: 'p1', questions: [{ id: 'q1' }] },
      ]);
      fixture = TestBed.createComponent(PracticePart6Component);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should update selectedAnswers for the given question', () => {
      component.currentPassageIndex.set(0);
      component.selectOption('q1', 2);
      expect(component.selectedAnswers()['q1']).toBe(2);
    });

    it('should not update when passage is already submitted', () => {
      component.isSubmitted.set({ p1: true });
      component.currentPassageIndex.set(0);
      component.selectOption('q1', 2);
      expect(component.selectedAnswers()['q1']).toBeUndefined();
    });
  });

  describe('submitPassage', () => {
    it('should not submit when passage is not found', () => {
      component.submitPassage('nonexistent');
      expect(toeicServiceMock.saveAnswer).not.toHaveBeenCalled();
    });

    it('should not submit when already submitted', () => {
      component.isSubmitted.set({ p1: true });
      component.submitPassage('p1');
      expect(toeicServiceMock.saveAnswer).not.toHaveBeenCalled();
    });
  });

  describe('getPassageSegments', () => {
    it('should split text by gap markers', () => {
      const segments = component.getPassageSegments('Text [1] more [2] end');
      expect(segments).toEqual(['Text ', '[1]', ' more ', '[2]', ' end']);
    });

    it('should return empty array for empty text', () => {
      expect(component.getPassageSegments('')).toEqual([]);
    });
  });

  describe('isGapMarker', () => {
    it('should return true for gap markers', () => {
      expect(component.isGapMarker('[1]')).toBe(true);
    });

    it('should return false for non-gap text', () => {
      expect(component.isGapMarker('Text')).toBe(false);
    });
  });

  describe('getGapNumber', () => {
    it('should extract the gap number', () => {
      expect(component.getGapNumber('[1]')).toBe(1);
      expect(component.getGapNumber('[10]')).toBe(10);
    });
  });

  describe('hasAnsweredGap', () => {
    it('should return true when gap has been answered', () => {
      component.selectedAnswers.set({ q1: 0 });
      expect(component.hasAnsweredGap(1)).toBe(false); // no current passage
    });
  });

  describe('getOptionLetter', () => {
    it('should return correct letter', () => {
      expect(component.getOptionLetter(0)).toBe('A');
      expect(component.getOptionLetter(3)).toBe('D');
    });
  });

  describe('toggleTranslation', () => {
    it('should toggle showTranslation', () => {
      expect(component.showTranslation()).toBe(false);
      component.toggleTranslation();
      expect(component.showTranslation()).toBe(true);
    });
  });

  describe('getCategoryBadgeClass', () => {
    it('should return correct badge class', () => {
      expect(component.getCategoryBadgeClass('Grammar')).toBe('badge-grammar');
      expect(component.getCategoryBadgeClass('Vocabulary')).toBe('badge-vocabulary');
      expect(component.getCategoryBadgeClass('Word Forms')).toBe('badge-wordform');
      expect(component.getCategoryBadgeClass('Sentence Insertion')).toBe('badge-sentence-insertion');
      expect(component.getCategoryBadgeClass('Unknown')).toBe('badge-grammar');
    });
  });

  describe('hasUnsavedProgress', () => {
    it('should return false when passages list is empty', () => {
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
    it('should hide the modal', () => {
      component.showConfirmLeaveModal.set(true);
      component.onConfirmLeaveResponse(true);
      expect(component.showConfirmLeaveModal()).toBe(false);
    });
  });
});