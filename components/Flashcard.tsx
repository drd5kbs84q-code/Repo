import React, { useState, useEffect } from 'react';
import { WordData, StudyMode } from '../types';
import { playWordAudio } from '../services/gemini';
import { playSound } from '../constants';

interface FlashcardProps {
  data: WordData;
  onNext: () => void;
  onPrev: () => void;
  isLast: boolean;
  isFirst: boolean;
  mode: StudyMode;
}

const Flashcard: React.FC<FlashcardProps> = ({ data, onNext, onPrev, isLast, isFirst, mode }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [playingState, setPlayingState] = useState<'none' | 'main' | 'related'>('none');

  useEffect(() => {
    setIsFlipped(false);
    setPlayingState('none');
  }, [data]);

  const handleAudio = async (e: React.MouseEvent, text: string, type: 'main' | 'related') => {
    e.stopPropagation();
    if (!text) return;

    setPlayingState(type);
    try {
      await playWordAudio(text);
    } catch (err) {
        console.error(err);
    } finally {
      setPlayingState('none');
    }
  };

  const handleFlip = () => {
    playSound('click');
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative w-full max-w-md h-[550px] perspective-1000 group select-none mx-auto">
      <div 
        className={`relative w-full h-full transition-all duration-700 card-preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
        onClick={handleFlip}
      >
        {/* FRONT SIDE */}
        <div className="absolute w-full h-full glass-card rounded-[2rem] p-8 backface-hidden flex flex-col items-center justify-between shadow-2xl overflow-hidden border border-white/60">
          
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl translate-x-10 translate-y-10"></div>

          <div className="relative z-10 w-full flex justify-between items-start">
             <span className="px-3 py-1 bg-white/50 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-500 uppercase tracking-widest border border-white/50 shadow-sm">
               {isFirst ? 'Start' : 'Thẻ học'}
             </span>
             <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-widest border border-indigo-100 shadow-sm">
                {data.pos}
              </span>
          </div>
          
          <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10">
            <h2 className="text-5xl font-black text-slate-800 mb-2 break-words text-center leading-tight tracking-tight drop-shadow-sm">
                {data.word}
            </h2>
            
            <div className="flex items-center gap-3 mt-2 mb-6">
                <span className="text-slate-500 font-serif italic text-xl tracking-wide">/{data.phonetic}/</span>
                <button 
                    onClick={(e) => handleAudio(e, data.word, 'main')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                        playingState === 'main' 
                        ? 'bg-indigo-600 text-white scale-110 shadow-indigo-500/50' 
                        : 'bg-white text-indigo-600 hover:bg-indigo-50'
                    }`}
                >
                    {playingState === 'main' ? (
                        <span className="animate-pulse">●</span>
                    ) : (
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                </button>
            </div>

            {/* Related Term Section (Synonym/Antonym) */}
            {(mode === StudyMode.SYNONYMS || mode === StudyMode.ANTONYMS) && data.relatedTerm && (
                <div className="w-full mt-2 animate-scale-in">
                     <div className="flex items-center gap-3 mb-2 justify-center opacity-70">
                         <div className="h-px bg-slate-300 w-12"></div>
                         <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-[0.2em]">
                             {mode === StudyMode.SYNONYMS ? 'Đồng nghĩa' : 'Trái nghĩa'}
                         </span>
                         <div className="h-px bg-slate-300 w-12"></div>
                     </div>

                     <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-4 border border-indigo-100/50 shadow-inner flex flex-col items-center group/related">
                        <div className="flex items-center gap-3">
                             <p className="text-2xl font-bold text-slate-700">{data.relatedTerm}</p>
                             <button 
                                onClick={(e) => handleAudio(e, data.relatedTerm!, 'related')}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                    playingState === 'related' 
                                    ? 'bg-pink-500 text-white scale-110' 
                                    : 'bg-white text-pink-500 shadow-sm hover:bg-pink-50'
                                }`}
                             >
                                <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                             </button>
                        </div>
                        {data.relatedMeaning && (
                            <p className="text-sm text-slate-500 mt-1 font-medium">"{data.relatedMeaning}"</p>
                        )}
                     </div>
                </div>
            )}
          </div>

          <div className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 animate-pulse">
             <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
             Chạm để lật
             <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="absolute w-full h-full bg-slate-900 rounded-[2rem] shadow-2xl p-8 backface-hidden rotate-y-180 flex flex-col justify-between text-white border border-slate-700/50 relative overflow-hidden">
          
          {/* Abstract Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/30 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4"></div>

          <div className="relative z-10 flex flex-col h-full">
             <div className="text-center mt-4 mb-6">
                <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mb-2 opacity-80">Định nghĩa</p>
                <h3 className="text-3xl font-bold leading-tight text-white drop-shadow-lg">{data.meaning}</h3>
             </div>

             <div className="flex-1 flex flex-col justify-center">
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg relative group/ex">
                    <div className="absolute -left-1 top-6 bottom-6 w-1 bg-gradient-to-b from-indigo-400 to-pink-400 rounded-r-full"></div>
                    <p className="text-xs text-indigo-200 font-bold uppercase mb-3 tracking-widest">Ví dụ mẫu</p>
                    <p className="text-lg italic font-medium leading-relaxed text-indigo-50 mb-3">"{data.exampleEn}"</p>
                    <p className="text-sm text-slate-300 font-medium border-t border-white/10 pt-2">{data.exampleVn}</p>
                 </div>
             </div>

             <div className="flex gap-4 mt-8">
                 <button 
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    disabled={isFirst}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all border border-white/20 backdrop-blur-sm ${
                        isFirst ? 'opacity-0 pointer-events-none' : 'hover:bg-white/10 text-white'
                    }`}
                 >
                    Quay lại
                 </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="flex-[2] bg-white text-slate-900 font-bold py-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                 >
                    {isLast ? "Làm bài tập" : "Tiếp theo"}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                 </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;