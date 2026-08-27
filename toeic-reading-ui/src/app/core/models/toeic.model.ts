export interface ToeicQuestion {
  id: string;
  question: string;
  options: string[]; // Four options, e.g., ["option A", "option B", "option C", "option D"]
  correctAnswer: number; // Index of correct answer: 0, 1, 2, 3
  explanation: string; // Explanations in Vietnamese
  translation: string; // Translation of the original sentence to Vietnamese
  category: 'Grammar' | 'Vocabulary' | 'Word Forms';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  categoryStats: {
    [category: string]: { answered: number; correct: number };
  };
  history: Array<{
    questionId: string;
    questionText: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    timestamp: number;
  }>;
}

export interface ToeicPart6Question {
  id: string;
  questionNumber: number;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: 'Grammar' | 'Vocabulary' | 'Word Forms' | 'Sentence Insertion';
}

export interface ToeicPart6Passage {
  id: string;
  text: string;
  translation: string;
  questions: ToeicPart6Question[];
}

export interface ToeicPart7Question {
  id: string;
  questionNumber: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  translation: string;
}

export interface ToeicPart7Passage {
  id: string;
  passageType: 'Single' | 'Double' | 'Triple';
  documentType: string;
  text: string;
  translation: string;
  questions: ToeicPart7Question[];
}
