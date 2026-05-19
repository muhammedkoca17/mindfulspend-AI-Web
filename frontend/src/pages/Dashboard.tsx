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
    return <div className="text-slate-500 p-8 flex items-center justify-center h-full font-bold">Veriler analiz ediliyor...</div>;
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
  const PIE_COLORS = ['#10B981', '#F43F5E'];

  // 2. Goal Progress — properly handle 0% progress
  const activeGoal = goals.length > 0 ? goals[0] : null;
  const goalPct = activeGoal ? (activeGoal.pct || 0) : 0;
  const goalRadialData = activeGoal ? [
    { name: 'İlerleme', value: goalPct, fill: '#10B981' },
  ] : [];

  const totalSpent = (breakdown?.essential_total || 0) + (breakdown?.discretionary_total || 0);
  const budgetUsagePercent = user.monthly_salary > 0 ? Math.round((totalSpent / user.monthly_salary) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
          <span className="text-xl">⚠️</span> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative group animate-slide-up" style={{animationDelay: '0ms'}}>
          <p className="text-slate-500 text-sm mb-1.5 flex justify-between items-center font-bold">
            Aylık Net Gelir
            <button onClick={() => {setIsEditingSalary(!isEditingSalary); setNewSalary(String(user.monthly_salary || ''));}} className="text-xs text-emerald-600 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-extrabold cursor-pointer">Düzenle</button>
          </p>
          {isEditingSalary ? (
            <div className="flex gap-2 mt-2">
              <input type="number" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-900 px-3 py-1.5 rounded-lg outline-none focus:border-emerald-500 transition-colors" />
              <button onClick={handleUpdateSalary} className="bg-emerald-650 hover:bg-emerald-600 text-white px-4 rounded-lg text-sm font-bold transition-colors cursor-pointer">Kaydet</button>
            </div>
          ) : (
            <p className="text-3xl font-black font-display text-slate-900 tracking-tight">₺{(user.monthly_salary || 0).toLocaleString()}</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative animate-slide-up hover:-translate-y-1 transition-transform duration-300 group" style={{animationDelay: '50ms'}}>
          <p className="text-slate-500 text-sm mb-1.5 font-bold">Kalan Bütçe</p>
          <p className="text-3xl font-black font-display text-emerald-600 tracking-tight">
            ₺{((user.monthly_salary || 0) - totalSpent).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative animate-slide-up hover:-translate-y-1 transition-transform duration-300 group" style={{animationDelay: '100ms'}}>
          <p className="text-slate-500 text-sm mb-1.5 font-bold">Bu Ay Harcanan</p>
          <p className="text-3xl font-black font-display text-slate-900 tracking-tight">
            ₺{totalSpent.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative animate-slide-up hover:-translate-y-1 transition-transform duration-300 group" style={{animationDelay: '150ms'}}>
          <p className="text-slate-500 text-sm mb-1.5 font-bold flex justify-between">Bütçe Kullanımı <span className={`font-black ${budgetUsagePercent > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>%{budgetUsagePercent}</span></p>
          <div className="w-full bg-[#FAF9F6] rounded-full h-2 mt-4 overflow-hidden border border-slate-200">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${budgetUsagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative animate-slide-up hover:-translate-y-1 transition-transform duration-300 group" style={{animationDelay: '200ms'}}>
          <p className="text-slate-500 text-sm mb-1.5 font-bold">Nudge Tasarrufu</p>
          <p className="text-3xl font-black font-display text-emerald-600 tracking-tight flex items-center gap-2">
            ₺{nudgeSuccess.reduce((acc, curr) => acc + curr.saved_amount, 0).toLocaleString()}
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded font-sans font-extrabold uppercase tracking-widest">Kazanım</span>
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: İhtiyaç vs Dürtüsel */}
        <div className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-sm flex flex-col h-96 animate-slide-up" style={{animationDelay: '250ms'}}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">Harcama Dağılımı</h3>
              <p className="text-sm text-slate-400 mt-1 font-medium">Temel ihtiyaç vs İsteğe bağlı (Son 30 Gün)</p>
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-150 rounded-lg text-emerald-600">📊</div>
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
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#000' }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-bold">Henüz harcama verisi yok.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Hedefe Yaklaşım */}
        <div className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-sm flex flex-col h-96 animate-slide-up" style={{animationDelay: '300ms'}}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">Hedefe Yaklaşım Hızı</h3>
              <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-extrabold">{activeGoal ? activeGoal.title : 'Aktif hedef bulunamadı'}</p>
            </div>
            <button 
              onClick={() => navigate('/goals')} 
              className="text-xs text-emerald-600 hover:text-emerald-500 border-b border-emerald-600/30 hover:border-emerald-500 transition-colors pb-0.5 group cursor-pointer font-bold"
            >
              Hedefleri Yönet <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
          <div className="flex-1 mt-4 relative flex items-center justify-center">
            {activeGoal ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" barSize={24} data={goalRadialData} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: '#FAF9F6' }} dataKey="value" cornerRadius={12} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute text-center pointer-events-none">
                  <p className="text-4xl font-black font-display text-emerald-600">%{goalPct}</p>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-extrabold">Tamamlandı</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">₺{activeGoal.current?.toLocaleString()} / ₺{activeGoal.target?.toLocaleString()}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center space-y-4">
                <p className="text-slate-400 font-bold">Henüz bir hedef eklemedin.</p>
                <button 
                  onClick={() => navigate('/goals')} 
                  className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-5 py-2.5 rounded-xl border border-emerald-200 hover:border-transparent transition-all duration-300 font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  🎯 Hedef Ekle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Nudge Başarısı */}
        <div className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-sm flex flex-col h-96 animate-slide-up" style={{animationDelay: '350ms'}}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">Nudge Başarı Grafiği</h3>
              <p className="text-sm text-slate-400 mt-1 font-medium">AI uyarılarıyla haftalık ne kadar tasarruf ettin?</p>
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-150 rounded-lg text-emerald-600">💸</div>
          </div>
          <div className="flex-1 mt-6">
            {nudgeSuccess.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={nudgeSuccess}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FAF9F6" vertical={false} />
                  <XAxis dataKey="week" stroke="#94a3b8" tick={{fill: '#475569', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#475569', fontSize: 12}} tickFormatter={(val) => `₺${val}`} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`₺${value}`, 'Tasarruf']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0F172A', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} 
                    itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="saved_amount" stroke="#10B981" strokeWidth={4} dot={{r: 5, fill: '#fff', strokeWidth: 2, stroke: '#10B981'}} activeDot={{r: 8, fill: '#10B981', stroke: '#fff', strokeWidth: 2}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-bold text-center leading-relaxed">Henüz kaydedilmiş bir Nudge tasarrufu yok.<br/>Alışveriş yaptıkça burası dolacak.</div>
            )}
          </div>
        </div>

        {/* Chart 4: Zaman Deseni ve Risk */}
        <div className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-sm flex flex-col h-96 animate-slide-up" style={{animationDelay: '400ms'}}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">Saat Bazlı İmpulsivite</h3>
              <p className="text-sm text-slate-400 mt-1 font-medium">Hangi saatlerde daha çok dürtüsel harcama riskin var?</p>
            </div>
            <div className="p-2 bg-red-50 border border-red-150 rounded-lg text-red-500">⏰</div>
          </div>
          <div className="flex-1 mt-6">
            {timeRisk.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeRisk}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FAF9F6" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" tick={{fill: '#475569', fontSize: 12}} tickFormatter={(val) => `${val}:00`} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#475569', fontSize: 12}} domain={[0, 1]} tickFormatter={(val) => `%${(val*100).toFixed(0)}`} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`%${(value*100).toFixed(1)}`, 'Risk İhtimali']}
                    labelFormatter={(label) => `Saat: ${label}:00`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0F172A', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} 
                    itemStyle={{ color: '#F43F5E', fontWeight: 'bold' }}
                    cursor={{ fill: '#FAF9F6', opacity: 0.8 }}
                  />
                  <Bar dataKey="avg_risk" fill="#10B981" radius={[6, 6, 0, 0]}>
                    {
                      timeRisk.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avg_risk > 0.5 ? '#F43F5E' : '#10B981'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-bold">Yeterli işlem verisi yok.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
