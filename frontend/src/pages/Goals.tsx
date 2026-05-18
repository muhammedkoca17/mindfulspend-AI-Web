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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Hedeflerim</h1>
          <p className="text-gray-400">Finansal hedeflerini takip et, her alışverişte hedefe bir adım daha yaklaş.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-purple-500/20"
        >
          <Plus size={20} /> Yeni Hedef
        </button>
      </div>

      {/* Overall Progress */}
      {goals.length > 0 && (
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <TrendingUp className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Genel İlerleme</h2>
                <p className="text-sm text-gray-400">Tüm hedeflerinin toplamı</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-400">%{overallProgress}</p>
              <p className="text-xs text-gray-400">₺{totalSaved.toLocaleString()} / ₺{totalTarget.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-20 space-y-6">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <Target size={48} className="text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-500">Henüz bir hedef eklemedin</h2>
          <p className="text-gray-600">Araba, tatil, ev veya herhangi bir hedef ekleyerek başla!</p>
          <button onClick={() => setShowAdd(true)} className="text-purple-400 hover:text-purple-300 font-medium underline">
            İlk hedefini oluştur →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const pct = Math.min(goal.progress_percent, 100);
            const remaining = goal.target_amount - goal.current_amount;
            const icon = GOAL_ICONS[goal.category] || '🎯';
            const monthlySalary = user.monthly_salary || 0;
            const monthsLeft = monthlySalary > 0 ? Math.ceil(remaining / (monthlySalary * 0.2)) : 0;

            return (
              <div key={goal.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-purple-500/30 transition group">
                {/* Top row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{goal.title}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{goal.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => { setEditGoal(goal); setEditAmount(String(goal.current_amount)); }}
                      className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                      title="Birikimleri Güncelle"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Hedefi Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">İlerleme</span>
                    <span className={`font-bold ${pct >= 100 ? 'text-green-400' : pct >= 50 ? 'text-purple-400' : 'text-orange-400'}`}>
                      %{pct}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${
                        pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Amount details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-900 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Biriken</p>
                    <p className="text-lg font-bold text-green-400">₺{goal.current_amount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Kalan</p>
                    <p className="text-lg font-bold text-orange-400">₺{Math.max(0, remaining).toLocaleString()}</p>
                  </div>
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-700 pt-3">
                  <span>Hedef: ₺{goal.target_amount.toLocaleString()}</span>
                  {goal.target_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(goal.target_date).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                  {monthlySalary > 0 && remaining > 0 && (
                    <span className="text-purple-400">~{monthsLeft} ay kaldı</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Motivational Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">💡 Nasıl Çalışır?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-900 p-4 rounded-xl">
            <p className="text-purple-400 font-bold mb-2">1. Hedef Belirle</p>
            <p className="text-gray-400">Araba, tatil, ev veya acil durum fonu gibi bir hedef oluştur ve hedef tutarını gir.</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl">
            <p className="text-purple-400 font-bold mb-2">2. Birikimlerini Takip Et</p>
            <p className="text-gray-400">Biriktirdiğin tutarı güncelle. AI asistan seni motive etmek için Nudge mesajları gönderir.</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl">
            <p className="text-purple-400 font-bold mb-2">3. Hedefe Ulaş 🎉</p>
            <p className="text-gray-400">Her checkout'ta sistemimiz hedefine olan etkiyi gösterir ve gereksiz harcamalardan korur.</p>
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">🎯 Yeni Hedef Oluştur</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Hedef Adı</label>
                <input
                  type="text"
                  value={addData.title}
                  onChange={e => setAddData({...addData, title: e.target.value})}
                  placeholder="Örn: Kırmızı BMW M3, Bodrum Tatili"
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Hedef Tutarı (₺)</label>
                <input
                  type="number"
                  value={addData.target_amount}
                  onChange={e => setAddData({...addData, target_amount: e.target.value})}
                  placeholder="200000"
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Kategori</label>
                  <select
                    value={addData.category}
                    onChange={e => setAddData({...addData, category: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
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
                  <label className="block text-gray-300 text-sm font-medium mb-2">Hedef Tarihi</label>
                  <input
                    type="date"
                    value={addData.target_date}
                    onChange={e => setAddData({...addData, target_date: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving || !addData.title || !addData.target_amount}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-purple-500/20"
              >
                {saving ? 'Oluşturuluyor...' : 'Hedefi Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal (Update savings) */}
      {editGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">💰 Birikimi Güncelle</h3>
              <button onClick={() => setEditGoal(null)} className="text-gray-500 hover:text-white transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-800 p-4 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Hedef: {editGoal.title}</p>
                <p className="text-lg text-white font-bold">₺{editGoal.target_amount.toLocaleString()}</p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min(editGoal.progress_percent, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Şu anki birikim tutarı (₺)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-2xl font-bold px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition flex justify-center items-center gap-2"
              >
                {saving ? 'Kaydediliyor...' : <><Check size={20} /> Güncelle</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
