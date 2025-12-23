export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface BlankItem {
  id: number;
  correctAnswer: string;
  options: string[]; // Should contain the correct answer + distractors
  explanation: string; // Why this fits (for feedback)
}

export interface GameData {
  title: string;
  content: string; // The text with placeholders like {{1}}, {{2}}
  englishTranslation: string; // Full translation of the text (without blanks)
  blanks: BlankItem[];
}

export interface UserAnswers {
  [key: number]: string;
}

export enum AppState {
  CONFIG = 'CONFIG',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}
