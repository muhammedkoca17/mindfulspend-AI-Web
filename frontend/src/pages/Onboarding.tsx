import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeOnboarding } from '../services/api';
import { Plus, Trash2, ArrowRight, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';

const GOAL_CATEGORIES = [
  { id: 'car', label: 'Araba', emoji: '🚗', color: 'from-slate-50 to-red-50/30', border: 'border-slate-200', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80', desc: 'Hayalindeki araba için peşinat biriktir' },
  { id: 'vacation', label: 'Tatil', emoji: '✈️', color: 'from-slate-50 to-sky-50/30', border: 'border-slate-200', img: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=500&q=80', desc: 'Stres atmak için harika bir kaçamak' },
  { id: 'home', label: 'Ev', emoji: '🏠', color: 'from-slate-50 to-emerald-50/30', border: 'border-slate-200', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80', desc: 'Kendi evinin sahibi olma hedefini gerçeğe dönüştür' },
  { id: 'other', label: 'Diğer', emoji: '🎯', color: 'from-slate-50 to-purple-50/30', border: 'border-slate-200', img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&q=80', desc: 'Eğitim, yatırım veya acil durum fonu' },
];

const RISK_PROFILES = [
  { id: 'saver', label: 'Tasarrufçu 🛡️', color: 'from-emerald-50 to-green-50/30', border: 'border-emerald-300', accent: 'text-emerald-700', glow: 'shadow-[0_8px_30px_rgba(16,185,129,0.1)]', desc: 'Geleceği garantiye almak benim için en önemlisi. Gereksiz harcamalardan tamamen kaçınırım.' },
  { id: 'moderate', label: 'Dengeli ⚖️', color: 'from-slate-50 to-emerald-50/20', border: 'border-emerald-300', accent: 'text-emerald-700', glow: 'shadow-[0_8px_30px_rgba(16,185,129,0.1)]', desc: 'Hem bugünü yaşarım hem de yarını düşünürüm. Lükslerim için bütçemi aşmam.' },
  { id: 'spender', label: 'Harcamacı 🔥', color: 'from-rose-50 to-orange-50/20', border: 'border-rose-300', accent: 'text-rose-700', glow: 'shadow-[0_8px_30px_rgba(244,63,94,0.1)]', desc: 'Hayat bir kere yaşanır. İstediğim şeyleri ertelemeyi sevmem, anın tadını çıkarırım.' },
];

const STEPS = ['Finansal Bilgiler', 'Sabit Giderler', 'Hedef Belirle', 'Risk Profili'];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [salary, setSalary] = useState('');
  const [age, setAge] = useState('30');
  const [expenses, setExpenses] = useState([{ name: '', amount: '', category: 'Konut', due_day: '1' }]);
  const [selectedGoalCat, setSelectedGoalCat] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [riskProfile, setRiskProfile] = useState('');

  const addExpense = () => setExpenses([...expenses, { name: '', amount: '', category: 'Diğer', due_day: '1' }]);
  const removeExpense = (i: number) => { const n = [...expenses]; n.splice(i, 1); setExpenses(n); };
  const handleExpenseChange = (i: number, field: string, value: string) => {
    const n = [...expenses]; n[i] = { ...n[i], [field]: value }; setExpenses(n);
  };

  const handleComplete = async () => {
    setLoading(true); setError('');
    try {
      const fixed_expenses = expenses.filter(e => e.name && e.amount).map(e => ({
        name: e.name, amount: parseFloat(e.amount), category: e.category, due_day: parseInt(e.due_day) || 1
      }));
      const goals = selectedGoalCat && goalTitle && goalAmount ? [{ title: goalTitle, target_amount: parseFloat(goalAmount), category: selectedGoalCat, priority: 1 }] : [];
      await completeOnboarding({ monthly_salary: parseFloat(salary), age: parseInt(age) || 30, fixed_expenses, goals, risk_profile: riskProfile || 'moderate' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Onboarding tamamlanırken bir hata oluştu');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col relative overflow-hidden">
      {/* BG Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white border-b border-slate-200/80 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(22,163,74,0.25)]">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-black font-display text-slate-900 text-lg tracking-tight">MindfulSpend</span>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => {
              const s = i + 1;
              const done = s < step;
              const active = s === step;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 transition-all duration-500 ${active ? 'scale-110' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${done ? 'bg-emerald-600 text-white' : active ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_4px_10px_rgba(22,163,74,0.3)]' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                      {done ? <CheckCircle size={14} /> : s}
                    </div>
                    <span className={`text-xs font-bold hidden sm:block ${active ? 'text-slate-900' : done ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`w-8 h-0.5 rounded-full transition-all duration-700 ${done ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-6 pt-10 relative z-10">
        <div className="w-full max-w-4xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-5 py-4 rounded-2xl animate-scale-in">
              <span className="text-red-500 flex-shrink-0">⚠️</span> {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-fade-in max-w-lg mx-auto">
              <div className="text-center mb-10">
                <div className="text-5xl mb-4">💰</div>
                <h2 className="text-4xl font-black font-display tracking-tight mb-3">Finansal Bilgilerini Girelim</h2>
                <p className="text-slate-500 font-medium leading-relaxed">AI asistanın seni tam analiz edebilmesi için aylık gelirini ve yaşını kullanır.</p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-[28px] p-8 shadow-card space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Aylık Net Maaş (₺)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-emerald-600 font-black">₺</span>
                    <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="50000"
                      onKeyDown={(e) => { if (e.key === 'Enter' && salary && age) setStep(2); }}
                      className="w-full bg-[#FAF9F6] border border-slate-200 focus:border-emerald-500 text-slate-900 text-3xl font-black font-display py-4 pl-14 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-inner placeholder:text-slate-300 tracking-tight" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Yaşınız</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="30"
                    onKeyDown={(e) => { if (e.key === 'Enter' && salary && age) setStep(2); }}
                    className="w-full bg-[#FAF9F6] border border-slate-200 focus:border-emerald-500 text-slate-900 text-3xl font-black font-display py-4 px-5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-inner placeholder:text-slate-300 tracking-tight" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-fade-in max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <div className="text-5xl mb-4">📋</div>
                <h2 className="text-4xl font-black font-display tracking-tight mb-3">Sabit Giderler</h2>
                <p className="text-slate-500 font-medium leading-relaxed">Kira, faturalar, Netflix gibi her ay düzenli ödediğin giderlerini ve ödeme günlerini gir.</p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-[28px] p-8 shadow-card space-y-4">
                {expenses.map((exp, idx) => (
                  <div key={idx} className="bg-[#FAF9F6] border border-slate-200/80 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 items-end animate-slide-up hover:border-emerald-500/30 transition-colors" style={{animationDelay:`${idx*60}ms`}}>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Gider Adı</label>
                      <input type="text" value={exp.name} onChange={e => handleExpenseChange(idx,'name',e.target.value)} placeholder="Kira, Netflix..."
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 text-slate-900 px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all text-sm font-medium placeholder:text-slate-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tutar (₺)</label>
                      <input type="number" value={exp.amount} onChange={e => handleExpenseChange(idx,'amount',e.target.value)} placeholder="0"
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 text-slate-900 px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all text-sm font-medium placeholder:text-slate-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kategori</label>
                      <select value={exp.category} onChange={e => handleExpenseChange(idx,'category',e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 text-slate-900 px-3 py-2.5 rounded-xl outline-none text-sm font-medium appearance-none">
                        <option value="Konut">🏠 Kira</option>
                        <option value="Fatura">💡 Fatura</option>
                        <option value="Abonelik">📱 Abonelik</option>
                        <option value="Kredi">💳 Kredi</option>
                        <option value="Diğer">📦 Diğer</option>
                      </select>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Ödeme Günü</label>
                        <input type="number" min="1" max="31" value={exp.due_day} onChange={e => handleExpenseChange(idx,'due_day',e.target.value)} placeholder="1"
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 text-slate-900 px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all text-sm font-medium" />
                      </div>
                      <button onClick={() => removeExpense(idx)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mb-0.5">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={addExpense} className="mt-2 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold px-5 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors text-sm uppercase tracking-wider">
                  <Plus size={18} /> Yeni Gider Ekle
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <div className="text-5xl mb-4">🎯</div>
                <h2 className="text-4xl font-black font-display tracking-tight mb-3">Seni motive eden hedef ne?</h2>
                <p className="text-slate-500 font-medium">Nudge bildirimlerimiz seni bu hedefe bağlı tutacak.</p>
              </div>
              {!selectedGoalCat ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {GOAL_CATEGORIES.map((cat, i) => (
                    <div key={cat.id} onClick={() => setSelectedGoalCat(cat.id)}
                      className={`relative h-64 rounded-[24px] overflow-hidden cursor-pointer border ${cat.border} bg-gradient-to-br ${cat.color} group hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] transition-all duration-500 animate-slide-up`}
                      style={{animationDelay:`${i*80}ms`}}>
                      <img src={cat.img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 group-hover:scale-110 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/50 to-transparent flex flex-col justify-end p-6">
                        <div className="text-3xl mb-2">{cat.emoji}</div>
                        <h3 className="text-2xl font-black font-display text-slate-900 mb-1">{cat.label}</h3>
                        <p className="text-slate-700 text-sm font-medium leading-tight">{cat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-2xl mx-auto bg-white border border-slate-200/80 rounded-[28px] p-8 shadow-card animate-scale-in space-y-6">
                  <button onClick={() => setSelectedGoalCat('')} className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors">
                    <ArrowLeft size={16} /> Kategorilere Dön
                  </button>
                  <div>
                    <div className="text-4xl mb-3">{GOAL_CATEGORIES.find(c => c.id === selectedGoalCat)?.emoji}</div>
                    <h3 className="text-2xl font-bold font-display text-slate-900 mb-1">Harika seçim! Detayları girelim.</h3>
                    <p className="text-slate-500 text-sm font-medium">{GOAL_CATEGORIES.find(c => c.id === selectedGoalCat)?.label} hedefin için bilgileri tamamla</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                      {selectedGoalCat === 'car' ? 'Nasıl bir araba düşünüyorsun?' : selectedGoalCat === 'vacation' ? 'Nereye gitmek istiyorsun?' : selectedGoalCat === 'home' ? 'Nasıl bir ev hayal ediyorsun?' : 'Hedefine kısa bir isim ver'}
                    </label>
                    <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && goalTitle && goalAmount) setStep(4); }}
                      placeholder={selectedGoalCat === 'car' ? 'Örn: Kırmızı BMW M3' : selectedGoalCat === 'vacation' ? 'Örn: Antalya Tatili' : selectedGoalCat === 'home' ? 'Örn: Deniz Manzaralı Ev' : 'Örn: Acil Durum Fonu'}
                      className="w-full bg-[#FAF9F6] border border-slate-200 focus:border-emerald-500 text-slate-900 px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium placeholder:text-slate-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Hedef Bütçe (₺)</label>
                    <input type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder="200000"
                      onKeyDown={(e) => { if (e.key === 'Enter' && goalTitle && goalAmount) setStep(4); }}
                      className="w-full bg-[#FAF9F6] border border-slate-200 focus:border-emerald-500 text-slate-900 text-3xl font-black font-display px-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300 tracking-tight" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <div className="text-5xl mb-4">🧠</div>
                <h2 className="text-4xl font-black font-display tracking-tight mb-3">Mali Karakterin</h2>
                <p className="text-slate-500 font-medium">AI asistanının tavsiyeleri bu profile göre şekillenecek.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {RISK_PROFILES.map((profile, i) => {
                  const selected = riskProfile === profile.id;
                  return (
                    <div key={profile.id} onClick={() => setRiskProfile(profile.id)}
                      className={`relative bg-gradient-to-br ${profile.color} border-2 rounded-[28px] p-8 cursor-pointer transition-all duration-500 animate-slide-up ${selected ? `${profile.border} ${profile.glow} scale-[1.03] bg-white` : 'border-slate-200 bg-white hover:border-emerald-300 hover:-translate-y-1'}`}
                      style={{animationDelay:`${i*100}ms`}}>
                      {selected && (
                        <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-xs font-black text-emerald-700 uppercase tracking-widest animate-scale-in">
                          ✓ Seçildi
                        </div>
                      )}
                      <h3 className="text-2xl font-black font-display text-slate-900 mb-4">{profile.label}</h3>
                      <p className={`text-sm font-medium leading-relaxed ${selected ? 'text-slate-800' : 'text-slate-500'}`}>{profile.desc}</p>
                      <div className={`mt-6 h-1 rounded-full transition-all duration-500 bg-gradient-to-r ${selected ? 'w-full opacity-100' : 'w-0 opacity-0'} from-emerald-500 to-green-600`}></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-200">
            <button onClick={() => setStep(step - 1)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200'}`}>
              <ArrowLeft size={18} /> Geri Dön
            </button>

            {step < 4 ? (
              <button onClick={() => setStep(step + 1)}
                disabled={(step === 1 && (!salary || !age)) || (step === 3 && (!!selectedGoalCat && (!goalTitle || !goalAmount)))}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white px-8 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-[0_4px_20px_rgba(22,163,74,0.2)] hover:shadow-[0_4px_30px_rgba(22,163,74,0.3)] hover:-translate-y-0.5 active:scale-95 group cursor-pointer">
                Sonraki Adım <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button onClick={handleComplete} disabled={!riskProfile || loading}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white px-8 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-[0_4px_20px_rgba(22,163,74,0.2)] hover:shadow-[0_4px_30px_rgba(22,163,74,0.3)] hover:-translate-y-0.5 active:scale-95 group cursor-pointer">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Hazırlanıyor...</> : <>Profilimi Oluştur <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
