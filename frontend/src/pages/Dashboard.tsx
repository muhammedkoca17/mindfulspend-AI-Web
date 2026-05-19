import React, { useEffect, useState } from 'react';
import { 
  getSpendingBreakdown, getNudgeSuccess, getGoalProgress, getTimeRisk, updateProfile
} from '../services/api';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, RadialBarChart, RadialBar 
} from 'recharts';

import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [newSalary, setNewSalary] = useState('');
  
  const [breakdown, setBreakdown] = useState<any>(null);
  const [nudgeSuccess, setNudgeSuccess] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [timeRisk, setTimeRisk] = useState<any[]>([]);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bdRes, nsRes, gRes, trRes] = await Promise.all([
          getSpendingBreakdown(),
          getNudgeSuccess(),
          getGoalProgress(),
          getTimeRisk()
        ]);
        
        setBreakdown(bdRes.data);
        setNudgeSuccess(Array.isArray(nsRes.data) ? nsRes.data : []);
        setGoals(Array.isArray(gRes.data) ? gRes.data : []);
        setTimeRisk(Array.isArray(trRes.data) ? trRes.data : []);
      } catch (err: any) {
        setError('Dashboard verileri yüklenirken hata oluştu.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-gray-400 p-8 flex items-center justify-center h-full">Veriler analiz ediliyor...</div>;
  }

  const handleUpdateSalary = async () => {
    try {
      const val = parseFloat(newSalary);
      if (val > 0) {
        await updateProfile({ monthly_salary: val });
        const updatedUser = { ...user, monthly_salary: val };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload();
      }
    } catch (err) {
      alert("Maaş güncellenirken bir hata oluştu.");
    }
  };

  // --- Chart Data Formatting ---
  
  // 1. Pie Chart (Essential vs Discretionary)
  const pieData = breakdown ? [
    { name: 'Temel İhtiyaç', value: breakdown.essential_total },
    { name: 'İsteğe Bağlı', value: breakdown.discretionary_total }
  ] : [];
  const PIE_COLORS = ['#22c55e', '#ef4444'];

  // 2. Goal Progress — properly handle 0% progress
  const activeGoal = goals.length > 0 ? goals[0] : null;
  const goalPct = activeGoal ? (activeGoal.pct || 0) : 0;
  const goalRadialData = activeGoal ? [
    { name: 'İlerleme', value: goalPct, fill: '#a855f7' },
  ] : [];

  const totalSpent = (breakdown?.essential_total || 0) + (breakdown?.discretionary_total || 0);
  const budgetUsagePercent = user.monthly_salary > 0 ? Math.round((totalSpent / user.monthly_salary) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-200 px-5 py-4 rounded-xl flex items-center gap-3 backdrop-blur-sm">
          <span className="text-xl">⚠️</span> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-[20px] border border-slate-700/50 shadow-glass relative group animate-slide-up" style={{animationDelay: '0ms'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-[20px] pointer-events-none"></div>
          <p className="text-slate-400 text-sm mb-1.5 flex justify-between items-center font-medium">
            Aylık Net Gelir
            <button onClick={() => {setIsEditingSalary(!isEditingSalary); setNewSalary(String(user.monthly_salary || ''));}} className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500/10 px-2 py-1 rounded-md">Düzenle</button>
          </p>
          {isEditingSalary ? (
            <div className="flex gap-2 mt-2">
              <input type="number" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full bg-slate-900/50 border border-slate-600 text-white px-3 py-1.5 rounded-lg outline-none focus:border-indigo-500 transition-colors" />
              <button onClick={handleUpdateSalary} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg text-sm font-medium transition-colors shadow-glow-purple">Kaydet</button>
            </div>
          ) : (
            <p className="text-3xl font-black font-display text-white tracking-tight">₺{(user.monthly_salary || 0).toLocaleString()}</p>
          )}
        </div>
        
        <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-[20px] border border-slate-700/50 shadow-glass relative animate-slide-up hover:-translate-y-1 transition-transform duration-300 group" style={{animationDelay: '50ms'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-[20px] pointer-events-none group-hover:from-purple-500/10 transition-colors"></div>
          <p className="text-slate-400 text-sm mb-1.5 font-medium">Kalan Bütçe</p>
          <p className="text-3xl font-black font-display text-purple-400 tracking-tight drop-shadow-sm">
            ₺{((user.monthly_salary || 0) - totalSpent).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-[20px] border border-slate-700/50 shadow-glass relative animate-slide-up hover:-translate-y-1 transition-transform duration-300 group" style={{animationDelay: '100ms'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent rounded-[20px] pointer-events-none group-hover:from-rose-500/10 transition-colors"></div>
          <p className="text-slate-400 text-sm mb-1.5 font-medium">Bu Ay Harcanan</p>
          <p className="text-3xl font-black font-display text-rose-400 tracking-tight drop-shadow-sm">
            ₺{totalSpent.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-[20px] border border-slate-700/50 shadow-glass relative animate-slide-up hover:-translate-y-1 transition-transform duration-300 group" style={{animationDelay: '150ms'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-[20px] pointer-events-none group-hover:from-amber-500/10 transition-colors"></div>
          <p className="text-slate-400 text-sm mb-1.5 font-medium flex justify-between">Bütçe Kullanımı <span className={`font-bold ${budgetUsagePercent > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>%{budgetUsagePercent}</span></p>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden border border-slate-700/50">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${budgetUsagePercent > 80 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : budgetUsagePercent > 50 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }} />
          </div>
        </div>
        
        <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-[20px] border border-slate-700/50 shadow-glass relative animate-slide-up hover:-translate-y-1 transition-transform duration-300 group" style={{animationDelay: '200ms'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-[20px] pointer-events-none group-hover:from-emerald-500/10 transition-colors"></div>
          <p className="text-slate-400 text-sm mb-1.5 font-medium">Nudge Tasarrufu</p>
          <p className="text-3xl font-black font-display text-emerald-400 tracking-tight drop-shadow-sm flex items-center gap-2">
            ₺{nudgeSuccess.reduce((acc, curr) => acc + curr.saved_amount, 0).toLocaleString()}
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-md font-sans">Kazanım</span>
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: İhtiyaç vs Dürtüsel */}
        <div className="bg-[#1E293B]/80 backdrop-blur-md p-7 rounded-[24px] border border-slate-700/50 shadow-glass flex flex-col h-96 animate-slide-up" style={{animationDelay: '250ms'}}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold font-display text-white tracking-tight">Harcama Dağılımı</h3>
              <p className="text-sm text-slate-400 mt-1">Temel ihtiyaç vs İsteğe bağlı (Son 30 Gün)</p>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg></div>
          </div>
          <div className="flex-1 mt-4">
            {breakdown && (breakdown.essential_total > 0 || breakdown.discretionary_total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => `₺${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">Henüz harcama verisi yok.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Hedefe Yaklaşım */}
        <div className="bg-[#1E293B]/80 backdrop-blur-md p-7 rounded-[24px] border border-slate-700/50 shadow-glass flex flex-col h-96 animate-slide-up" style={{animationDelay: '300ms'}}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-display text-white tracking-tight">Hedefe Yaklaşım Hızı</h3>
              <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest">{activeGoal ? activeGoal.title : 'Aktif hedef bulunamadı'}</p>
            </div>
            <button 
              onClick={() => navigate('/goals')} 
              className="text-xs text-indigo-400 hover:text-indigo-300 border-b border-indigo-400/30 hover:border-indigo-400 transition-colors pb-0.5 group cursor-pointer"
            >
              Hedefleri Yönet <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
          <div className="flex-1 mt-4 relative flex items-center justify-center">
            {activeGoal ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" barSize={24} data={goalRadialData} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: '#334155' }} dataKey="value" cornerRadius={12} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute text-center pointer-events-none">
                  <p className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 drop-shadow-sm">%{goalPct}</p>
                  <p className="text-xs text-slate-300 mt-1 uppercase tracking-widest font-bold">Tamamlandı</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">₺{activeGoal.current?.toLocaleString()} / ₺{activeGoal.target?.toLocaleString()}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center space-y-4">
                <p className="text-slate-500">Henüz bir hedef eklemedin.</p>
                <button 
                  onClick={() => navigate('/goals')} 
                  className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-5 py-2.5 rounded-xl transition-all duration-300 font-semibold shadow-inner flex items-center gap-2 cursor-pointer"
                >
                  🎯 Hedef Ekle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Nudge Başarısı */}
        <div className="bg-[#1E293B]/80 backdrop-blur-md p-7 rounded-[24px] border border-slate-700/50 shadow-glass flex flex-col h-96 animate-slide-up" style={{animationDelay: '350ms'}}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold font-display text-white tracking-tight">Nudge Başarı Grafiği</h3>
              <p className="text-sm text-slate-400 mt-1">AI uyarılarıyla haftalık ne kadar tasarruf ettin?</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
          </div>
          <div className="flex-1 mt-6">
            {nudgeSuccess.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={nudgeSuccess}>
                  <defs>
                    <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="week" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₺${val}`} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`₺${value}`, 'Tasarruf']}
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
                    itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="saved_amount" stroke="#10B981" strokeWidth={4} dot={{r: 5, fill: '#1E293B', strokeWidth: 2, stroke: '#10B981'}} activeDot={{r: 8, fill: '#10B981', stroke: '#fff', strokeWidth: 2, shadow: '0 0 10px #10B981'}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-center leading-relaxed">Henüz kaydedilmiş bir Nudge tasarrufu yok.<br/>Alışveriş yaptıkça burası dolacak.</div>
            )}
          </div>
        </div>

        {/* Chart 4: Zaman Deseni ve Risk */}
        <div className="bg-[#1E293B]/80 backdrop-blur-md p-7 rounded-[24px] border border-slate-700/50 shadow-glass flex flex-col h-96 animate-slide-up" style={{animationDelay: '400ms'}}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold font-display text-white tracking-tight">Saat Bazlı İmpulsivite</h3>
              <p className="text-sm text-slate-400 mt-1">Hangi saatlerde daha çok dürtüsel harcama riskin var?</p>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
          </div>
          <div className="flex-1 mt-6">
            {timeRisk.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeRisk}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `${val}:00`} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 1]} tickFormatter={(val) => `%${(val*100).toFixed(0)}`} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`%${(value*100).toFixed(1)}`, 'Risk İhtimali']}
                    labelFormatter={(label) => `Saat: ${label}:00`}
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
                    itemStyle={{ color: '#F43F5E', fontWeight: 'bold' }}
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                  />
                  <Bar dataKey="avg_risk" fill="url(#colorRisk)" radius={[6, 6, 0, 0]}>
                    {
                      timeRisk.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avg_risk > 0.5 ? '#F43F5E' : '#6366F1'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">Yeterli işlem verisi yok.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
