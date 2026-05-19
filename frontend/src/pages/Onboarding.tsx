import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeOnboarding } from '../services/api';
import { Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

const GOAL_CATEGORIES = [
  { id: 'car', label: 'Araba', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80', desc: 'Hayalindeki araba için peşinat biriktir' },
  { id: 'vacation', label: 'Tatil', img: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=500&q=80', desc: 'Stres atmak için harika bir kaçamak' },
  { id: 'home', label: 'Ev', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80', desc: 'Kendi evinin sahibi olma hedefini gerçeğe dönüştür' },
  { id: 'other', label: 'Diğer', img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&q=80', desc: 'Eğitim, yatırım veya acil durum fonu' },
];

const RISK_PROFILES = [
  { id: 'saver', label: 'Tasarrufçu', img: 'https://images.unsplash.com/photo-1537724326059-2ea20251b9c8?w=500&q=80', desc: 'Geleceği garantiye almak benim için en önemlisi. Gereksiz harcamalardan tamamen kaçınırım.' },
  { id: 'moderate', label: 'Dengeli', img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80', desc: 'Hem bugünü yaşarım hem de yarını düşünürüm. Lükslerim için bütçemi aşmam.' },
  { id: 'spender', label: 'Harcamacı', img: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=500&q=80', desc: 'Hayat bir kere yaşanır. İstediğim şeyleri ertelemeyi sevmem, anın tadını çıkarırım.' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Step 1
  const [salary, setSalary] = useState('');
  const [age, setAge] = useState('30');

  // Step 2
  const [expenses, setExpenses] = useState([{ name: '', amount: '', category: 'housing', due_day: '1' }]);

  // Step 3
  const [selectedGoalCat, setSelectedGoalCat] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  // Step 4
  const [riskProfile, setRiskProfile] = useState('');

  const addExpense = () => setExpenses([...expenses, { name: '', amount: '', category: 'other', due_day: '1' }]);
  
  const removeExpense = (index: number) => {
    const newExp = [...expenses];
    newExp.splice(index, 1);
    setExpenses(newExp);
  };

  const handleExpenseChange = (index: number, field: string, value: string) => {
    const newExp = [...expenses];
    newExp[index] = { ...newExp[index], [field]: value };
    setExpenses(newExp);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    
    try {
      const fixed_expenses = expenses
        .filter(e => e.name && e.amount)
        .map(e => ({
          name: e.name,
          amount: parseFloat(e.amount),
          category: e.category,
          due_day: parseInt(e.due_day) || 1
        }));

      const goals = selectedGoalCat && goalTitle && goalAmount ? [{
        title: goalTitle,
        target_amount: parseFloat(goalAmount),
        category: selectedGoalCat,
        priority: 1
      }] : [];

      await completeOnboarding({
        monthly_salary: parseFloat(salary),
        age: parseInt(age) || 30,
        fixed_expenses,
        goals,
        risk_profile: riskProfile || 'moderate'
      });
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Onboarding tamamlanırken bir hata oluştu');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header Progress */}
      <div className="w-full bg-gray-800 p-4 border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            MindfulSpend AI
          </h1>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`h-2 w-16 rounded-full transition-colors ${s <= step ? 'bg-purple-500' : 'bg-gray-700'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          <div className="p-8 flex-1">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* STEP 1: SALARY & AGE */}
            {step === 1 && (
              <div className="animate-fade-in max-w-xl mx-auto text-center py-8">
                <h2 className="text-3xl font-bold mb-4">Aylık Gelirin ve Yaşın Nedir?</h2>
                <p className="text-gray-400 mb-8">AI asistanın, harcamalarını ve davranışsal finans risklerini tam analiz edebilmesi için bu bilgileri kullanacaktır.</p>
                
                <div className="space-y-6 max-w-xs mx-auto">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-medium text-left">Aylık Net Maaş (₺)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">₺</span>
                      <input
                        type="number"
                        value={salary}
                        onChange={e => setSalary(e.target.value)}
                        placeholder="50000"
                        className="w-full bg-gray-700 text-white text-3xl font-bold py-4 pl-12 pr-4 rounded-xl focus:ring-4 focus:ring-purple-500/50 outline-none transition"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-medium text-left">Yaşınız</label>
                    <input
                      type="number"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder="30"
                      className="w-full bg-gray-700 text-white text-3xl font-bold py-4 px-4 rounded-xl focus:ring-4 focus:ring-purple-500/50 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: EXPENSES */}
            {step === 2 && (
              <div className="animate-fade-in max-w-2xl mx-auto py-4">
                <h2 className="text-3xl font-bold mb-2">Sabit Giderler & Dijital Abonelikler</h2>
                <p className="text-gray-400 mb-8">Kira, faturalar, Netflix, Spotify gibi her ay düzenli ödediğin giderleri ve son ödeme günlerini gir. Bu bilgiler Profil sayfanda takip edilecek ve ödeme tarihi yaklaştığında seni uyaracağız.</p>
                
                <div className="space-y-4">
                  {expenses.map((exp, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">Gider Adı (Örn: Kira)</label>
                        <input
                          type="text"
                          value={exp.name}
                          onChange={e => handleExpenseChange(idx, 'name', e.target.value)}
                          className="w-full bg-gray-800 rounded px-3 py-2 outline-none focus:border-purple-500 border border-transparent"
                        />
                      </div>
                      <div className="w-32">
                        <label className="text-xs text-gray-400 block mb-1">Tutar (₺)</label>
                        <input
                          type="number"
                          value={exp.amount}
                          onChange={e => handleExpenseChange(idx, 'amount', e.target.value)}
                          className="w-full bg-gray-800 rounded px-3 py-2 outline-none focus:border-purple-500 border border-transparent"
                        />
                      </div>
                      <div className="w-36">
                        <label className="text-xs text-gray-400 block mb-1">Kategori</label>
                        <select
                          value={exp.category}
                          onChange={e => handleExpenseChange(idx, 'category', e.target.value)}
                          className="w-full bg-gray-800 rounded px-3 py-2 outline-none border border-transparent text-sm"
                        >
                          <option value="Konut">Barınma / Kira</option>
                          <option value="Fatura">Fatura (Elektrik, Su, Doğalgaz)</option>
                          <option value="Abonelik">Dijital Abonelik (Netflix, Spotify)</option>
                          <option value="Kredi">Kredi / Taksit</option>
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="text-xs text-gray-400 block mb-1">Ödeme Günü (1-31)</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={exp.due_day}
                          onChange={e => handleExpenseChange(idx, 'due_day', e.target.value)}
                          placeholder="15"
                          className="w-full bg-gray-800 rounded px-3 py-2 outline-none focus:border-purple-500 border border-transparent text-sm"
                        />
                      </div>
                      <button 
                        onClick={() => removeExpense(idx)}
                        className="mt-5 p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={addExpense}
                  className="mt-6 flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium px-4 py-2 bg-purple-500/10 rounded-lg transition"
                >
                  <Plus size={20} /> Yeni Gider Ekle
                </button>
              </div>
            )}

            {/* STEP 3: GOALS */}
            {step === 3 && (
              <div className="animate-fade-in py-4">
                <h2 className="text-3xl font-bold mb-2">Seni motive edecek hedefin ne?</h2>
                <p className="text-gray-400 mb-8">Nudge (dürtme) bildirimlerimiz seni bu hedefe bağlı tutacak. Lütfen bir hedef seç.</p>
                
                {!selectedGoalCat ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {GOAL_CATEGORIES.map(cat => (
                      <div 
                        key={cat.id} 
                        onClick={() => setSelectedGoalCat(cat.id)}
                        className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-purple-500 transition-all"
                      >
                        <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                          <h3 className="text-2xl font-bold text-white mb-2">{cat.label}</h3>
                          <p className="text-gray-300 text-sm">{cat.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto bg-gray-700/30 p-8 rounded-2xl border border-gray-600">
                    <button 
                      onClick={() => setSelectedGoalCat('')}
                      className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2 text-sm"
                    >
                      <ArrowLeft size={16} /> Kategorilere Dön
                    </button>

                    <h3 className="text-2xl font-bold mb-6">
                      Harika seçim! Hedefinin detaylarını girelim.
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-gray-300 mb-2">
                          {selectedGoalCat === 'car' ? 'Nasıl bir araba düşünüyorsun?' :
                           selectedGoalCat === 'vacation' ? 'Nereye gitmek istiyorsun?' :
                           selectedGoalCat === 'home' ? 'Nasıl bir ev hayal ediyorsun?' : 
                           'Hedefine kısa bir isim ver'}
                        </label>
                        <input
                          type="text"
                          value={goalTitle}
                          onChange={e => setGoalTitle(e.target.value)}
                          placeholder={
                            selectedGoalCat === 'car' ? 'Örn: Kırmızı BMW M3' :
                            selectedGoalCat === 'vacation' ? 'Örn: Antalya Tatili' :
                            selectedGoalCat === 'home' ? 'Örn: Deniz Manzaralı Ev' :
                            'Örn: Acil Durum Fonu'
                          }
                          className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Bu hedef için ne kadar bütçe gerekiyor? (₺)</label>
                        <input
                          type="number"
                          value={goalAmount}
                          onChange={e => setGoalAmount(e.target.value)}
                          placeholder="Örn: 200000"
                          className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: RISK PROFILE */}
            {step === 4 && (
              <div className="animate-fade-in py-4">
                <h2 className="text-3xl font-bold mb-2">Mali Karakterin (Risk Profilin)</h2>
                <p className="text-gray-400 mb-8">AI asistanının sana nasıl tavsiyeler vereceğini belirlemek için harcama karakterini seç.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {RISK_PROFILES.map(profile => (
                    <div 
                      key={profile.id}
                      onClick={() => setRiskProfile(profile.id)}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
                        riskProfile === profile.id ? 'ring-4 ring-purple-500 scale-105 shadow-2xl shadow-purple-500/20' : 'hover:ring-2 hover:ring-gray-500 hover:scale-105'
                      }`}
                    >
                      <div className="h-48 relative">
                        <img src={profile.img} alt={profile.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                      </div>
                      <div className="p-6 bg-gray-800 h-full border-t border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-3">{profile.label}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{profile.desc}</p>
                        
                        <div className="mt-6 flex items-center justify-between">
                          <span className={`text-sm font-semibold ${riskProfile === profile.id ? 'text-purple-400' : 'text-transparent'}`}>
                            Seçildi ✓
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="bg-gray-800 p-6 border-t border-gray-700 flex justify-between items-center">
            <button
              onClick={() => setStep(step - 1)}
              className={`px-6 py-2 rounded-lg font-medium transition ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            >
              Geri Dön
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!salary || !age)) ||
                  (step === 3 && (!selectedGoalCat || !goalTitle || !goalAmount))
                }
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-bold transition"
              >
                Sonraki Adım <ArrowRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!riskProfile || loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-green-500/20 transition"
              >
                {loading ? 'Sistem Hazırlanıyor...' : 'Profilimi Oluştur'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
