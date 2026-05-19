import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, ShoppingCart, User as UserIcon, LogOut, Bell, X, Target, Activity, Sparkles } from 'lucide-react';
import { getFixedExpenses, sendChatMessage } from '../services/api';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [notifications, setNotifications] = useState<any[]>([]);

  // Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'ai', text: 'Merhaba! Ben senin yapay zeka finansal danışmanım. MindfulSpend verilerini (bütçe, hedefler, harcamalar, RFM analizi) analiz ederek sana rehberlik edebilirim. Ne sormak istersin?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, chatOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    if (!textToSend) {
      setChatInput('');
    }

    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setChatLoading(true);

    try {
      const res = await sendChatMessage(text);
      const reply = res.data.reply;
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Üzgünüm, şu an bağlantıda bir sorun yaşıyorum. Lütfen tekrar dene.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const checkExpenses = async () => {
      try {
        const res = await getFixedExpenses();
        const expenses = res.data;
        const today = new Date().getDate();
        
        const upcoming = expenses.filter((exp: any) => {
          const daysLeft = exp.due_day - today;
          return daysLeft >= 0 && daysLeft <= 3;
        });

        if (upcoming.length > 0) {
          setNotifications(upcoming);
        }
      } catch (err) {
        // Silently fail if not logged in or error
      }
    };
    
    if (user.id) {
      checkExpenses();
    }
  }, [user.id]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/market', label: 'Sanal Market', icon: Store },
    { path: '/cart', label: 'Sepetim', icon: ShoppingCart },
    { path: '/goals', label: 'Hedeflerim', icon: Target },
    { path: '/rfm', label: 'RFM Analytics', icon: Activity },
    { path: '/profile', label: 'Profilim', icon: UserIcon },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="flex h-screen bg-[#FAF9F6] text-slate-900 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <aside className="w-80 bg-white border-r border-slate-200/80 flex flex-col shrink-0 z-20">
        {/* Brand Area */}
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(22,163,74,0.25)]">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black font-display tracking-tight text-slate-900 leading-none">MindfulSpend</h1>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">AI Finans</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm group relative ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-600 rounded-r-full shadow-[0_0_8px_rgba(22,163,74,0.8)]" />
                )}
                <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="tracking-wide text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all duration-300 font-bold group cursor-pointer"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="tracking-wide text-sm">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white/80 border-b border-slate-200/80 backdrop-blur-xl flex items-center justify-between px-10 z-10 sticky top-0">
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            {navItems.find((item) => item.path === location.pathname)?.label || 'MindfulSpend'}
          </h2>
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 tracking-wide">{user.full_name}</p>
              <p className="text-[11px] text-emerald-600 uppercase tracking-widest font-extrabold mt-0.5">{user.risk_profile || 'Bilinmiyor'} Profil</p>
            </div>
            <button className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center font-bold text-lg text-white shadow-[0_4px_15px_rgba(22,163,74,0.25)] hover:scale-105 transition-transform duration-300 cursor-pointer">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </button>
          </div>
        </header>

        {/* Global Notifications Container */}
        <div className="absolute top-24 right-10 z-50 flex flex-col gap-3">
          {notifications.map(notif => {
            const daysLeft = notif.due_day - new Date().getDate();
            return (
              <div key={notif.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-card flex items-start gap-4 animate-slide-right w-80 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                <div className="bg-amber-50 p-2.5 rounded-full text-amber-600 shrink-0 mt-0.5">
                  <Bell size={18} className="animate-pulse-soft" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-950 mb-1">Yaklaşan Ödeme</h4>
                  <p className="text-xs text-slate-500">{notif.name} ödemeniz için son <strong className="text-amber-600">{daysLeft === 0 ? "gün!" : `${daysLeft} gün kaldı.`}</strong></p>
                  <p className="text-sm font-bold text-slate-900 mt-1">₺{notif.amount.toLocaleString()}</p>
                </div>
                <button onClick={() => dismissNotification(notif.id)} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-10 relative bg-[#FAF9F6]">
          <div className="max-w-7xl mx-auto h-full relative">
            <Outlet />
          </div>
          
          {/* Gemini Chat Widget */}
          <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end">
            {chatOpen && (
              <div className="bg-white border border-slate-200 w-80 md:w-96 h-[500px] rounded-[24px] shadow-card mb-5 flex flex-col overflow-hidden animate-slide-up origin-bottom-right">
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-emerald-600 to-green-600 flex justify-between items-center relative overflow-hidden shrink-0">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">MindfulSpend Asistanı</h4>
                      <span className="text-[11px] text-emerald-100 font-bold flex items-center gap-1.5 uppercase tracking-wider mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                        Aktif / Hazır
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all relative z-10 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth bg-[#FAF9F6]">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-tr-sm' 
                          : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                      }`}>
                        <p className="text-[13px] leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-white text-slate-400 rounded-2xl rounded-tl-sm px-5 py-4 border border-slate-200">
                        <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick suggestion chips */}
                <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                  {['Bütçem ne durumda?', 'Hedeflerime ne kadar var?', 'Nasıl tasarruf edebilirim?', 'Harcamalarımı analiz et'].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendMessage(chip)}
                      className="px-3 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-500 rounded-full text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-slate-100 bg-white flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="AI danışmanına sorun..."
                    className="flex-1 bg-[#FAF9F6] border border-slate-200 text-slate-900 text-sm px-4 py-2.5 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center justify-center shrink-0 font-bold text-sm cursor-pointer"
                  >
                    Gönder
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className="w-14 h-14 bg-gradient-to-r from-emerald-600 to-green-600 rounded-full shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <span className="text-2xl text-white">✨</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
