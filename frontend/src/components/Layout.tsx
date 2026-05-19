import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, ShoppingCart, User as UserIcon, LogOut, Bell, X, Target, Activity, ArrowRight } from 'lucide-react';
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

    // Clear input
    if (!textToSend) {
      setChatInput('');
    }

    // Add user message
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
    // Check for upcoming fixed expenses
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
    navigate('/login');
  };

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1E293B]/60 backdrop-blur-md border-r border-slate-800/80 flex flex-col relative z-20">
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-black font-display tracking-tight bg-gradient-to-br from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-sm">
            MindfulSpend AI
          </h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ease-out relative overflow-hidden ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 font-semibold shadow-inner'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                )}
                <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="tracking-wide text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all duration-300 font-medium group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="tracking-wide text-sm">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-[#0F172A]/80 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between px-10 z-10 sticky top-0">
          <h2 className="text-2xl font-bold font-display text-white tracking-tight">
            {navItems.find((item) => item.path === location.pathname)?.label || 'MindfulSpend'}
          </h2>
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white tracking-wide">{user.full_name}</p>
              <p className="text-[11px] text-indigo-400 uppercase tracking-widest font-bold mt-0.5">{user.risk_profile || 'Bilinmiyor'} Profil</p>
            </div>
            <button className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-glow-purple hover:scale-105 transition-transform duration-300 cursor-pointer">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </button>
          </div>
        </header>

        {/* Global Notifications Container */}
        <div className="absolute top-24 right-10 z-50 flex flex-col gap-3">
          {notifications.map(notif => {
            const daysLeft = notif.due_day - new Date().getDate();
            return (
              <div key={notif.id} className="bg-[#1E293B] border border-slate-700/50 p-4 rounded-2xl shadow-glass flex items-start gap-4 animate-slide-right w-80 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                <div className="bg-amber-500/20 p-2.5 rounded-full text-amber-400 shrink-0 mt-0.5">
                  <Bell size={18} className="animate-pulse-soft" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">Yaklaşan Ödeme</h4>
                  <p className="text-xs text-gray-400">{notif.name} ödemeniz için son <strong className="text-orange-400">{daysLeft === 0 ? "gün!" : `${daysLeft} gün kaldı.`}</strong></p>
                  <p className="text-sm font-bold text-white mt-1">₺{notif.amount.toLocaleString()}</p>
                </div>
                <button onClick={() => dismissNotification(notif.id)} className="text-gray-500 hover:text-white transition">
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-10 relative">
          <div className="max-w-7xl mx-auto h-full relative">
            <Outlet />
          </div>
          
          {/* Gemini Chat Widget */}
          <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end">
            {chatOpen && (
              <div className="bg-[#1E293B]/95 backdrop-blur-xl border border-slate-700/80 w-80 md:w-96 h-[500px] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.5)] mb-5 flex flex-col overflow-hidden animate-slide-up origin-bottom-right">
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">MindfulSpend Asistanı</h4>
                      <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5 uppercase tracking-wider mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                        Aktif / Hazır
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all relative z-10">
                    <X size={20} />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-slate-700/50 text-slate-200 rounded-tl-sm border border-slate-600/30'
                      }`}>
                        <p className="text-[13px] leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-slate-700/50 text-slate-400 rounded-2xl rounded-tl-sm px-5 py-4 border border-slate-600/30">
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
                <div className="px-4 py-2 bg-gray-900/20 border-t border-gray-850 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
                  {['Bütçem ne durumda?', 'Hedeflerime ne kadar var?', 'Nasıl tasarruf edebilirim?', 'Harcamalarımı analiz et'].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendMessage(chip)}
                      className="px-3 py-1 bg-gray-850 hover:bg-purple-900/30 hover:text-purple-300 border border-gray-700 text-gray-400 rounded-full text-xs font-medium transition shrink-0"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-gray-700 bg-gray-850 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="AI danışmanına sorun..."
                    className="flex-1 bg-gray-900 border border-gray-750 text-white text-sm px-4 py-2.5 rounded-xl focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition flex items-center justify-center shrink-0"
                  >
                    <span className="text-sm font-semibold">Gönder</span>
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className="w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-105 transition-transform"
            >
              <span className="text-2xl">✨</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
