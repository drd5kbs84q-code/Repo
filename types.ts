export enum StudyMode {
  VOCABULARY = 'Từ vựng',
  SYNONYMS = 'Từ đồng nghĩa',
  ANTONYMS = 'Từ trái nghĩa',
  PHRASAL_VERBS = 'Cụm động từ'
}

export enum ExerciseType {
  MATCH_MEANING = 'Ghép nghĩa',
  LISTEN_SELECT = 'Nghe & Chọn',
  FILL_BLANK_MC = 'Điền từ (Trắc nghiệm)',
  FILL_BLANK_INPUT = 'Điền từ (Gõ phím)',
  TRANSLATE = 'Dịch câu'
}

export interface WordData {
  id: string;
  word: string;
  meaning: string; // Vietnamese
  pos: string;
  phonetic: string;
  exampleEn: string;
  exampleVn: string;
  relatedTerm?: string; // For synonym/antonym
  relatedMeaning?: string; // Vietnamese meaning of the related term
  quizSentence?: string; // A DIFFERENT sentence used specifically for exercises
  quizSentenceMeaning?: string; // Vietnamese meaning of the quiz sentence
}

export interface UserSession {
  id: string;
  userId: string;
  topic: string;
  level: string;
  mode: StudyMode;
  totalWords: number;
  progress: number; // 0-100
  score: number;
  completed: boolean;
  date: string;
  words: WordData[];
  currentStep: number; // Tracks where user is (learning index or exercise index)
  maxStepReached: number; // To ensure progress doesn't decrease
  phase: 'learning' | 'exercise' | 'summary';
  exerciseResults: Record<string, boolean>; // exerciseId -> correct
}

export interface User {
  id: string;
  username: string;
  password?: string; 
}

export interface ExerciseQuestion {
  id: string;
  wordId: string;
  type: ExerciseType;
  question: string;
  options?: string[]; // For MC
  correctAnswer: string;
  contextAudio?: string; // Text to play (word or related term)
  explanation: string; // Explanation shown after answer
  questionTranslation?: string; // Vietnamese translation of the context/question
}