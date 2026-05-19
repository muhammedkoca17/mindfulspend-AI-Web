import React, { useEffect, useState } from 'react';
import { getRfmScore, getRfmDistribution, getRfmHistory } from '../services/api';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  RadialBarChart, RadialBar, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts';

export default function RfmAnalytics() {
  const [loading, setLoading] = useState(true);
  const [rfm, setRfm] = useState<any>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchRfm = async () => {
      try {
        if (!user.id) return;
        const [rfmRes, distRes, histRes] = await Promise.all([
          getRfmScore(user.id),
          getRfmDistribution(),
          getRfmHistory(user.id),
        ]);
        setRfm(rfmRes.data);
        setDistribution(distRes.data);
        setHistory(histRes.data?.history || []);
      } catch (err: any) {
        console.error(err);
        setError('RFM verisi yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchRfm();
  }, [user.id]);

  if (loading) return <div className="text-slate-500 p-8 flex items-center justify-center h-full font-bold">RFM verisi analiz ediliyor...</div>;
  if (error) return <div className="text-red-700 bg-red-55 border border-red-200 p-8 rounded-2xl">{error}</div>;
  if (!rfm) return null;

  const segmentColor = 
    rfm.segment === 'Sadık Tasarrufçu' ? 'text-emerald-700 border-emerald-250 bg-emerald-50' :
    rfm.segment === 'Risk Potansiyeli' ? 'text-amber-700 border-amber-250 bg-amber-50' : 'text-red-650 border-red-250 bg-red-50';

  const gaugeColor = 
    rfm.segment === 'Sadık Tasarrufçu' ? '#10B981' :
    rfm.segment === 'Risk Potansiyeli' ? '#F59E0B' : '#EF4444';

  const pieColors: Record<string, string> = {
    'Sadık Tasarrufçu': '#10B981',
    'Risk Potansiyeli': '#F59E0B',
    'İmpulsif / Kırılgan': '#EF4444'
  };

  const distData = distribution?.segments?.map((s: any) => ({
    name: s.segment, value: s.count
  })) || [];

  // Format history for charts
  const historyData = history.map((h: any) => {
    const d = new Date(h.computed_at);
    return {
      date: `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`,
      rfm_risk: h.rfm_risk,
      r_score: h.r_score,
      f_score: h.f_score,
      m_score: h.m_score,
      segment: h.segment,
      frequency: h.frequency,
      monetary: h.monetary,
      recency: h.recency_days,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex-1 pr-4">
          <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">RFM Analizi & AI Segmentasyonu</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Makine Öğrenmesi, son harcamalarınızı Yenilik (Recency), Sıklık (Frequency) ve Tutar (Monetary) üzerinden değerlendirip finansal risk profilinizi belirler.
          </p>
        </div>
        <div className={`mt-4 md:mt-0 px-6 py-3 rounded-2xl border-2 flex flex-col items-center shrink-0 ${segmentColor}`}>
          <span className="text-[10px] uppercase tracking-wider font-extrabold mb-1 opacity-80">Mevcut Segmentin</span>
          <span className="text-xl font-black font-display">{rfm.segment}</span>
          <span className="text-xs font-bold mt-1">Risk Skoru: {rfm.rfm_risk.toFixed(2)} / 5.00</span>
        </div>
      </div>

      {/* R-F-M Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recency */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col items-center shadow-sm group hover:border-emerald-500/30 transition-all relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-lg font-bold font-display text-slate-900 mb-1">Recency (Yenilik)</h3>
          <p className="text-xs text-slate-450 text-center mb-6 h-8 font-medium">En son ne zaman lüks harcama yaptın?</p>
          <div className="w-full h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={[{value: Math.min(rfm.recency_days, 30), fill: '#3b82f6'}]} startAngle={180} endAngle={0}>
                 <PolarAngleAxis type="number" domain={[0, 30]} angleAxisId={0} tick={false} />
                 <RadialBar background={{ fill: '#FAF9F6' }} dataKey="value" cornerRadius={10} />
               </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-2">
              <span className="text-3xl font-black font-display text-blue-600">{rfm.recency_days}</span>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gün Önce</span>
            </div>
          </div>
          <p className="text-sm text-slate-650 text-center bg-slate-50 p-3.5 rounded-xl w-full mt-4 border border-slate-200 font-medium">
            Ne kadar yeni alışveriş yaptıysan, AI seni o kadar <strong className="text-blue-600">dürtüsel</strong> kabul eder.
          </p>
        </div>

        {/* Frequency */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col items-center shadow-sm group hover:border-emerald-500/30 transition-all relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
          <h3 className="text-lg font-bold font-display text-slate-900 mb-1">Frequency (Sıklık)</h3>
          <p className="text-xs text-slate-455 text-center mb-6 h-8 font-medium">Son 30 günde kaç defa lüks harcama yaptın?</p>
          <div className="w-full h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={[{value: Math.min(rfm.frequency, 20), fill: '#a855f7'}]} startAngle={180} endAngle={0}>
                 <PolarAngleAxis type="number" domain={[0, 20]} angleAxisId={0} tick={false} />
                 <RadialBar background={{ fill: '#FAF9F6' }} dataKey="value" cornerRadius={10} />
               </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-2">
              <span className="text-3xl font-black font-display text-purple-600">{rfm.frequency}</span>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kez</span>
            </div>
          </div>
          <p className="text-sm text-slate-650 text-center bg-slate-50 p-3.5 rounded-xl w-full mt-4 border border-slate-200 font-medium">
            Sıklık arttıkça, alışkanlık riski artar ve puanın <strong className="text-purple-600">olumsuz</strong> etkilenir.
          </p>
        </div>

        {/* Monetary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col items-center shadow-sm group hover:border-emerald-500/30 transition-all relative overflow-hidden">
           <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-lg font-bold font-display text-slate-900 mb-1">Monetary (Tutar)</h3>
          <p className="text-xs text-slate-455 text-center mb-6 h-8 font-medium">Son 30 günde lüks tüketime ne kadar harcadın?</p>
          <div className="w-full h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={[{value: Math.min(rfm.monetary, 10000), fill: '#f97316'}]} startAngle={180} endAngle={0}>
                 <PolarAngleAxis type="number" domain={[0, 10000]} angleAxisId={0} tick={false} />
                 <RadialBar background={{ fill: '#FAF9F6' }} dataKey="value" cornerRadius={10} />
               </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-2">
              <span className="text-2xl font-black font-display text-orange-600">₺{rfm.monetary.toLocaleString()}</span>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toplam</span>
            </div>
          </div>
          <p className="text-sm text-slate-655 text-center bg-slate-50 p-3.5 rounded-xl w-full mt-4 border border-slate-200 font-medium">
            Bütçeden gereksiz yere eksilen <strong className="text-orange-600">gerçek miktar.</strong>
          </p>
        </div>
      </div>

      {/* RFM Risk Progression Chart */}
      {historyData.length > 1 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold font-display text-slate-900 mb-2">📈 RFM Risk Skoru Zaman Çizelgesi</h3>
          <p className="text-sm text-slate-500 mb-4 font-medium">Son 2 ayda davranışsal risk puanının haftalık değişimi. Yeşil bölge güvenli, kırmızı bölge riskli.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FAF9F6" />
                <XAxis dataKey="date" tick={{fill:'#475569', fontSize:12}} />
                <YAxis domain={[1, 5]} tick={{fill:'#475569', fontSize:12}} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0F172A' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'rfm_risk') return [Number(value).toFixed(2), 'Risk Skoru'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Tarih: ${label}`}
                />
                <Area type="monotone" dataKey="rfm_risk" stroke="#f97316" fill="url(#riskGrad)" strokeWidth={3} dot={{fill:'#f97316', r:5}} activeDot={{r:7}} name="rfm_risk" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-500 px-2 font-bold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> 1.0–2.0: Sadık Tasarrufçu</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> 2.0–3.5: Risk Potansiyeli</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> 3.5–5.0: İmpulsif/Kırılgan</span>
          </div>
        </div>
      )}

      {/* R/F/M Score Progression */}
      {historyData.length > 1 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold font-display text-slate-900 mb-2">🔍 R / F / M Bileşen Skorları Değişimi</h3>
          <p className="text-sm text-slate-500 mb-4 font-medium">Her bileşenin 1–5 arası skorunun haftalık seyri.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FAF9F6" />
                <XAxis dataKey="date" tick={{fill:'#475569', fontSize:12}} />
                <YAxis domain={[1, 5]} tick={{fill:'#475569', fontSize:12}} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0F172A' }} />
                <Line type="monotone" dataKey="r_score" stroke="#3b82f6" strokeWidth={2} dot={{r:4}} name="Recency" />
                <Line type="monotone" dataKey="f_score" stroke="#a855f7" strokeWidth={2} dot={{r:4}} name="Frequency" />
                <Line type="monotone" dataKey="m_score" stroke="#f97316" strokeWidth={2} dot={{r:4}} name="Monetary" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold font-display text-slate-900 mb-4">Sistemdeki RFM Dağılımı</h3>
          <p className="text-sm text-slate-500 mb-4 font-medium">Diğer kullanıcılar ne durumda?</p>
          <div className="h-64">
            {distData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {distData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', color: '#000' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold">Yeterli veri yok</div>
            )}
          </div>
        </div>

        {/* Model Decision Output */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 mb-4">Model Karar Çıktısı</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              AI modelimiz puanın <strong className="text-slate-900 font-extrabold">{rfm.rfm_risk.toFixed(2)}</strong> olduğu için şu tutumu sergiliyor:
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div className="w-12 h-12 flex-shrink-0 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl border border-blue-150 font-bold text-lg">
                  💡
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Nudge Agresifliği</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {rfm.rfm_risk > 3.5 ? 'Yüksek — Model seni harcamadan vazgeçirmeye odaklanacak' : 
                     rfm.rfm_risk > 2 ? 'Orta — Model sana hedeflerini hatırlatacak' : 
                     'Düşük — Model kararı sana bırakacak'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div className="w-12 h-12 flex-shrink-0 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl border border-emerald-150 font-bold text-lg">
                  🎯
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Bütçe Riski Katsayısı</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    Bu segmentteki kullanıcılar ay sonu bütçe aşım ihtimali {rfm.rfm_risk > 3.5 ? 'en yüksek' : rfm.rfm_risk > 2 ? 'orta' : 'en düşük'} gruptadır.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-100 pt-4 font-bold uppercase tracking-wider">
            * Bu veriler canlı olarak veritabanındaki son alışverişlerine göre güncellenir.
          </div>
        </div>
      </div>
    </div>
  );
}
