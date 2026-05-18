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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative group">
          <p className="text-gray-400 text-sm mb-1 flex justify-between items-center">
            Aylık Net Gelir
            <button onClick={() => {setIsEditingSalary(!isEditingSalary); setNewSalary(String(user.monthly_salary || ''));}} className="text-xs text-purple-400 hover:text-purple-300 opacity-0 group-hover:opacity-100 transition">Düzenle</button>
          </p>
          {isEditingSalary ? (
            <div className="flex gap-2 mt-2">
              <input type="number" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-white px-2 py-1 rounded outline-none" />
              <button onClick={handleUpdateSalary} className="bg-purple-600 hover:bg-purple-500 text-white px-3 rounded text-sm">Kaydet</button>
            </div>
          ) : (
            <p className="text-3xl font-bold text-white">₺{(user.monthly_salary || 0).toLocaleString()}</p>
          )}
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Kalan Bütçe</p>
          <p className="text-3xl font-bold text-purple-400">
            ₺{((user.monthly_salary || 0) - totalSpent).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Bu Ay Harcanan</p>
          <p className="text-3xl font-bold text-red-400">
            ₺{totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Bütçe Kullanım Skoru</p>
          <p className={`text-3xl font-bold ${budgetUsagePercent > 80 ? 'text-red-400' : 'text-green-400'}`}>
            %{budgetUsagePercent}
          </p>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${budgetUsagePercent > 80 ? 'bg-red-500' : budgetUsagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }} />
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Nudge Tasarrufu</p>
          <p className="text-3xl font-bold text-green-400">
            ₺{nudgeSuccess.reduce((acc, curr) => acc + curr.saved_amount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: İhtiyaç vs Dürtüsel */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col h-96">
          <div>
            <h3 className="text-lg font-bold text-white">Harcama Dağılımı</h3>
            <p className="text-sm text-gray-400">Temel ihtiyaç vs İsteğe bağlı (Son 30 Gün)</p>
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
              <div className="flex h-full items-center justify-center text-gray-500">Henüz harcama verisi yok.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Hedefe Yaklaşım */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col h-96">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Hedefe Yaklaşım Hızı</h3>
              <p className="text-sm text-gray-400">{activeGoal ? activeGoal.title : 'Aktif hedef bulunamadı'}</p>
            </div>
            <button 
              onClick={() => navigate('/goals')} 
              className="text-xs text-purple-400 hover:text-purple-300 underline"
            >
              Hedefleri Yönet →
            </button>
          </div>
          <div className="flex-1 mt-4 relative flex items-center justify-center">
            {activeGoal ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={goalRadialData} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute text-center pointer-events-none">
                  <p className="text-4xl font-bold text-purple-400">%{goalPct}</p>
                  <p className="text-xs text-gray-400 mt-1">Tamamlandı</p>
                  <p className="text-xs text-gray-500 mt-1">₺{activeGoal.current?.toLocaleString()} / ₺{activeGoal.target?.toLocaleString()}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center space-y-3">
                <p className="text-gray-500">Henüz bir hedef eklemedin.</p>
                <button 
                  onClick={() => navigate('/goals')} 
                  className="text-purple-400 hover:text-purple-300 underline font-medium"
                >
                  🎯 Hedef Ekle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Nudge Başarısı */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col h-96">
          <div>
            <h3 className="text-lg font-bold text-white">Nudge Başarı Grafiği</h3>
            <p className="text-sm text-gray-400">AI uyarılarıyla haftalık ne kadar tasarruf ettin?</p>
          </div>
          <div className="flex-1 mt-4">
            {nudgeSuccess.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={nudgeSuccess}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="week" stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                  <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} tickFormatter={(val) => `₺${val}`} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`₺${value}`, 'Tasarruf']}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Line type="monotone" dataKey="saved_amount" stroke="#22c55e" strokeWidth={3} dot={{r: 6, fill: '#22c55e', strokeWidth: 2, stroke: '#1f2937'}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500 text-center">Henüz kaydedilmiş bir Nudge tasarrufu yok.<br/>Alışveriş yaptıkça burası dolacak.</div>
            )}
          </div>
        </div>

        {/* Chart 4: Zaman Deseni ve Risk */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col h-96">
          <div>
            <h3 className="text-lg font-bold text-white">Saat Bazlı İmpulsivite</h3>
            <p className="text-sm text-gray-400">Hangi saatlerde daha çok dürtüsel harcama riskin var?</p>
          </div>
          <div className="flex-1 mt-4">
            {timeRisk.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeRisk}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="hour" stroke="#9ca3af" tick={{fill: '#9ca3af'}} tickFormatter={(val) => `${val}:00`} />
                  <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} domain={[0, 1]} tickFormatter={(val) => `%${(val*100).toFixed(0)}`} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`%${(value*100).toFixed(1)}`, 'Risk İhtimali']}
                    labelFormatter={(label) => `Saat: ${label}:00`}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Bar dataKey="avg_risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">Yeterli işlem verisi yok.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
