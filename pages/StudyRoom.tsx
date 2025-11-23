import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, UserSession, WordData, ExerciseQuestion, ExerciseType, StudyMode } from '../types';
import { playSound } from '../constants';
import { prefetchAudio } from '../services/gemini';
import Flashcard from '../components/Flashcard';
import Exercise from '../components/Exercise';

interface StudyRoomProps {
  user: User;
}

const StudyRoom: React.FC<StudyRoomProps> = ({ user }) => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<UserSession | null>(null);
  const [generatedExercises, setGeneratedExercises] = useState<ExerciseQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const saveSession = (updatedSession: UserSession) => {
    setSession(updatedSession);
    const allSessions = JSON.parse(localStorage.getItem('lingoflash_sessions') || '[]');
    const newSessions = allSessions.map((s: UserSession) => s.id === updatedSession.id ? updatedSession : s);
    localStorage.setItem('lingoflash_sessions', JSON.stringify(newSessions));
  };

  useEffect(() => {
    const allSessions = JSON.parse(localStorage.getItem('lingoflash_sessions') || '[]');
    const current = allSessions.find((s: UserSession) => s.id === sessionId);
    
    if (!current) {
      navigate('/dashboard');
      return;
    }

    if (current.userId !== user.id) {
      navigate('/login');
      return;
    }

    setSession(current);
    
    if (current.words && current.words.length > 0) {
        generateExercises(current.words, current.mode);
    }

    setLoading(false);
  }, [sessionId]);

  const generateExercises = (words: WordData[], mode: StudyMode) => {
    const exercises: ExerciseQuestion[] = [];
    const isSynAnt = mode === StudyMode.SYNONYMS || mode === StudyMode.ANTONYMS;

    words.forEach((word) => {
      
      // 1. MATCH MEANING
      // If Syn/Ant: Match the Related Term to its meaning. 
      // If we have distinct relatedMeaning, use that.
      if (isSynAnt && word.relatedTerm) {
          exercises.push({
            id: `${word.id}-match-rel`,
            wordId: word.id,
            type: ExerciseType.MATCH_MEANING,
            question: `Chọn nghĩa đúng của từ: ${word.relatedTerm}`,
            correctAnswer: word.relatedMeaning || word.meaning, 
            options: getDistractors(word.relatedMeaning || word.meaning, words.map(w => w.relatedMeaning || w.meaning)),
            explanation: `${word.relatedTerm} (${mode === StudyMode.SYNONYMS ? 'đồng nghĩa' : 'trái nghĩa'} với ${word.word}). Nghĩa: ${word.relatedMeaning || word.meaning}`,
            questionTranslation: "Tìm định nghĩa chính xác"
          });
      } else {
          exercises.push({
            id: `${word.id}-match`,
            wordId: word.id,
            type: ExerciseType.MATCH_MEANING,
            question: `Chọn nghĩa tiếng Việt của từ: ${word.word}`,
            correctAnswer: word.meaning,
            options: getDistractors(word.meaning, words.map(w => w.meaning)),
            explanation: `${word.word}: ${word.meaning}`,
            questionTranslation: "Tìm định nghĩa chính xác"
          });
      }

      // 2. LISTEN & SELECT
      // If Syn/Ant: Listen to Main Word, Select Related Term
      if (isSynAnt && word.relatedTerm) {
          exercises.push({
            id: `${word.id}-listen-syn`,
            wordId: word.id,
            type: ExerciseType.LISTEN_SELECT,
            question: `Nghe từ gốc và chọn từ ${mode === StudyMode.SYNONYMS ? 'ĐỒNG NGHĨA' : 'TRÁI NGHĨA'}`,
            correctAnswer: word.relatedTerm,
            options: getDistractors(word.relatedTerm, words.map(w => w.relatedTerm || w.word)),
            contextAudio: word.word, // Play main word
            explanation: `${word.word} (${word.meaning}) ${mode === StudyMode.SYNONYMS ? '=' : '≠'} ${word.relatedTerm}`,
            questionTranslation: `Nghe và tìm từ liên quan`
          });
      } else {
           exercises.push({
            id: `${word.id}-listen`,
            wordId: word.id,
            type: ExerciseType.LISTEN_SELECT,
            question: "Nghe và chọn từ đúng",
            correctAnswer: word.word,
            options: getDistractors(word.word, words.map(w => w.word)),
            contextAudio: word.word,
            explanation: `${word.word} nghĩa là ${word.meaning}`,
            questionTranslation: "Nghe phát âm và chọn từ vựng tương ứng"
          });
      }

      // 3. FILL BLANK (MC) - Use quizSentence (which is now guaranteed unique)
      const targetWord = (isSynAnt && word.relatedTerm) ? word.relatedTerm : word.word;
      // Fallback to exampleEn only if quizSentence failed to generate, but prompt demands it.
      const sentence = word.quizSentence || word.exampleEn; 
      const sentenceMeaning = word.quizSentenceMeaning || "Dịch nghĩa không có sẵn";
      
      const regex = new RegExp(`\\b${targetWord}\\b`, 'gi');
      const blankSentence = sentence.replace(regex, '_______');
      
      if (blankSentence.includes('_______')) {
          exercises.push({
            id: `${word.id}-fill-mc`,
            wordId: word.id,
            type: ExerciseType.FILL_BLANK_MC,
            question: blankSentence,
            correctAnswer: targetWord,
            options: getDistractors(targetWord, words.map(w => (isSynAnt && w.relatedTerm) ? w.relatedTerm : w.word)),
            explanation: sentence,
            questionTranslation: sentenceMeaning
          });

          // 4. FILL BLANK (INPUT)
          exercises.push({
            id: `${word.id}-fill-input`,
            wordId: word.id,
            type: ExerciseType.FILL_BLANK_INPUT,
            question: blankSentence,
            correctAnswer: targetWord,
            explanation: sentence,
            questionTranslation: sentenceMeaning
          });
      }

      // 5. TRANSLATE
      // Translate the VIETNAMESE example to English.
      exercises.push({
        id: `${word.id}-translate`,
        wordId: word.id,
        type: ExerciseType.TRANSLATE,
        question: `Dịch câu sau sang tiếng Anh: "${word.exampleVn}"`,
        correctAnswer: word.exampleEn,
        explanation: word.exampleEn,
        questionTranslation: word.exampleVn
      });
    });

    setGeneratedExercises(shuffleArray(exercises));
  };

  const getDistractors = (correct: string, all: string[]) => {
    const others = all.filter(x => x && x.toLowerCase() !== correct.toLowerCase());
    while(others.length < 3) others.push("Other");
    
    const shuffled = shuffleArray(others).slice(0, 3);
    return shuffleArray([...shuffled, correct]);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const handlePrev = () => {
    if (!session) return;
    if (session.currentStep > 0) {
        playSound('click');
        saveSession({ ...session, currentStep: session.currentStep - 1 });
    }
  };

  const handleNextWord = () => {
    if (!session) return;
    playSound('click'); 
    
    const nextIndex = session.currentStep + 1;
    const maxReached = Math.max(session.maxStepReached || 0, nextIndex);
    
    if (nextIndex < session.words.length) {
      const progress = (maxReached / (session.words.length + generatedExercises.length)) * 100;
      saveSession({ ...session, currentStep: nextIndex, maxStepReached: maxReached, progress });
    } else {
      // Transition to Exercise
      const progress = 50; 
      saveSession({ 
          ...session, 
          currentStep: 0, 
          maxStepReached: 0, 
          phase: 'exercise', 
          progress 
      });
    }
  };

  const handleNextExercise = (correct: boolean, timeTaken: number) => {
    if (!session) return;
    
    const exId = generatedExercises[session.currentStep].id;
    const alreadyCorrect = session.exerciseResults[exId];
    
    let pointsAdded = 0;
    if (correct && !alreadyCorrect) {
        pointsAdded = 10;
        if (timeTaken < 20000) pointsAdded += 5; // Bonus for speed
    }
    
    const currentScore = session.score + pointsAdded;
    const nextIndex = session.currentStep + 1;
    const currentResults = { ...session.exerciseResults };
    if (correct) currentResults[exId] = true;

    if (nextIndex < generatedExercises.length) {
       // Calculate weighted progress: 50% base + (exercises done / total exercises) * 50%
       const exProgress = (nextIndex / generatedExercises.length) * 50;
       const totalProgress = 50 + exProgress;
       
       saveSession({ 
         ...session, 
         currentStep: nextIndex, 
         progress: Math.max(session.progress, totalProgress),
         score: currentScore,
         exerciseResults: currentResults
       });
    } else {
      // Finish
      saveSession({ 
        ...session, 
        currentStep: nextIndex, 
        phase: 'summary', 
        progress: 100, 
        completed: true,
        score: currentScore,
        exerciseResults: currentResults
      });
      playSound('success');
    }
  };

  if (loading || !session) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium">Đang tải dữ liệu học...</p>
          </div>
      </div>
  );

  // SUMMARY
  if (session.phase === 'summary') {
    const totalExercises = generatedExercises.length;
    const correctCount = Object.values(session.exerciseResults).filter(Boolean).length;
    const percentage = Math.round((correctCount/totalExercises)*100) || 0;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500"></div>
            
            <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
               <span className="text-6xl">🏆</span>
            </div>
            
            <h1 className="text-4xl font-black text-gray-800 mb-2">Tuyệt vời!</h1>
            <p className="text-gray-500 mb-8 text-lg">Bạn đã hoàn thành chủ đề <br/><span className="font-bold text-indigo-600 text-xl">{session.topic}</span></p>

            <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col items-center">
                    <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-2">Điểm số</p>
                    <p className="text-5xl font-black text-indigo-900">{session.score}</p>
                </div>
                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Chính xác</p>
                    <p className="text-5xl font-black text-emerald-900">{percentage}%</p>
                </div>
            </div>
            
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-all transform hover:-translate-y-1"
            >
                Quay về Trang chủ
            </button>
        </div>
      </div>
    );
  }

  // LEARNING PHASE
  if (session.phase === 'learning') {
    const currentWord = session.words[session.currentStep];
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="w-full bg-white px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-20 border-b border-gray-200">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Thoát
          </button>
          <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Học từ mới</span>
              <span className="text-lg font-black text-gray-800">{session.currentStep + 1} <span className="text-gray-300 text-base">/</span> {session.words.length}</span>
          </div>
          <div className="w-10 h-10"></div> 
        </div>
        <div className="h-1 w-full bg-gray-200">
            <div className="h-full bg-indigo-600 transition-all duration-500 ease-out" style={{width: `${((session.currentStep + 1) / session.words.length) * 100}%`}}></div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            <Flashcard 
              data={currentWord} 
              onNext={handleNextWord} 
              onPrev={handlePrev}
              isFirst={session.currentStep === 0}
              isLast={session.currentStep === session.words.length - 1}
              mode={session.mode}
            />
        </div>
      </div>
    );
  }

  // EXERCISE PHASE
  if (session.phase === 'exercise') {
    const currentExercise = generatedExercises[session.currentStep];
    if (!currentExercise) return <div className="flex justify-center mt-20 text-gray-500">Đang tải bài tập...</div>;

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
         <div className="w-full bg-white px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-20 border-b border-gray-200">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Thoát
          </button>
          <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bài tập thực hành</span>
              <span className="text-lg font-black text-gray-800">{session.currentStep + 1} <span className="text-gray-300 text-base">/</span> {generatedExercises.length}</span>
          </div>
          <div className="w-10 h-10"></div>
        </div>
        <div className="h-1 w-full bg-gray-200">
            <div className="h-full bg-green-500 transition-all duration-500 ease-out" style={{width: `${(session.currentStep / generatedExercises.length) * 100}%`}}></div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
           <Exercise 
             question={currentExercise} 
             onNext={handleNextExercise}
             onPrev={handlePrev}
             wordData={session.words.find(w => w.id === currentExercise.wordId)!}
             isFirst={session.currentStep === 0}
           />
        </div>
      </div>
    );
  }

  return null;
};

export default StudyRoom;