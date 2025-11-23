import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupDictionary, playWordAudio } from '../services/gemini';
import { WordData } from '../types';
import { playSound } from '../constants';

const Dictionary: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    playSound('click');

    try {
      const data = await lookupDictionary(query);
      if (data) {
        setResult(data);
        playSound('success');
      } else {
        setError('Không tìm thấy từ này hoặc có lỗi xảy ra.');
        playSound('error');
      }
    } catch (err) {
      setError('Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
       <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mb-6 flex items-center text-gray-500 hover:text-indigo-600 font-bold transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Quay lại Dashboard
          </button>

          <div className="text-center mb-10">
             <h1 className="text-4xl font-black text-gray-800 mb-2">Từ điển AI</h1>
             <p className="text-gray-500">Tra cứu ngữ nghĩa, phát âm và ví dụ chuẩn xác</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
             <form onSubmit={handleSearch} className="relative mb-8">
                <input 
                   type="text" 
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder="Nhập từ tiếng Anh cần tra..."
                   className="w-full pl-6 pr-16 py-5 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-indigo-500 focus:bg-white outline-none text-xl font-medium transition-all"
                />
                <button 
                   type="submit"
                   disabled={loading}
                   className="absolute right-3 top-3 bottom-3 bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                   {loading ? (
                       <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   ) : (
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   )}
                </button>
             </form>

             {error && (
                 <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center font-medium">{error}</div>
             )}

             {result && (
                <div className="animate-fade-in">
                    <div className="flex items-start justify-between mb-6 border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-5xl font-black text-gray-900 mb-2">{result.word}</h2>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold rounded-lg text-sm uppercase tracking-wider">{result.pos}</span>
                                <span className="text-gray-500 font-serif italic text-xl">{result.phonetic}</span>
                            </div>
                        </div>
                        <button 
                           onClick={() => playWordAudio(result.word)}
                           className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110"
                        >
                           <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </button>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Định nghĩa</h3>
                        <p className="text-2xl text-gray-800 font-bold leading-snug">{result.meaning}</p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                         <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Ví dụ</h3>
                         <p className="text-lg text-gray-800 italic font-medium mb-2">"{result.exampleEn}"</p>
                         <p className="text-gray-500">{result.exampleVn}</p>
                    </div>
                    
                    {(result.relatedTerm || result.quizSentence) && (
                        <div className="mt-6 grid grid-cols-1 gap-4">
                             {result.relatedTerm && (
                                 <div className="p-4 bg-blue-50 rounded-xl text-blue-800">
                                     <span className="font-bold text-xs uppercase opacity-70 block mb-1">Liên quan</span>
                                     <span className="text-lg font-bold">{result.relatedTerm}</span>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default Dictionary;