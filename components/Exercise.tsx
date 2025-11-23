import React, { useState, useEffect, useRef } from 'react';
import { ExerciseQuestion, ExerciseType, WordData } from '../types';
import { playSound } from '../constants';
import { playWordAudio } from '../services/gemini';

const checkStringSimilarity = (input: string, target: string): boolean => {
  const normalize = (s: string) => s.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
  const s1 = normalize(input);
  const s2 = normalize(target);
  
  if (s1 === s2) return true;
  
  if (s1.split(' ').length >= 3) {
      const words1 = s1.split(' ');
      const words2 = s2.split(' ');
      let matches = 0;
      words1.forEach(w => {
          if (words2.includes(w)) matches++;
      });
      return (matches / words2.length) >= 0.7;
  }
  return s1 === s2;
};

interface ExerciseProps {
  question: ExerciseQuestion;
  wordData: WordData;
  onNext: (correct: boolean, timeTaken: number) => void;
  onPrev: () => void;
  isFirst: boolean;
}

const Exercise: React.FC<ExerciseProps> = ({ question, wordData, onNext, onPrev, isFirst }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setSelectedOption(null);
    setTextInput('');
    setIsSubmitted(false);
    setIsCorrect(false);
    
    // Auto-play audio slightly delayed for smooth UX
    if (question.contextAudio && question.type === ExerciseType.LISTEN_SELECT) {
       setTimeout(() => playWordAudio(question.contextAudio!), 300);
    }
  }, [question]);

  const handleSubmit = () => {
    if (isSubmitted) return;
    
    let correct = false;
    
    if (question.options) {
      correct = selectedOption === question.correctAnswer;
    } else {
      correct = checkStringSimilarity(textInput, question.correctAnswer);
    }

    setIsCorrect(correct);
    setIsSubmitted(true);
    playSound(correct ? 'success' : 'error');
  };

  const handleContinue = () => {
      const timeTaken = Date.now() - startTimeRef.current;
      onNext(isCorrect, timeTaken);
  };

  const handleReplayAudio = () => {
     if (question.contextAudio) playWordAudio(question.contextAudio);
  };

  return (
    <div className="w-full max-w-3xl glass-card rounded-[2rem] p-6 md:p-10 animate-slide-up relative overflow-hidden text-slate-800">
      
      {/* Type Badge & Audio */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-200/50 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                {question.type}
            </span>
          </div>
          {question.contextAudio && (
            <button 
                onClick={handleReplayAudio}
                className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                Nghe lại
            </button>
            )}
      </div>

      <div className="mb-10">
        <h2 className="text-2xl md:text-3xl font-bold leading-normal text-slate-800">
          {question.question}
        </h2>
      </div>

      {/* Input Area */}
      <div className="space-y-4 mb-10">
        {(question.options) ? (
            <div className="grid grid-cols-1 gap-4">
              {question.options.map((opt, idx) => {
                let btnClass = "w-full p-6 rounded-2xl border-2 text-left font-semibold transition-all text-lg flex items-center justify-between group ";
                
                if (isSubmitted) {
                   if (opt === question.correctAnswer) {
                       btnClass += "border-green-500 bg-green-50 text-green-900 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                   } else if (opt === selectedOption && !isCorrect) {
                       btnClass += "border-red-500 bg-red-50 text-red-900";
                   } else {
                       btnClass += "border-transparent bg-gray-50 text-gray-400 opacity-60";
                   }
                } else {
                   btnClass += selectedOption === opt 
                        ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md scale-[1.01]" 
                        : "border-transparent bg-white shadow-sm hover:shadow-md text-slate-600 hover:bg-indigo-50/50 hover:border-indigo-200";
                }

                return (
                  <button
                    key={idx}
                    disabled={isSubmitted}
                    onClick={() => { setSelectedOption(opt); playSound('pop'); }}
                    className={btnClass}
                  >
                    <span>{opt}</span>
                    {isSubmitted && opt === question.correctAnswer && (
                        <div className="bg-green-500 text-white p-1 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                    )}
                    {isSubmitted && opt === selectedOption && !isCorrect && (
                        <div className="bg-red-500 text-white p-1 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></div>
                    )}
                    {!isSubmitted && (
                        <div className={`w-5 h-5 rounded-full border-2 transition-colors ${selectedOption === opt ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 group-hover:border-indigo-300'}`}></div>
                    )}
                  </button>
                );
              })}
            </div>
        ) : (
            <div className="relative">
               <textarea
                 value={textInput}
                 onChange={(e) => setTextInput(e.target.value)}
                 disabled={isSubmitted}
                 placeholder="Gõ câu trả lời của bạn..."
                 className={`w-full p-6 rounded-2xl border-2 outline-none resize-none h-40 text-xl transition-all shadow-inner font-medium ${
                    isSubmitted 
                     ? (isCorrect ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900')
                     : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                 }`}
               />
            </div>
        )}
      </div>

      {/* Feedback Section */}
      {isSubmitted && (
        <div className={`p-6 rounded-2xl mb-8 animate-flip-in relative overflow-hidden ${isCorrect ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                     {isCorrect ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                </div>
                <h3 className={`text-xl font-black ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Tuyệt vời!' : 'Chưa chính xác'}
                </h3>
            </div>

            <div className="pl-12 space-y-4">
                {/* Translation of the question sentence */}
                {question.questionTranslation && (
                    <div className="bg-white/60 p-4 rounded-xl border border-black/5">
                        <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Dịch nghĩa câu hỏi</p>
                        <p className="text-lg font-medium text-slate-800 italic">"{question.questionTranslation}"</p>
                    </div>
                )}

                <div>
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">Giải thích</p>
                    <p className="text-slate-700">{question.explanation}</p>
                </div>
            </div>
            
            {!isCorrect && (
                <div className="mt-4 pl-12 animate-pulse">
                    <div className="inline-block px-4 py-2 bg-white rounded-lg border border-red-200 shadow-sm">
                        <span className="text-red-500 text-xs font-bold uppercase mr-2">Đáp án đúng:</span> 
                        <span className="font-black text-slate-900 text-lg">{question.correctAnswer}</span>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex gap-4 border-t border-gray-100 pt-6">
         {!isFirst && (
             <button
                onClick={onPrev}
                className="px-6 py-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
             >
                Quay lại
             </button>
         )}
         
         {!isSubmitted ? (
             <button
               onClick={handleSubmit}
               disabled={!selectedOption && !textInput.trim()}
               className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0 text-lg"
             >
               Kiểm tra kết quả
             </button>
         ) : (
             <button
               onClick={handleContinue}
               className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1 active:translate-y-0 text-lg group"
             >
               Tiếp tục
               <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
             </button>
         )}
      </div>
    </div>
  );
};

export default Exercise;