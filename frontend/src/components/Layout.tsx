import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, ShoppingCart, User as UserIcon, LogOut, Bell, X, Target } from 'lucide-react';
import { getFixedExpenses } from '../services/api';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [notifications, setNotifications] = useState<any[]>([]);

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
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-brand-400 bg-clip-text text-transparent">
            MindfulSpend AI
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-400 font-medium'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-gray-800/50 border-b border-gray-700 backdrop-blur-sm flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-semibold">
            {navItems.find((item) => item.path === location.pathname)?.label || 'MindfulSpend'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.risk_profile || 'Bilinmiyor'} Profil</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Global Notifications Container */}
        <div className="absolute top-20 right-8 z-50 flex flex-col gap-3">
          {notifications.map(notif => {
            const daysLeft = notif.due_day - new Date().getDate();
            return (
              <div key={notif.id} className="bg-gray-800 border-l-4 border-orange-500 p-4 rounded-xl shadow-2xl flex items-start gap-4 animate-fade-in w-80">
                <div className="bg-orange-500/20 p-2 rounded-full text-orange-400 shrink-0">
                  <Bell size={20} />
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
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
          
          {/* Gemini Chat Widget placeholder */}
          <div className="fixed bottom-6 right-6 z-40">
            <button className="w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-105 transition-transform">
              <span className="text-2xl">✨</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
