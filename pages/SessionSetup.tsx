import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, StudyMode, UserSession } from '../types';
import { TOPICS, LEVELS, WORD_COUNTS, playSound } from '../constants';
import { generateVocabularyList } from '../services/gemini';

interface SessionSetupProps {
  user: User;
}

const SessionSetup: React.FC<SessionSetupProps> = ({ user }) => {
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<StudyMode>(StudyMode.VOCABULARY);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [level, setLevel] = useState(LEVELS[1]); // A2
  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStart = async () => {
    playSound('click');
    setIsGenerating(true);

    const finalTopic = customTopic.trim() || topic;
    const finalCount = customCount ? parseInt(customCount) : count;
    const safeCount = Math.min(Math.max(finalCount, 3), 50); // Limit between 3 and 50

    try {
      // Generate content
      const words = await generateVocabularyList(finalTopic, level, safeCount, mode);
      
      // Create Session Object
      const newSession: UserSession = {
        id: Date.now().toString(),
        userId: user.id,
        topic: finalTopic,
        level,
        mode,
        totalWords: words.length,
        progress: 0,
        score: 0,
        completed: false,
        date: new Date().toISOString(),
        words,
        currentStep: 0,
        maxStepReached: 0,
        phase: 'learning',
        exerciseResults: {}
      };

      // Save to localStorage
      const currentSessions = JSON.parse(localStorage.getItem('lingoflash_sessions') || '[]');
      localStorage.setItem('lingoflash_sessions', JSON.stringify([...currentSessions, newSession]));

      // Navigate
      navigate(`/study/${newSession.id}`);

    } catch (error) {
      console.error("Failed to start session", error);
      alert("Không thể tạo nội dung. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative">
        
        <button 
            onClick={() => navigate('/dashboard')} 
            className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">Thiết lập bài học</h1>
          <p className="text-gray-500 mt-2">Tùy chỉnh lộ trình học của bạn</p>
        </div>

        <div className="space-y-8">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Chế độ học</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(StudyMode).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); playSound('pop'); }}
                  className={`px-2 py-3 text-sm rounded-xl border-2 transition-all duration-200 font-semibold ${
                    mode === m 
                      ? 'bg-indigo-50 border-primary text-primary shadow-md transform scale-105' 
                      : 'border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Chủ đề</label>
                <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={!!customTopic}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-gray-50 disabled:opacity-50 transition-all cursor-pointer hover:bg-white"
                >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Hoặc chủ đề tùy chỉnh</label>
                <input
                    type="text"
                    placeholder="Nhập chủ đề..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-sm transition-all focus:bg-white bg-gray-50"
                />
             </div>
          </div>

          {/* Level & Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Cấp độ</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-gray-50 cursor-pointer hover:bg-white"
              >
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Số lượng từ</label>
              <div className="flex space-x-2">
                {WORD_COUNTS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setCount(c); setCustomCount(''); playSound('pop'); }}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      count === c && !customCount
                        ? 'bg-primary text-white shadow-lg transform scale-110'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <input 
                    type="number" 
                    placeholder="..."
                    className="w-16 px-2 py-1 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-center text-sm bg-gray-50 focus:bg-white"
                    value={customCount}
                    onChange={(e) => setCustomCount(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-4">
            <button
                onClick={handleStart}
                disabled={isGenerating}
                className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all transform ${
                isGenerating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] hover:shadow-2xl'
                }`}
            >
                {isGenerating ? (
                <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang tạo bài học AI...
                </span>
                ) : (
                'Bắt đầu ngay'
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSetup;