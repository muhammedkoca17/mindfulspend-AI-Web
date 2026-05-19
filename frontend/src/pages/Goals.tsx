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
    return <div className="p-8 text-slate-500 font-bold flex items-center justify-center h-full">Hedefler yükleniyor...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-24 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-4xl font-black font-display text-slate-900 mb-2 tracking-tight">Hedeflerim</h1>
          <p className="text-slate-500 font-medium">Finansal hedeflerini takip et, her alışverişte hedefe bir adım daha yaklaş.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-50 hover:to-green-50 text-white px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2 shadow-glow-green hover:-translate-y-1 hover:scale-105 active:scale-95 group cursor-pointer"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Yeni Hedef
        </button>
      </div>

      {/* Overall Progress */}
      {goals.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-8 relative overflow-hidden animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-150 shadow-inner">
                <TrendingUp size={28} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Genel İlerleme</h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">Tüm hedeflerinin toplamı</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-5xl font-black font-display text-emerald-600 tracking-tighter mb-1">%{overallProgress}</p>
              <p className="text-xs text-slate-500 font-mono tracking-widest font-bold">₺{totalSaved.toLocaleString()} / ₺{totalTarget.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-full bg-[#FAF9F6] rounded-full h-4 shadow-inner overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full rounded-full animate-pulse-soft"></div>
            </div>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-24 space-y-6 bg-white rounded-[32px] border border-slate-200 shadow-sm relative z-10">
          <div className="w-28 h-28 bg-[#FAF9F6] rounded-full flex items-center justify-center mx-auto shadow-inner border border-slate-200 group">
            <Target size={56} className="text-slate-400 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-slate-800 mb-2">Henüz bir hedef eklemedin</h2>
            <p className="text-slate-500 text-lg font-medium">Araba, tatil, ev veya herhangi bir hedef ekleyerek başla!</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="mt-4 text-emerald-600 hover:text-emerald-700 font-bold border-b border-emerald-600/30 hover:border-emerald-600 pb-1 transition-colors text-lg group inline-flex items-center gap-2 cursor-pointer">
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

            return (
              <div 
                key={goal.id} 
                className="bg-white border border-slate-200/80 rounded-[28px] p-7 hover:border-emerald-500/50 hover:shadow-sm transition-all duration-555 group flex flex-col h-full animate-slide-up hover:-translate-y-1.5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Top row */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-slate-200 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">{icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold font-display text-slate-900 tracking-tight leading-tight group-hover:text-emerald-600 transition-colors">{goal.title}</h3>
                      <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1 bg-slate-50 inline-block px-2.5 py-1 rounded border border-slate-200">{goal.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => { setEditGoal(goal); setEditAmount(String(goal.current_amount)); }}
                      className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-200"
                      title="Birikimleri Güncelle"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                      title="Hedefi Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2.5 items-end">
                    <span className="text-slate-400 font-bold">İlerleme</span>
                    <span className={`text-2xl font-black font-display tracking-tighter ${isCompleted ? 'text-emerald-650' : 'text-emerald-600'}`}>
                      %{pct}
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF9F6] rounded-full h-3 shadow-inner border border-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative bg-gradient-to-r from-emerald-500 to-green-600 shadow-glow-green`}
                      style={{ width: `${pct}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full rounded-full animate-pulse-soft"></div>
                    </div>
                  </div>
                </div>

                {/* Amount details */}
                <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                  <div className="bg-[#FAF9F6] p-4 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-inner group-hover:border-emerald-500/20 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Biriken</span>
                      <button
                        onClick={() => {
                          setQuickAddGoal(goal);
                          setQuickAddAmount('');
                        }}
                        className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white p-1.5 rounded-lg transition-colors border border-emerald-250 hover:border-transparent shadow-sm cursor-pointer"
                        title="Birikim Ekle (+)"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-xl font-bold font-display text-emerald-600 tracking-tight">₺{goal.current_amount.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#FAF9F6] p-4 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-inner">
                    <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-widest">Kalan</p>
                    <p className="text-xl font-bold font-display text-amber-600 tracking-tight">₺{Math.max(0, remaining).toLocaleString()}</p>
                  </div>
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-100 pt-4 mt-2">
                  <span>Hedef: ₺{goal.target_amount.toLocaleString()}</span>
                  <div className="flex gap-4">
                    {goal.target_date && (
                      <span className="flex items-center gap-1 font-extrabold text-slate-500">
                        <Calendar size={12} className="text-slate-400" /> {new Date(goal.target_date).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                    {monthlySalary > 0 && remaining > 0 && (
                      <span className="text-emerald-600 font-extrabold">~{monthsLeft} AY KALDI</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Motivational Info */}
      <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm relative z-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-2xl font-bold font-display text-slate-900 mb-6 flex items-center gap-3">
          <span className="text-emerald-600 text-3xl">💡</span> Nasıl Çalışır?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 shadow-inner group hover:-translate-y-1 transition-transform">
            <p className="text-emerald-700 font-bold mb-3 flex items-center gap-2 text-base">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">1</span> Hedef Belirle
            </p>
            <p className="text-slate-500 font-medium leading-relaxed">Araba, tatil, ev veya acil durum fonu gibi bir hedef oluştur ve hedef tutarını gir.</p>
          </div>
          <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 shadow-inner group hover:-translate-y-1 transition-transform">
            <p className="text-emerald-700 font-bold mb-3 flex items-center gap-2 text-base">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">2</span> Birikimlerini Takip Et
            </p>
            <p className="text-slate-500 font-medium leading-relaxed">Biriktirdiğin tutarı güncelle. AI asistan seni motive etmek için Nudge mesajları gönderir.</p>
          </div>
          <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 shadow-inner group hover:-translate-y-1 transition-transform">
            <p className="text-emerald-700 font-bold mb-3 flex items-center gap-2 text-base">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">3</span> Hedefe Ulaş
            </p>
            <p className="text-slate-500 font-medium leading-relaxed">Her checkout'ta sistemimiz hedefine olan etkiyi gösterir ve gereksiz harcamalardan korur.</p>
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-md overflow-hidden shadow-xl animate-scale-in">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center relative overflow-hidden">
              <h3 className="text-2xl font-bold font-display text-slate-900 relative z-10 flex items-center gap-2">🎯 Yeni Hedef Oluştur</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors relative z-10 border border-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-slate-600 text-sm font-bold mb-2 uppercase tracking-wide">Hedef Adı</label>
                <input
                  type="text"
                  value={addData.title}
                  onChange={e => setAddData({...addData, title: e.target.value})}
                  placeholder="Örn: Kırmızı BMW M3, Bodrum Tatili"
                  className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-900 px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium shadow-inner transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-bold mb-2 uppercase tracking-wide">Hedef Tutarı (₺)</label>
                <input
                  type="number"
                  value={addData.target_amount}
                  onChange={e => setAddData({...addData, target_amount: e.target.value})}
                  placeholder="200000"
                  className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-900 px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium shadow-inner transition-all font-display text-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm font-bold mb-2 uppercase tracking-wide">Kategori</label>
                  <select
                    value={addData.category}
                    onChange={e => setAddData({...addData, category: e.target.value})}
                    className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-900 px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium shadow-inner transition-all appearance-none"
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
                  <label className="block text-slate-600 text-sm font-bold mb-2 uppercase tracking-wide">Hedef Tarihi</label>
                  <input
                    type="date"
                    value={addData.target_date}
                    onChange={e => setAddData({...addData, target_date: e.target.value})}
                    className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-900 px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium shadow-inner transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving || !addData.title || !addData.target_amount}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-glow-green disabled:shadow-none hover:scale-[1.02] active:scale-95 cursor-pointer mt-4"
              >
                {saving ? 'Oluşturuluyor...' : 'Hedefi Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal (Update savings) */}
      {editGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-md overflow-hidden shadow-xl animate-scale-in">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center relative overflow-hidden">
              <h3 className="text-2xl font-bold font-display text-slate-900 relative z-10 flex items-center gap-2">💰 Birikimi Güncelle</h3>
              <button onClick={() => setEditGoal(null)} className="text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors relative z-10 border border-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-slate-200 shadow-inner">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-widest mb-1">Hedef: {editGoal.title}</p>
                <p className="text-3xl text-slate-900 font-black font-display tracking-tight">₺{editGoal.target_amount.toLocaleString()}</p>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-4 shadow-inner overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(editGoal.progress_percent, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-bold mb-3 uppercase tracking-wide">Şu anki birikim tutarı (₺)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-slate-250 text-slate-900 text-3xl font-black font-display tracking-tight px-5 py-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-inner transition-all"
                  autoFocus
                />
              </div>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-450 hover:to-green-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex justify-center items-center gap-2 shadow-glow-green disabled:shadow-none hover:-translate-y-1 active:scale-95 mt-4 cursor-pointer"
              >
                {saving ? 'Kaydediliyor...' : <><Check size={22} /> Güncelle</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal (+ Birikim Ekle) */}
      {quickAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-md overflow-hidden shadow-xl animate-scale-in">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center relative overflow-hidden">
              <h3 className="text-2xl font-bold font-display text-slate-900 relative z-10 flex items-center gap-2">➕ Birikim Ekle</h3>
              <button onClick={() => setQuickAddGoal(null)} className="text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors relative z-10 border border-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-slate-200 shadow-inner">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-widest mb-1">Hedef: {quickAddGoal.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl text-emerald-600 font-black font-display tracking-tight">₺{quickAddGoal.current_amount.toLocaleString()}</p>
                  <p className="text-sm text-slate-400 font-bold">/ ₺{quickAddGoal.target_amount.toLocaleString()}</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-4 shadow-inner overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(quickAddGoal.progress_percent, 100)}%` }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-slate-600 text-sm font-bold mb-3 uppercase tracking-wide">Eklenecek Birikim Tutarı (₺)</label>
                <input
                  type="number"
                  value={quickAddAmount}
                  onChange={e => setQuickAddAmount(e.target.value)}
                  placeholder="Miktar girin (örn: 1000)"
                  className="w-full bg-[#FAF9F6] border border-slate-250 text-slate-900 text-3xl font-black font-display tracking-tight px-5 py-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-inner transition-all"
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
                  className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-xl font-bold text-sm transition-colors uppercase tracking-wider cursor-pointer"
                >
                  🎯 Hedefi Doğrudan Tamamla (+₺{(quickAddGoal.target_amount - quickAddGoal.current_amount).toLocaleString()})
                </button>
              )}

              <button
                onClick={() => handleQuickAdd()}
                disabled={saving || !quickAddAmount}
                className="w-full py-4.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex justify-center items-center gap-2 shadow-glow-green disabled:shadow-none hover:-translate-y-1 active:scale-95 mt-4 cursor-pointer"
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
