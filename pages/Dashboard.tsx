import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserSession } from '../types';
import { playSound } from '../constants';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    const allSessions = JSON.parse(localStorage.getItem('lingoflash_sessions') || '[]');
    const userSessions = allSessions.filter((s: UserSession) => s.userId === user.id);
    userSessions.sort((a: UserSession, b: UserSession) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setSessions(userSessions);
  }, [user.id]);

  const handleStartNew = () => {
    playSound('click');
    navigate('/setup');
  };

  const handleContinue = (sessionId: string) => {
    playSound('click');
    navigate(`/study/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-50 border-b border-white/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-800 leading-none">Xin chào, {user.username}</h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Hôm nay bạn muốn học gì?</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => navigate('/dictionary')}
                    className="hidden md:flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors px-4 py-2.5 rounded-xl uppercase tracking-wider"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Từ điển
                </button>
                <button 
                    onClick={onLogout}
                    className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors px-4 py-2.5 rounded-xl hover:bg-slate-100 uppercase tracking-wider"
                >
                Đăng xuất
                </button>
            </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Hero Section */}
        <div className="relative rounded-[2.5rem] p-8 md:p-12 mb-12 overflow-hidden shadow-2xl group cursor-default">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/30 rounded-full blur-[80px] -mr-20 -mt-20 animate-pulse-glow"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/30 rounded-full blur-[80px] -ml-20 -mb-20 animate-float"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-indigo-100 uppercase tracking-widest border border-white/10 mb-4 inline-block">
                 AI Powered Learning
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                Chinh phục tiếng Anh <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-indigo-200">với công nghệ AI</span>
              </h2>
              <p className="text-indigo-100 text-lg leading-relaxed font-light mb-8">
                Lộ trình cá nhân hóa, phát âm chuẩn bản xứ và hệ thống bài tập thông minh giúp bạn ghi nhớ từ vựng lâu hơn 300%.
              </p>
              
              <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleStartNew}
                    className="bg-white text-indigo-700 font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
                  >
                    <div className="p-1 bg-indigo-100 rounded-full">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    Tạo bài học mới
                  </button>
                  <button 
                     onClick={() => navigate('/dictionary')}
                     className="md:hidden bg-indigo-800/50 backdrop-blur-md text-white font-bold py-4 px-8 rounded-2xl hover:bg-indigo-800/70 transition-all border border-indigo-400/30"
                  >
                     Tra từ điển
                  </button>
              </div>
            </div>
            
            {/* Abstract Graphic */}
            <div className="hidden md:block relative">
                 <div className="w-64 h-64 glass-card rounded-3xl transform rotate-6 border-white/20 flex items-center justify-center animate-float">
                     <span className="text-8xl">🚀</span>
                 </div>
                 <div className="absolute -bottom-6 -left-6 w-48 h-48 glass-card rounded-3xl transform -rotate-6 border-white/20 flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
                     <span className="text-6xl">🎓</span>
                 </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="flex items-center justify-between mb-8">
             <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <span className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-pink-500 rounded-full"></span>
                Tiến độ học tập
            </h3>
        </div>
        
        {sessions.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl grayscale opacity-50">📚</div>
            <p className="text-slate-400 font-medium mb-4 text-lg">Chưa có dữ liệu bài học.</p>
            <button onClick={handleStartNew} className="text-indigo-600 font-bold hover:underline">Bắt đầu hành trình ngay</button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session, idx) => (
              <div 
                key={session.id} 
                className="group bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 relative overflow-hidden cursor-pointer" 
                onClick={() => handleContinue(session.id)}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Progress Ring Background */}
                <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-5 transition-colors duration-500 ${session.completed ? 'bg-green-500' : 'bg-indigo-500'}`}></div>

                <div className="mb-6 relative z-10">
                  <div className="flex justify-between items-start mb-3">
                     <span className="inline-block px-3 py-1 text-[10px] font-extrabold tracking-widest uppercase bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        {session.mode}
                      </span>
                      {session.completed && (
                          <span className="bg-green-100 text-green-600 p-1 rounded-full">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          </span>
                      )}
                  </div>
                  <h4 className="font-bold text-xl text-slate-800 truncate pr-2 mb-1 group-hover:text-indigo-600 transition-colors" title={session.topic}>{session.topic}</h4>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-xs">{session.level}</span>
                      <span>•</span>
                      <span>{session.totalWords} từ</span>
                  </div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoàn thành</span>
                        <span className={`text-2xl font-black ${session.completed ? 'text-green-500' : 'text-indigo-500'}`}>
                            {Math.round(session.progress)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${session.completed ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-400 to-purple-500'}`}
                        style={{ width: `${session.progress}%` }}
                    ></div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-500 flex items-center gap-1 transition-colors">
                        {session.completed ? 'Xem lại kết quả' : 'Tiếp tục học'}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;