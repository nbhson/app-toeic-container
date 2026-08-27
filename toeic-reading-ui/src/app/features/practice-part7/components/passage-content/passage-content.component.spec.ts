import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PassageContentComponent } from './passage-content.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { ToeicPart7Passage } from '../../../../core/models/toeic.model';

const mockPassage: ToeicPart7Passage = {
  id: 'p1',
  passageType: 'Single',
  documentType: 'Email',
  text: 'This is a test passage for Part 7.',
  translation: 'Đây là đoạn văn kiểm tra cho Part 7.',
  questions: [
    {
      id: 'q1',
      questionNumber: 1,
      question: 'What is this passage about?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: 'Explanation 1',
      translation: 'Translation 1',
    },
  ],
};

describe('PassageContentComponent', () => {
  let component: PassageContentComponent;
  let fixture: ComponentFixture<PassageContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassageContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PassageContentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('passage', mockPassage);
    fixture.componentRef.setInput('currentPassageIndex', 0);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.componentRef.setInput('isSubmitted', false);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize showTranslation as false', () => {
    expect(component.showTranslation()).toBe(false);
  });

  describe('toggleTranslation', () => {
    it('should toggle showTranslation value', () => {
      expect(component.showTranslation()).toBe(false);
      component.toggleTranslation();
      expect(component.showTranslation()).toBe(true);
      component.toggleTranslation();
      expect(component.showTranslation()).toBe(false);
    });
  });

  describe('getPassageBadgeClass', () => {
    it('should return badge-single-passage for Single type', () => {
      expect(component.getPassageBadgeClass('Single')).toBe('badge-single-passage');
    });

    it('should return badge-double-passage for Double type', () => {
      expect(component.getPassageBadgeClass('Double')).toBe('badge-double-passage');
    });

    it('should return badge-triple-passage for Triple type', () => {
      expect(component.getPassageBadgeClass('Triple')).toBe('badge-triple-passage');
    });

    it('should return badge-single-passage as default', () => {
      expect(component.getPassageBadgeClass('Unknown')).toBe('badge-single-passage');
    });
  });
});