import React, { useEffect, useState } from 'react';
import { getFixedExpenses, createFixedExpense, updateFixedExpense, deleteFixedExpense, updateProfile, getMe } from '../services/api';
import { User, Wallet, Calendar, CreditCard, Plus, X, Edit3, Trash2, Check } from 'lucide-react';

interface Expense {
  id: number;
  name: string;
  amount: number;
  category: string;
  due_day: number;
}

interface ModalData {
  name: string;
  amount: string;
  category: string;
  due_day: string;
}

const EMPTY_MODAL: ModalData = { name: '', amount: '', category: 'Diğer', due_day: '1' };

export default function Profile() {
  const [user, setUser] = useState<any>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalData, setModalData] = useState<ModalData>(EMPTY_MODAL);
  const [saving, setSaving] = useState(false);

  // Salary edit
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');
  const [salaryLoading, setSalaryLoading] = useState(false);

  // Profile edit modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: '', risk_profile: 'moderate', age: '' });

  useEffect(() => {
    // Fetch fresh user data from backend
    getMe().then(res => {
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    }).catch(() => {
      const usr = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(usr);
    });
    loadExpenses();
  }, []);

  const handleSalaryUpdate = async () => {
    const newSalary = parseFloat(salaryInput);
    if (isNaN(newSalary) || newSalary < 0) return;
    setSalaryLoading(true);
    try {
      const res = await updateProfile({ monthly_salary: newSalary });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setEditingSalary(false);
    } catch {
      alert('Maaş güncellenemedi.');
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      const res = await updateProfile({
        full_name: profileData.full_name,
        risk_profile: profileData.risk_profile,
        age: parseInt(profileData.age) || 30
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setShowProfileModal(false);
    } catch {
      alert('Profil güncellenemedi.');
    }
  };

  const loadExpenses = async () => {
    try {
      const res = await getFixedExpenses();
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setModalData(EMPTY_MODAL);
    setShowModal(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingId(exp.id);
    setModalData({
      name: exp.name,
      amount: String(exp.amount),
      category: exp.category,
      due_day: String(exp.due_day),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!modalData.name || !modalData.amount) return;
    setSaving(true);
    try {
      const payload = {
        name: modalData.name,
        amount: parseFloat(modalData.amount),
        category: modalData.category,
        due_day: parseInt(modalData.due_day) || 1,
      };

      if (editingId) {
        await updateFixedExpense(editingId, payload);
      } else {
        await createFixedExpense(payload);
      }
      setShowModal(false);
      await loadExpenses();
    } catch (err) {
      alert('İşlem başarısız oldu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu gideri silmek istediğinize emin misiniz?')) return;
    try {
      await deleteFixedExpense(id);
      await loadExpenses();
    } catch {
      alert('Silme başarısız oldu.');
    }
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remainingBudget = (user.monthly_salary || 0) - totalExpenses;
  const today = new Date().getDate();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Header Profile Section */}
      <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
        
        <div className="w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center border-4 border-purple-500 shrink-0 z-10">
          <User size={64} className="text-purple-400" />
        </div>
        
        <div className="z-10 flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{user.full_name || 'Kullanıcı'}</h1>
              <p className="text-gray-400 text-lg mb-4">{user.email || 'Email adresi bulunamadı'}</p>
            </div>
            <button
              onClick={() => {
                setProfileData({
                  full_name: user.full_name || '',
                  risk_profile: user.risk_profile || 'moderate',
                  age: String(user.age || '30')
                });
                setShowProfileModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 self-center md:self-start border border-purple-500 shadow-lg shadow-purple-500/20"
            >
              <Edit3 size={16} /> Profili Düzenle
            </button>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className="bg-gray-900 px-4 py-2 rounded-full text-sm font-medium border border-gray-700 text-gray-300">
              Risk Profili: {user.risk_profile ? String(user.risk_profile).toUpperCase() : 'BİLİNMİYOR'}
            </span>
            <span className="bg-gray-900 px-4 py-2 rounded-full text-sm font-medium border border-gray-700 text-gray-300">
              Yaş: {user.age || '30'}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Wallet className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Aylık Net Gelir</h2>
            </div>
            {!editingSalary && (
              <button
                onClick={() => { setEditingSalary(true); setSalaryInput(String(user.monthly_salary || '')); }}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                title="Maaşı Düzenle"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>
          {editingSalary ? (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400">₺</span>
                <input
                  type="number"
                  value={salaryInput}
                  onChange={e => setSalaryInput(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 text-white text-2xl font-bold py-3 pl-10 pr-4 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={handleSalaryUpdate}
                disabled={salaryLoading}
                className="p-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition"
              >
                <Check size={20} />
              </button>
              <button
                onClick={() => setEditingSalary(false)}
                className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <p className="text-4xl font-bold text-green-400">₺{(user.monthly_salary || 0).toLocaleString()}</p>
          )}
          <p className="text-sm text-gray-400 mt-2">Kalem ikonuna tıklayarak maaşınızı güncelleyebilirsiniz.</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <CreditCard className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Sabit Giderler & Kalan Bütçe</h2>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-400 mb-1">Toplam Sabit Gider</p>
              <p className="text-2xl font-bold text-orange-400">₺{totalExpenses.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Kullanılabilir Bütçe</p>
              <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-purple-400' : 'text-red-400'}`}>₺{remainingBudget.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Expenses List */}
      <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-purple-400" /> Faturalar ve Dijital Abonelikler
          </h2>
          <button 
            onClick={openAddModal}
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            <Plus size={18} /> Yeni Ekle
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-6">
          Aylık düzenli giderleriniz burada listelenir. Fiyat ve ödeme gününü düzenleyebilir, artık kullanmadığınız abonelikleri iptal edebilirsiniz.
          Ödeme tarihi yaklaştığında (3 gün kala) otomatik bildirim alırsınız.
        </p>

        {loading ? (
          <p className="text-gray-500">Yükleniyor...</p>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Kayıtlı sabit gideriniz bulunmuyor.</p>
            <button onClick={openAddModal} className="text-purple-400 hover:text-purple-300 font-medium underline">
              İlk giderini ekle →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenses.map((exp) => {
              const daysLeft = (exp.due_day || 1) - today;
              let statusText = "";
              let statusColor = "";
              
              if (daysLeft < 0) {
                statusText = "Ödendi / Geçti";
                statusColor = "text-gray-500 bg-gray-900";
              } else if (daysLeft === 0) {
                statusText = "Son Gün!";
                statusColor = "text-white bg-red-600 animate-pulse";
              } else if (daysLeft <= 3) {
                statusText = `${daysLeft} gün kaldı`;
                statusColor = "text-orange-400 bg-orange-500/20";
              } else {
                statusText = `${daysLeft} gün var`;
                statusColor = "text-green-400 bg-green-500/20";
              }

              return (
                <div key={exp.id} className="bg-gray-900 border border-gray-700 p-5 rounded-2xl flex flex-col justify-between hover:border-purple-500/50 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-purple-400 uppercase tracking-wider mb-1 font-semibold">{exp.category || 'GİDER'}</p>
                      <h3 className="text-lg font-bold text-white line-clamp-1">{exp.name}</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                  
                  <div className="flex items-end justify-between mt-4 border-t border-gray-800 pt-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Son Ödeme: Ayın {exp.due_day}'i</p>
                      <p className="text-xl font-bold text-white">₺{(exp.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(exp)}
                        className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                        title="Düzenle"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="İptal Et / Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Gideri Düzenle' : 'Yeni Sabit Gider Ekle'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Gider Adı</label>
                <input
                  type="text"
                  value={modalData.name}
                  onChange={e => setModalData({...modalData, name: e.target.value})}
                  placeholder="Örn: Netflix, Elektrik Faturası"
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Tutar (₺)</label>
                  <input
                    type="number"
                    value={modalData.amount}
                    onChange={e => setModalData({...modalData, amount: e.target.value})}
                    placeholder="229.99"
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Ödeme Günü (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={modalData.due_day}
                    onChange={e => setModalData({...modalData, due_day: e.target.value})}
                    placeholder="15"
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Kategori</label>
                <select
                  value={modalData.category}
                  onChange={e => setModalData({...modalData, category: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="Konut">Barınma / Kira</option>
                  <option value="Fatura">Fatura (Elektrik, Su, Doğalgaz)</option>
                  <option value="Abonelik">Dijital Abonelik (Netflix, Spotify)</option>
                  <option value="Kredi">Kredi / Taksit</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !modalData.name || !modalData.amount}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-purple-500/20"
              >
                {saving ? 'Kaydediliyor...' : (editingId ? 'Güncelle' : 'Ekle')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Profil Bilgilerini Düzenle</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-white transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Ad Soyad</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={e => setProfileData({...profileData, full_name: e.target.value})}
                  placeholder="Ad Soyad"
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Yaş</label>
                <input
                  type="number"
                  value={profileData.age}
                  onChange={e => setProfileData({...profileData, age: e.target.value})}
                  placeholder="Örn: 30"
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Risk Profili</label>
                <select
                  value={profileData.risk_profile}
                  onChange={e => setProfileData({...profileData, risk_profile: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="saver">Tasarrufçu (Saver)</option>
                  <option value="moderate">Dengeli (Moderate)</option>
                  <option value="spender">Harcamacı (Spender)</option>
                </select>
              </div>

              <button
                onClick={handleProfileSave}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-purple-500/20"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
