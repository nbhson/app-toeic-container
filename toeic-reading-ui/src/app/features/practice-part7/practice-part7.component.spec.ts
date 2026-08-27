import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PracticePart7Component } from './practice-part7.component';
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

describe('PracticePart7Component', () => {
  let component: PracticePart7Component;
  let fixture: ComponentFixture<PracticePart7Component>;
  let toeicServiceMock: Partial<ToeicService>;

  beforeEach(async () => {
    const mockStats = signal(createMockStats());

    toeicServiceMock = {
      stats: mockStats as unknown as ReturnType<typeof signal<UserStats>>,
      loadPart7Passages: vi.fn().mockResolvedValue([]),
      saveAnswer: vi.fn(),
      showSettingsModal: signal(false) as unknown as ReturnType<typeof signal<boolean>>,
    };

    await TestBed.configureTestingModule({
      imports: [PracticePart7Component],
      providers: [
        { provide: ToeicService, useValue: toeicServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticePart7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default signal values', () => {
    expect(component.practiceMode()).toBeNull();
    expect(component.currentPassageIndex()).toBe(0);
    expect(component.selectedAnswers()).toEqual({});
    expect(component.isSubmitted()).toEqual({});
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

  describe('selectMode', () => {
    it('should set practiceMode to mini', () => {
      component.selectMode('mini');
      expect(component.practiceMode()).toBe('mini');
    });

    it('should set practiceMode to full', () => {
      component.selectMode('full');
      expect(component.practiceMode()).toBe('full');
    });

    it('should reset navigation and answers state', () => {
      component.currentPassageIndex.set(5);
      component.selectedAnswers.set({ q1: 1 });
      component.isSubmitted.set({ p1: true });

      component.selectMode('mini');

      expect(component.currentPassageIndex()).toBe(0);
      expect(component.selectedAnswers()).toEqual({});
      expect(component.isSubmitted()).toEqual({});
    });
  });

  describe('resetSession', () => {
    it('should reset practiceMode to null and clear all state', () => {
      component.practiceMode.set('mini');
      component.currentPassageIndex.set(2);
      component.selectedAnswers.set({ q1: 1 });
      component.isSubmitted.set({ p1: true });

      component.resetSession();

      expect(component.practiceMode()).toBeNull();
      expect(component.currentPassageIndex()).toBe(0);
      expect(component.selectedAnswers()).toEqual({});
      expect(component.isSubmitted()).toEqual({});
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      fixture.destroy();
      (toeicServiceMock.loadPart7Passages as any).mockResolvedValue([
        { id: 'p1', questions: [{ id: 'q1' }] },
        { id: 'p2', questions: [{ id: 'q2' }] },
        { id: 'p3', questions: [{ id: 'q3' }] },
      ]);
      fixture = TestBed.createComponent(PracticePart7Component);
      component = fixture.componentInstance;
      // Set practiceMode to trigger resource loading
      component.practiceMode.set('mini');
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
      (toeicServiceMock.loadPart7Passages as any).mockResolvedValue([
        { id: 'p1', questions: [{ id: 'q1' }] },
      ]);
      fixture = TestBed.createComponent(PracticePart7Component);
      component = fixture.componentInstance;
      // Set practiceMode to trigger resource loading
      component.practiceMode.set('mini');
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