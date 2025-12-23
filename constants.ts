import { CEFRLevel } from './types';

export const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LEVEL_DESCRIPTIONS: Record<CEFRLevel, string> = {
  'A1': 'Beginner - Basic vocabulary',
  'A2': 'Elementary - Simple phrases',
  'B1': 'Intermediate - Standard situations',
  'B2': 'Upper Intermediate - Abstract topics',
  'C1': 'Advanced - Flexible & effective',
  'C2': 'Proficiency - Precise & subtle'
};

export const SAMPLE_TOPICS = [
  "Technology & AI",
  "Environmental Sustainability",
  "Global Economics",
  "Modern Art Trends",
  "Travel & Culture",
  "Workplace Psychology"
];

export interface LanguageConfig {
  name: string;
  direction: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageConfig[] = [
  { name: 'English', direction: 'ltr' },
  { name: 'French', direction: 'ltr' },
  { name: 'Hindi', direction: 'ltr' },
  { name: 'Italian', direction: 'ltr' },
  { name: 'Mandarin Chinese', direction: 'ltr' },
  { name: 'Portuguese', direction: 'ltr' },
  { name: 'Spanish', direction: 'ltr' },
  { name: 'Standard Arabic', direction: 'rtl' },
  { name: 'Ukrainian', direction: 'ltr' },
  { name: 'Urdu', direction: 'rtl' },
];
