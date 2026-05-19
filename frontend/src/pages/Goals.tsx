import React, { useEffect, useState } from 'react';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../services/api';
import { Target, Plus, X, Edit3, Trash2, TrendingUp, Calendar, Check } from 'lucide-react';

interface GoalData {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  target_date: string | null;
  category: string;
  priority: number;
}

const GOAL_ICONS: Record<string, string> = {
  car: '🚗',
  vacation: '✈️',
  home: '🏠',
  education: '📚',
  emergency: '🛡️',
  other: '🎯',
};

export default function Goals() {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState({ title: '', target_amount: '', category: 'other', target_date: '' });
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editGoal, setEditGoal] = useState<GoalData | null>(null);
  const [editAmount, setEditAmount] = useState('');

  // Quick Add modal
  const [quickAddGoal, setQuickAddGoal] = useState<GoalData | null>(null);
  const [quickAddAmount, setQuickAddAmount] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await getGoals();
      setGoals(Array.isArray(res.data) ? res.data : []);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!addData.title || !addData.target_amount) return;
    setSaving(true);
    try {
      await createGoal({
        title: addData.title,
        target_amount: parseFloat(addData.target_amount),
        category: addData.category,
        target_date: addData.target_date || undefined,
        priority: 1,
      });
      setShowAdd(false);
      setAddData({ title: '', target_amount: '', category: 'other', target_date: '' });
      await loadGoals();
    } catch {
      alert('Hedef oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editGoal) return;
    const val = parseFloat(editAmount);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    try {
      await updateGoal(editGoal.id, { current_amount: val });
      setEditGoal(null);
      await loadGoals();
    } catch {
      alert('Güncelleme başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd = async (amountToAdd?: number) => {
    const targetGoal = quickAddGoal;
    if (!targetGoal) return;
    
    let val = amountToAdd;
    if (val === undefined) {
      val = parseFloat(quickAddAmount);
    }
    
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    try {
      const newAmount = targetGoal.current_amount + val;
      await updateGoal(targetGoal.id, { current_amount: newAmount });
      setQuickAddGoal(null);
      await loadGoals();
    } catch {
      alert('Birikim eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu hedefi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteGoal(id);
      await loadGoals();
    } catch {
      alert('Silme başarısız.');
    }
  };

  const totalTarget = goals.reduce((a, g) => a + g.target_amount, 0);
  const totalSaved = goals.reduce((a, g) => a + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? Math.round(totalSaved / totalTarget * 100) : 0;

  if (loading) {
    return <div className="p-8 text-gray-400 flex items-center justify-center h-full">Hedefler yükleniyor...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-24 relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-full max-w-lg h-64 bg-purple-500/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 tracking-tight">Hedeflerim</h1>
          <p className="text-slate-400 font-medium">Finansal hedeflerini takip et, her alışverişte hedefe bir adım daha yaklaş.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2 shadow-glow-purple hover:-translate-y-1 hover:scale-105 active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Yeni Hedef
        </button>
      </div>

      {/* Overall Progress */}
      {goals.length > 0 && (
        <div className="bg-[#1E293B]/80 backdrop-blur-md border border-slate-700/50 shadow-glass rounded-[32px] p-8 relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-2xl border border-indigo-500/20 shadow-inner">
                <TrendingUp size={28} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display text-white tracking-tight">Genel İlerleme</h2>
                <p className="text-sm text-slate-400 font-medium mt-0.5">Tüm hedeflerinin toplamı</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tighter drop-shadow-sm mb-1">%{overallProgress}</p>
              <p className="text-xs text-slate-400 font-mono tracking-widest font-bold">₺{totalSaved.toLocaleString()} / ₺{totalTarget.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-full bg-[#0F172A] rounded-full h-4 shadow-inner overflow-hidden border border-slate-700/50">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(168,85,247,0.5)]"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full rounded-full animate-pulse-soft"></div>
            </div>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-24 space-y-6 bg-[#1E293B]/40 backdrop-blur-md rounded-[32px] border border-slate-700/50 shadow-glass relative z-10">
          <div className="w-28 h-28 bg-[#0F172A]/80 rounded-full flex items-center justify-center mx-auto shadow-inner border border-slate-700/50 group">
            <Target size={56} className="text-slate-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-slate-300 mb-2">Henüz bir hedef eklemedin</h2>
            <p className="text-slate-500 text-lg">Araba, tatil, ev veya herhangi bir hedef ekleyerek başla!</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="mt-4 text-indigo-400 hover:text-indigo-300 font-bold border-b border-indigo-400/30 hover:border-indigo-400 pb-1 transition-colors text-lg group inline-flex items-center gap-2">
            İlk hedefini oluştur <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {goals.map((goal, index) => {
            const pct = Math.min(goal.progress_percent, 100);
            const remaining = goal.target_amount - goal.current_amount;
            const icon = GOAL_ICONS[goal.category] || '🎯';
            const monthlySalary = user.monthly_salary || 0;
            const monthsLeft = monthlySalary > 0 ? Math.ceil(remaining / (monthlySalary * 0.2)) : 0;
            
            const isCompleted = pct >= 100;
            const statusColor = isCompleted ? 'emerald' : pct >= 50 ? 'indigo' : 'amber';

            return (
              <div 
                key={goal.id} 
                className="bg-[#1E293B]/80 backdrop-blur-md border border-slate-700/50 rounded-[28px] p-7 hover:border-indigo-500/50 hover:shadow-[0_15px_40px_rgba(99,102,241,0.15)] transition-all duration-500 group flex flex-col h-full animate-slide-up hover:-translate-y-1.5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Top row */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl bg-[#0F172A]/50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-slate-700/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">{icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold font-display text-white tracking-tight leading-tight group-hover:text-indigo-300 transition-colors">{goal.title}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 bg-[#0F172A]/50 inline-block px-2 py-0.5 rounded border border-slate-700/50">{goal.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => { setEditGoal(goal); setEditAmount(String(goal.current_amount)); }}
                      className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors border border-transparent hover:border-indigo-500/20"
                      title="Birikimleri Güncelle"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
                      title="Hedefi Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2.5 items-end">
                    <span className="text-slate-400 font-medium">İlerleme</span>
                    <span className={`text-2xl font-black font-display tracking-tighter ${isCompleted ? 'text-emerald-400' : pct >= 50 ? 'text-indigo-400' : 'text-amber-400'}`}>
                      %{pct}
                    </span>
                  </div>
                  <div className="w-full bg-[#0F172A] rounded-full h-3 shadow-inner border border-slate-700/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                        isCompleted ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : pct >= 50 ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full rounded-full animate-pulse-soft"></div>
                    </div>
                  </div>
                </div>

                {/* Amount details */}
                <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                  <div className="bg-[#0F172A]/50 p-4 rounded-2xl flex flex-col justify-between border border-slate-700/30 shadow-inner group-hover:border-emerald-500/20 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Biriken</span>
                      <button
                        onClick={() => {
                          setQuickAddGoal(goal);
                          setQuickAddAmount('');
                        }}
                        className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white p-1.5 rounded-lg transition-colors border border-emerald-500/30 hover:border-transparent shadow-sm"
                        title="Birikim Ekle (+)"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-xl font-bold font-display text-emerald-400 tracking-tight">₺{goal.current_amount.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#0F172A]/50 p-4 rounded-2xl flex flex-col justify-between border border-slate-700/30 shadow-inner">
                    <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-widest">Kalan</p>
                    <p className="text-xl font-bold font-display text-amber-400 tracking-tight">₺{Math.max(0, remaining).toLocaleString()}</p>
                  </div>
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500 border-t border-slate-700/50 pt-4 mt-2">
                  <span>Hedef: ₺{goal.target_amount.toLocaleString()}</span>
                  <div className="flex gap-4">
                    {goal.target_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" /> {new Date(goal.target_date).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                    {monthlySalary > 0 && remaining > 0 && (
                      <span className="text-indigo-400">~{monthsLeft} AY KALDI</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Motivational Info */}
      <div className="bg-[#1E293B]/80 backdrop-blur-md border border-slate-700/50 rounded-[32px] p-8 shadow-glass relative z-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-2xl font-bold font-display text-white mb-6 flex items-center gap-3">
          <span className="text-amber-400 text-3xl">💡</span> Nasıl Çalışır?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="bg-[#0F172A]/50 p-6 rounded-2xl border border-slate-700/30 shadow-inner group hover:-translate-y-1 transition-transform">
            <p className="text-indigo-400 font-bold mb-3 flex items-center gap-2 text-base">
              <span className="bg-indigo-500/20 text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">1</span> Hedef Belirle
            </p>
            <p className="text-slate-400 font-medium leading-relaxed">Araba, tatil, ev veya acil durum fonu gibi bir hedef oluştur ve hedef tutarını gir.</p>
          </div>
          <div className="bg-[#0F172A]/50 p-6 rounded-2xl border border-slate-700/30 shadow-inner group hover:-translate-y-1 transition-transform">
            <p className="text-purple-400 font-bold mb-3 flex items-center gap-2 text-base">
              <span className="bg-purple-500/20 text-purple-300 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">2</span> Birikimlerini Takip Et
            </p>
            <p className="text-slate-400 font-medium leading-relaxed">Biriktirdiğin tutarı güncelle. AI asistan seni motive etmek için Nudge mesajları gönderir.</p>
          </div>
          <div className="bg-[#0F172A]/50 p-6 rounded-2xl border border-slate-700/30 shadow-inner group hover:-translate-y-1 transition-transform">
            <p className="text-emerald-400 font-bold mb-3 flex items-center gap-2 text-base">
              <span className="bg-emerald-500/20 text-emerald-300 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">3</span> Hedefe Ulaş
            </p>
            <p className="text-slate-400 font-medium leading-relaxed">Her checkout'ta sistemimiz hedefine olan etkiyi gösterir ve gereksiz harcamalardan korur.</p>
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1E293B]/95 border border-slate-700/50 rounded-[32px] w-full max-w-md overflow-hidden shadow-glass animate-scale-in">
            <div className="p-8 border-b border-slate-700/50 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
              <h3 className="text-2xl font-bold font-display text-white relative z-10 flex items-center gap-2">🎯 Yeni Hedef Oluştur</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 p-2 rounded-full transition-colors relative z-10 border border-slate-600/30">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-slate-300 text-sm font-bold mb-2 uppercase tracking-wide">Hedef Adı</label>
                <input
                  type="text"
                  value={addData.title}
                  onChange={e => setAddData({...addData, title: e.target.value})}
                  placeholder="Örn: Kırmızı BMW M3, Bodrum Tatili"
                  className="w-full bg-[#0F172A] border border-slate-600/50 text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-inner transition-all hover:border-slate-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-bold mb-2 uppercase tracking-wide">Hedef Tutarı (₺)</label>
                <input
                  type="number"
                  value={addData.target_amount}
                  onChange={e => setAddData({...addData, target_amount: e.target.value})}
                  placeholder="200000"
                  className="w-full bg-[#0F172A] border border-slate-600/50 text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-inner transition-all hover:border-slate-500 font-display text-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-bold mb-2 uppercase tracking-wide">Kategori</label>
                  <select
                    value={addData.category}
                    onChange={e => setAddData({...addData, category: e.target.value})}
                    className="w-full bg-[#0F172A] border border-slate-600/50 text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-inner transition-all hover:border-slate-500 appearance-none"
                  >
                    <option value="car">🚗 Araba</option>
                    <option value="vacation">✈️ Tatil</option>
                    <option value="home">🏠 Ev</option>
                    <option value="education">📚 Eğitim</option>
                    <option value="emergency">🛡️ Acil Durum</option>
                    <option value="other">🎯 Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-bold mb-2 uppercase tracking-wide">Hedef Tarihi</label>
                  <input
                    type="date"
                    value={addData.target_date}
                    onChange={e => setAddData({...addData, target_date: e.target.value})}
                    className="w-full bg-[#0F172A] border border-slate-600/50 text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-inner transition-all hover:border-slate-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving || !addData.title || !addData.target_amount}
                className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-glow-purple disabled:shadow-none hover:scale-[1.02] active:scale-95 cursor-pointer mt-4"
              >
                {saving ? 'Oluşturuluyor...' : 'Hedefi Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal (Update savings) */}
      {editGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1E293B]/95 border border-slate-700/50 rounded-[32px] w-full max-w-md overflow-hidden shadow-glass animate-scale-in">
            <div className="p-8 border-b border-slate-700/50 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
              <h3 className="text-2xl font-bold font-display text-white relative z-10 flex items-center gap-2">💰 Birikimi Güncelle</h3>
              <button onClick={() => setEditGoal(null)} className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 p-2 rounded-full transition-colors relative z-10 border border-slate-600/30">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-[#0F172A]/50 p-5 rounded-2xl border border-slate-700/30 shadow-inner">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Hedef: {editGoal.title}</p>
                <p className="text-3xl text-white font-black font-display tracking-tight">₺{editGoal.target_amount.toLocaleString()}</p>
                <div className="w-full bg-[#1E293B] rounded-full h-2 mt-4 shadow-inner border border-slate-700/50 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min(editGoal.progress_percent, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-bold mb-3 uppercase tracking-wide">Şu anki birikim tutarı (₺)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-600/50 text-white text-3xl font-black font-display tracking-tight px-5 py-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-slate-500"
                  autoFocus
                />
              </div>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none hover:-translate-y-1 active:scale-95 mt-4"
              >
                {saving ? 'Kaydediliyor...' : <><Check size={22} /> Güncelle</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal (+ Birikim Ekle) */}
      {quickAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1E293B]/95 border border-slate-700/50 rounded-[32px] w-full max-w-md overflow-hidden shadow-glass animate-scale-in">
            <div className="p-8 border-b border-slate-700/50 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 pointer-events-none"></div>
              <h3 className="text-2xl font-bold font-display text-white relative z-10 flex items-center gap-2">➕ Birikim Ekle</h3>
              <button onClick={() => setQuickAddGoal(null)} className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 p-2 rounded-full transition-colors relative z-10 border border-slate-600/30">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-[#0F172A]/50 p-5 rounded-2xl border border-slate-700/30 shadow-inner">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Hedef: {quickAddGoal.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl text-emerald-400 font-black font-display tracking-tight">₺{quickAddGoal.current_amount.toLocaleString()}</p>
                  <p className="text-sm text-slate-500 font-bold">/ ₺{quickAddGoal.target_amount.toLocaleString()}</p>
                </div>
                <div className="w-full bg-[#1E293B] rounded-full h-2 mt-4 shadow-inner border border-slate-700/50 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                    style={{ width: `${Math.min(quickAddGoal.progress_percent, 100)}%` }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-bold mb-3 uppercase tracking-wide">Eklenecek Birikim Tutarı (₺)</label>
                <input
                  type="number"
                  value={quickAddAmount}
                  onChange={e => setQuickAddAmount(e.target.value)}
                  placeholder="Miktar girin (örn: 1000)"
                  className="w-full bg-[#0F172A] border border-slate-600/50 text-white text-3xl font-black font-display tracking-tight px-5 py-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner transition-all hover:border-slate-500"
                  autoFocus
                />
              </div>

              {quickAddGoal.target_amount - quickAddGoal.current_amount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const remaining = quickAddGoal.target_amount - quickAddGoal.current_amount;
                    setQuickAddAmount(String(remaining));
                  }}
                  className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-sm transition-colors uppercase tracking-wider"
                >
                  🎯 Hedefi Doğrudan Tamamla (+₺{(quickAddGoal.target_amount - quickAddGoal.current_amount).toLocaleString()})
                </button>
              )}

              <button
                onClick={() => handleQuickAdd()}
                disabled={saving || !quickAddAmount}
                className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none hover:-translate-y-1 active:scale-95 mt-4"
              >
                {saving ? 'Ekleniyor...' : <><Check size={22} /> Birikimi Ekle</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
