import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [full_name, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    try {
      const res = await register(email, password, full_name);
      console.log('Register response:', res.data);
      
      const { access_token, user } = res.data;
      if (!access_token) {
        setError('Token alınamadı, backend yanıtını kontrol edin');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/onboarding');
    } catch (err: any) {
      console.error('Register error details:', err.response?.data);
      const detail = err.response?.data?.detail;
      
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        // Pydantic validation errors (e.g. invalid email format)
        const msgs = detail.map((d: any) => {
          if (d.type === 'value_error.email') return 'Lütfen geçerli bir e-posta adresi giriniz.';
          return d.msg;
        });
        setError(msgs.join(', '));
      } else {
        setError(err.response?.data?.message || err.message || 'Kayıt başarısız, lütfen tekrar deneyin.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2">MindfulSpend AI</h1>
        <p className="text-gray-400 mb-6">Akıllı bütçe yönetimine hoş geldin</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Ad Soyad"
            value={full_name}
            onChange={e => setFullName(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <input
            type="password"
            placeholder="Şifre (min 8 karakter)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4">
          Zaten hesabın var mı? <a href="/login" className="text-purple-400 hover:text-purple-300">Giriş yap</a>
        </p>
      </div>
    </div>
  );
}
