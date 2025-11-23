import React, { useState } from 'react';
import { User } from '../types';
import { playSound } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
        setError('Vui lòng điền đầy đủ thông tin.');
        return;
    }
    
    playSound('click');
    setLoading(true);
    
    setTimeout(() => {
      const storedUsers = JSON.parse(localStorage.getItem('lingoflash_users') || '[]');
      
      if (isRegister) {
          if (storedUsers.find((u: User) => u.username === username)) {
              setError('Tên đăng nhập đã tồn tại.');
              setLoading(false);
              playSound('error');
              return;
          }
          
          const newUser: User = {
              id: Date.now().toString(),
              username: username.trim(),
              password: password.trim()
          };
          
          localStorage.setItem('lingoflash_users', JSON.stringify([...storedUsers, newUser]));
          onLogin(newUser);
      } else {
          const user = storedUsers.find((u: User) => u.username === username && u.password === password);
          if (user) {
              onLogin(user);
          } else {
              setError('Sai tên đăng nhập hoặc mật khẩu.');
              playSound('error');
          }
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/20 rounded-full blur-[120px] animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="glass-card bg-white/10 border-white/20 p-8 md:p-12 rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl backdrop-blur-xl animate-scale-in">
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform rotate-3">
             <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            LingoFlash AI
          </h1>
          <p className="text-indigo-200 font-medium text-sm">Nền tảng học từ vựng thông minh</p>
        </div>
        
        <div className="flex mb-8 bg-black/20 p-1.5 rounded-2xl backdrop-blur-sm">
            <button 
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isRegister ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-200 hover:text-white'}`}
                onClick={() => { setIsRegister(false); setError(''); playSound('pop'); }}
            >
                Đăng nhập
            </button>
            <button 
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isRegister ? 'bg-white text-pink-600 shadow-lg' : 'text-indigo-200 hover:text-white'}`}
                onClick={() => { setIsRegister(true); setError(''); playSound('pop'); }}
            >
                Đăng ký
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-indigo-200 uppercase tracking-widest pl-1">
              Tài khoản
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-indigo-400 outline-none transition-all text-white placeholder-white/30 font-medium"
              placeholder="Nhập tên đăng nhập..."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-indigo-200 uppercase tracking-widest pl-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-indigo-400 outline-none transition-all text-white placeholder-white/30 font-medium"
              placeholder="Nhập mật khẩu..."
            />
          </div>

          {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 text-sm font-bold animate-shake">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {error}
              </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-4 px-6 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center text-white text-lg
                ${isRegister 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:shadow-pink-500/40 hover:scale-[1.02]' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-indigo-500/40 hover:scale-[1.02]'
                }`}
          >
            {loading ? (
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isRegister ? 'Tạo tài khoản' : 'Bắt đầu ngay'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-indigo-200/50 font-medium">Powered by Gemini 2.5 Flash</p>
        </div>
      </div>
    </div>
  );
};

export default Login;