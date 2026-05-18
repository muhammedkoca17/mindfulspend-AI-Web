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

  if (loading) return <div className="text-gray-400 p-8 flex items-center justify-center h-full">RFM verisi analiz ediliyor...</div>;
  if (error) return <div className="text-red-400 p-8">{error}</div>;
  if (!rfm) return null;

  const segmentColor = 
    rfm.segment === 'Sadık Tasarrufçu' ? 'text-green-400 border-green-500' :
    rfm.segment === 'Risk Potansiyeli' ? 'text-yellow-400 border-yellow-500' : 'text-red-400 border-red-500';

  const gaugeColor = 
    rfm.segment === 'Sadık Tasarrufçu' ? '#22c55e' :
    rfm.segment === 'Risk Potansiyeli' ? '#eab308' : '#ef4444';

  const pieColors: Record<string, string> = {
    'Sadık Tasarrufçu': '#22c55e',
    'Risk Potansiyeli': '#eab308',
    'İmpulsif / Kırılgan': '#ef4444'
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">RFM Analizi & AI Segmentasyonu</h2>
          <p className="text-gray-400 text-sm">
            Makine Öğrenmesi, son harcamalarınızı Yenilik (Recency), Sıklık (Frequency) ve Tutar (Monetary) üzerinden değerlendirip finansal risk profilinizi belirler.
          </p>
        </div>
        <div className={`mt-4 md:mt-0 px-6 py-3 rounded-xl border-2 bg-gray-900 shadow-inner flex flex-col items-center ${segmentColor}`}>
          <span className="text-xs uppercase tracking-wider font-bold mb-1 opacity-80">Mevcut Segmentin</span>
          <span className="text-xl font-black">{rfm.segment}</span>
          <span className="text-sm mt-1">Risk Skoru: {rfm.rfm_risk.toFixed(2)} / 5.00</span>
        </div>
      </div>

      {/* R-F-M Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recency */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex flex-col items-center shadow-lg group hover:border-gray-500 transition-all relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Recency (Yenilik)</h3>
          <p className="text-xs text-gray-400 text-center mb-6 h-8">En son ne zaman lüks harcama yaptın?</p>
          <div className="w-full h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={[{value: Math.min(rfm.recency_days, 30), fill: '#60a5fa'}]} startAngle={180} endAngle={0}>
                 <PolarAngleAxis type="number" domain={[0, 30]} angleAxisId={0} tick={false} />
                 <RadialBar background dataKey="value" cornerRadius={10} />
               </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-2">
              <span className="text-3xl font-black text-blue-400">{rfm.recency_days}</span>
              <span className="block text-xs text-gray-500 font-bold uppercase">Gün Önce</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center bg-gray-900/50 p-3 rounded-lg w-full mt-4">
            Ne kadar yeni alışveriş yaptıysan, AI seni o kadar <strong className="text-blue-400">dürtüsel</strong> kabul eder.
          </p>
        </div>

        {/* Frequency */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex flex-col items-center shadow-lg group hover:border-gray-500 transition-all relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Frequency (Sıklık)</h3>
          <p className="text-xs text-gray-400 text-center mb-6 h-8">Son 30 günde kaç defa lüks harcama yaptın?</p>
          <div className="w-full h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={[{value: Math.min(rfm.frequency, 20), fill: '#a855f7'}]} startAngle={180} endAngle={0}>
                 <PolarAngleAxis type="number" domain={[0, 20]} angleAxisId={0} tick={false} />
                 <RadialBar background dataKey="value" cornerRadius={10} />
               </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-2">
              <span className="text-3xl font-black text-purple-400">{rfm.frequency}</span>
              <span className="block text-xs text-gray-500 font-bold uppercase">Kez</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center bg-gray-900/50 p-3 rounded-lg w-full mt-4">
            Sıklık arttıkça, alışkanlık riski artar ve puanın <strong className="text-purple-400">olumsuz</strong> etkilenir.
          </p>
        </div>

        {/* Monetary */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex flex-col items-center shadow-lg group hover:border-gray-500 transition-all relative overflow-hidden">
           <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Monetary (Tutar)</h3>
          <p className="text-xs text-gray-400 text-center mb-6 h-8">Son 30 günde lüks tüketime ne kadar harcadın?</p>
          <div className="w-full h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={[{value: Math.min(rfm.monetary, 10000), fill: '#fb923c'}]} startAngle={180} endAngle={0}>
                 <PolarAngleAxis type="number" domain={[0, 10000]} angleAxisId={0} tick={false} />
                 <RadialBar background dataKey="value" cornerRadius={10} />
               </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-2">
              <span className="text-2xl font-black text-orange-400">₺{rfm.monetary.toLocaleString()}</span>
              <span className="block text-xs text-gray-500 font-bold uppercase">Toplam</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center bg-gray-900/50 p-3 rounded-lg w-full mt-4">
            Bütçeden gereksiz yere eksilen <strong className="text-orange-400">gerçek miktar.</strong>
          </p>
        </div>
      </div>

      {/* RFM Risk Progression Chart */}
      {historyData.length > 1 && (
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-2">📈 RFM Risk Skoru Zaman Çizelgesi</h3>
          <p className="text-sm text-gray-400 mb-4">Son 2 ayda davranışsal risk puanının haftalık değişimi. Yeşil bölge güvenli, kırmızı bölge riskli.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{fill:'#9ca3af', fontSize:12}} />
                <YAxis domain={[1, 5]} tick={{fill:'#9ca3af', fontSize:12}} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }}
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
          <div className="flex justify-between mt-3 text-xs text-gray-500 px-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> 1.0–2.0: Sadık Tasarrufçu</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> 2.0–3.5: Risk Potansiyeli</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> 3.5–5.0: İmpulsif/Kırılgan</span>
          </div>
        </div>
      )}

      {/* R/F/M Score Progression */}
      {historyData.length > 1 && (
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-2">🔍 R / F / M Bileşen Skorları Değişimi</h3>
          <p className="text-sm text-gray-400 mb-4">Her bileşenin 1–5 arası skorunun haftalık seyri.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{fill:'#9ca3af', fontSize:12}} />
                <YAxis domain={[1, 5]} tick={{fill:'#9ca3af', fontSize:12}} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="r_score" stroke="#60a5fa" strokeWidth={2} dot={{r:4}} name="Recency" />
                <Line type="monotone" dataKey="f_score" stroke="#a855f7" strokeWidth={2} dot={{r:4}} name="Frequency" />
                <Line type="monotone" dataKey="m_score" stroke="#fb923c" strokeWidth={2} dot={{r:4}} name="Monetary" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Sistemdeki RFM Dağılımı</h3>
          <p className="text-sm text-gray-400 mb-4">Diğer kullanıcılar ne durumda?</p>
          <div className="h-64">
            {distData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {distData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">Yeterli veri yok</div>
            )}
          </div>
        </div>

        {/* Model Decision Output */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Model Karar Çıktısı</h3>
            <p className="text-sm text-gray-400 mb-6">
              AI modelimiz puanın <strong>{rfm.rfm_risk.toFixed(2)}</strong> olduğu için şu tutumu sergiliyor:
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl">
                <div className="w-12 h-12 flex-shrink-0 bg-blue-500/20 text-blue-400 flex items-center justify-center rounded-lg border border-blue-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Nudge Agresifliği</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {rfm.rfm_risk > 3.5 ? 'Yüksek — Model seni harcamadan vazgeçirmeye odaklanacak' : 
                     rfm.rfm_risk > 2 ? 'Orta — Model sana hedeflerini hatırlatacak' : 
                     'Düşük — Model kararı sana bırakacak'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl">
                <div className="w-12 h-12 flex-shrink-0 bg-green-500/20 text-green-400 flex items-center justify-center rounded-lg border border-green-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Bütçe Riski Katsayısı</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Bu segmentteki kullanıcılar ay sonu bütçe aşım ihtimali {rfm.rfm_risk > 3.5 ? 'en yüksek' : rfm.rfm_risk > 2 ? 'orta' : 'en düşük'} gruptadır.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-700 pt-4">
            * Bu veriler canlı olarak veritabanındaki son alışverişlerine göre güncellenir.
          </div>
        </div>
      </div>
    </div>
  );
}
