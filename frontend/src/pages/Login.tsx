import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      const { access_token, user } = res.data;
      if (!access_token) { setError('Token alınamadı.'); setLoading(false); return; }
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') setError(detail);
      else if (Array.isArray(detail)) setError(detail.map((d: any) => d.msg).join(', '));
      else setError('E-posta veya şifre hatalı');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center relative overflow-hidden">
      {/* Animated background soft orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay:'1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[150px]"></div>
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute w-1.5 h-1.5 bg-emerald-500/30 rounded-full animate-float" style={{
            left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.8}s`, animationDuration: `${3 + i * 0.5}s`
          }}></div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo area */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-[0_8px_30px_rgba(22,163,74,0.25)] mb-5 group hover:scale-110 transition-transform duration-300">
            <Sparkles size={28} className="text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <h1 className="text-4xl font-black font-display text-slate-900 tracking-tight mb-2">MindfulSpend</h1>
          <p className="text-slate-500 font-medium">AI destekli akıllı bütçe yönetimi</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/80 rounded-[32px] p-8 shadow-card animate-scale-in" style={{animationDelay:'0.1s'}}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight mb-1">Hoş Geldin 👋</h2>
            <p className="text-slate-500 text-sm font-medium">Hesabına giriş yap ve kontrolü ele al</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">E-posta</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="email"
                  placeholder="ornek@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-slate-200 focus:border-emerald-500 text-slate-900 pl-11 pr-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-slate-400 font-medium shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Şifre</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-slate-200 focus:border-emerald-500 text-slate-900 pl-11 pr-12 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-slate-400 font-medium shadow-inner"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl animate-scale-in">
                <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-400 text-white rounded-2xl font-bold text-base transition-all duration-300 shadow-[0_4px_20px_rgba(22,163,74,0.2)] hover:shadow-[0_4px_30px_rgba(22,163,74,0.35)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 group mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Giriş yapılıyor...</span>
              ) : (
                <><span>Giriş Yap</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Hesabın yok mu?{' '}
              <Link to="/register" className="text-emerald-600 hover:text-emerald-500 font-bold transition-colors hover:underline underline-offset-2">
                Ücretsiz Kayıt Ol →
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom hint */}
        <p className="text-center text-slate-400 text-xs mt-6 font-medium">
          Verileriniz şifreli ve güvende 🔒
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.4; }
          50% { transform: translateY(-20px); opacity: 0.8; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
