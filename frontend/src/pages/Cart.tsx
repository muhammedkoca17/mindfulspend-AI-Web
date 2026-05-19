import React, { useEffect, useState } from 'react';
import { getCart, updateCartItem, removeFromCart, clearCart, checkout, confirmCheckout } from '../services/api';
import { ShoppingCart, Trash2, Minus, Plus, CreditCard, AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CartItemData {
  id: number;
  product_id: number;
  product_name: string;
  category: string;
  is_essential: boolean;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  item_code?: number;
  brand?: string;
  category_name1?: string;
  category_name2?: string;
  category_name3?: string;
  total_sold?: number;
  price_tier_global?: string;
  price_tier_category?: string;
  necessity_auto?: string;
  necessity_final?: string;
  popularity?: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cartData, setCartData] = useState<any>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  // Checkout flow
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'nudge' | 'done'>('cart');
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState<any>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const res = await getCart();
      setCartData(res.data);
    } catch {
      setCartData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQty: number, unit: string) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setUpdating(itemId);
    try {
      const res = await updateCartItem(itemId, newQty);
      setCartData(res.data);
    } catch {
      alert('Miktar güncellenemedi.');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setUpdating(itemId);
    try {
      const res = await removeFromCart(itemId);
      setCartData(res.data);
    } catch {
      alert('Ürün silinemedi.');
    } finally {
      setUpdating(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Tüm sepeti temizlemek istediğinize emin misiniz?')) return;
    try {
      await clearCart();
      await loadCart();
    } catch {
      alert('Sepet temizlenemedi.');
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await checkout();
      setCheckoutData(res.data);
      setCheckoutStep('nudge');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Checkout başarısız.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirm = async (accepted: boolean) => {
    if (!accepted) {
      // Vazgeç: sadece sepete geri dön, backend'e bir şey gönderme
      setCheckoutStep('cart');
      setCheckoutData(null);
      return;
    }
    // Devam Et: onaylayıp satın al
    setCheckoutLoading(true);
    try {
      const res = await confirmCheckout(true);
      setConfirmResult(res.data);
      setCheckoutStep('done');
    } catch {
      alert('Onaylama başarısız oldu.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-400 flex items-center justify-center h-full">Sepet yükleniyor...</div>;
  }

  const items: CartItemData[] = cartData?.items || [];

  // ── STEP: DONE ──────────────────────────────────────────────
  if (checkoutStep === 'done' && confirmResult) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return (
      <div className="max-w-2xl mx-auto animate-fade-in py-16 text-center space-y-10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)] border border-emerald-500/20 relative animate-scale-in">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-20"></div>
          <CheckCircle size={64} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-5xl font-black font-display text-white tracking-tight mb-4 drop-shadow-md">Alışveriş Tamamlandı! 🎉</h1>
          <p className="text-slate-400 text-lg">
            {confirmResult.transaction_count} ürün için toplam <span className="text-white font-black text-2xl ml-1">₺{confirmResult.total_amount?.toLocaleString()}</span> harcandı.
          </p>
        </div>
        
        {/* Motivational Goal Message */}
        <div className="bg-[#1E293B]/80 backdrop-blur-md border border-indigo-500/30 p-8 rounded-3xl text-left shadow-glass relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <p className="text-indigo-200 text-lg leading-relaxed relative z-10 font-medium">
            <span className="text-2xl mr-2">🎯</span> {confirmResult.success_message || `${user.full_name || 'Kullanıcı'}, hedefine bir adım daha yaklaştın! Her bilinçli harcama seni hayallerine biraz daha yaklaştırır. Harcamalarını Dashboard'dan takip etmeyi unutma.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-glow-purple hover:-translate-y-1">
            Dashboard'a Git
          </button>
          <button onClick={() => navigate('/market')} className="bg-[#1E293B] hover:bg-slate-700 border border-slate-600/50 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-glass hover:-translate-y-1">
            Markete Dön
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: NUDGE ─────────────────────────────────────────────
  if (checkoutStep === 'nudge' && checkoutData) {
    const { cart_summary, nudge_message, needs_nudge, goal_impact, budget_context, discretionary_items } = checkoutData;
    return (
      <div className="max-w-4xl mx-auto animate-fade-in py-10 space-y-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none"></div>
        {/* Nudge Header */}
        <div className="text-center relative z-10">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)] border border-amber-500/20">
            <AlertTriangle size={48} className="text-amber-400" />
          </div>
          <h1 className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-3 tracking-tight">AI Asistan Analizi</h1>
          <p className="text-slate-400 text-lg">Sepetini analiz ettim. İşte gördüklerim:</p>
        </div>

        {/* Nudge Message */}
        {needs_nudge && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-8 rounded-[24px] shadow-glass relative z-10 text-center">
            <p className="text-white text-xl leading-relaxed font-medium">💡 {nudge_message}</p>
          </div>
        )}

        {/* Budget Context */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 relative z-10">
          <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-glass text-center group hover:-translate-y-1 transition-transform">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-bold">Sepet Toplamı</p>
            <p className="text-2xl font-black font-display text-white">₺{cart_summary.total_amount.toLocaleString()}</p>
          </div>
          <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-glass text-center group hover:-translate-y-1 transition-transform">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-bold">Temel İhtiyaç</p>
            <p className="text-2xl font-black font-display text-emerald-400">₺{cart_summary.essential_amount.toLocaleString()}</p>
          </div>
          <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-glass text-center group hover:-translate-y-1 transition-transform">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-bold">İsteğe Bağlı</p>
            <p className="text-2xl font-black font-display text-rose-400">₺{cart_summary.discretionary_amount.toLocaleString()}</p>
          </div>
          <div className="bg-[#1E293B]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-glass text-center group hover:-translate-y-1 transition-transform">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-bold">Aylık Bütçe Kullanım</p>
            <p className={`text-2xl font-black font-display ${(budget_context?.budget_usage_percent || 0) > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
              %{budget_context?.budget_usage_percent || 0}
            </p>
            {budget_context?.monthly_salary > 0 && (
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">₺{budget_context.disposable_income.toLocaleString()} Kaldı</p>
            )}
          </div>
        </div>

        {/* Goal Impact */}
        {goal_impact && (
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-7 rounded-[24px] border border-indigo-500/30 shadow-glass relative z-10 flex items-start gap-5">
            <div className="text-4xl">🎯</div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Hedef Etkisi: <span className="text-indigo-300">{goal_impact.goal_title}</span></h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                İsteğe bağlı harcamalarından vazgeçersen <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">₺{goal_impact.savings_if_removed}</span> tasarruf edebilir
                ve hedefine <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">{goal_impact.days_delayed_by_discretionary} gün</span> daha erken ulaşabilirsin.
              </p>
            </div>
          </div>
        )}

        {/* Discretionary Items */}
        {discretionary_items && discretionary_items.length > 0 && (
          <div className="bg-[#1E293B]/80 backdrop-blur-md p-7 rounded-[24px] border border-slate-700/50 shadow-glass relative z-10">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-rose-400">⚠️</span> İsteğe Bağlı Ürünler
            </h3>
            <div className="space-y-3">
              {discretionary_items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-[#0F172A]/80 px-5 py-3.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-300 font-medium">{item.name}</span>
                  <span className="text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-md tracking-wide">₺{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decision Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 relative z-10 mt-6">
          <button
            onClick={() => handleConfirm(false)}
            disabled={checkoutLoading}
            className="flex-1 py-4.5 bg-[#1E293B] hover:bg-slate-700 text-white rounded-2xl font-bold text-lg flex justify-center items-center gap-3 transition-all duration-300 border border-slate-600/50 hover:shadow-glass hover:-translate-y-1"
          >
            <XCircle size={24} /> Vazgeç, Sepete Dön
          </button>
          <button
            onClick={() => handleConfirm(true)}
            disabled={checkoutLoading}
            className="flex-1 py-4.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-2xl font-bold text-lg flex justify-center items-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
          >
            {checkoutLoading ? 'İşleniyor...' : <><CheckCircle size={24} /> Devam Et, Satın Al</>}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: CART (Main View) ──────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-24 relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 tracking-tight">Sepetim</h1>
          <p className="text-slate-400 font-medium">{items.length} çeşit ürün</p>
        </div>
        {items.length > 0 && (
          <button onClick={handleClearCart} className="text-rose-400 hover:text-rose-300 text-sm font-bold tracking-wide flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 px-5 py-2.5 rounded-xl transition-all duration-300 border border-rose-500/20 group">
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> Sepeti Temizle
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 space-y-6 bg-[#1E293B]/40 backdrop-blur-md rounded-[32px] border border-slate-700/50 shadow-glass relative z-10">
          <div className="w-28 h-28 bg-[#0F172A]/80 rounded-full flex items-center justify-center mx-auto shadow-inner border border-slate-700/50 group">
            <Package size={56} className="text-slate-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-slate-300 mb-2">Sepetiniz boş</h2>
            <p className="text-slate-500 text-lg">Sanal Market'ten ürün ekleyerek başlayın.</p>
          </div>
          <button onClick={() => navigate('/market')} className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-300 shadow-glow-purple hover:-translate-y-1 hover:scale-105 active:scale-95 inline-flex items-center gap-2">
            Markete Git <span className="opacity-80">→</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Item List */}
          <div className="lg:col-span-2 space-y-5">
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className={`bg-[#1E293B]/80 backdrop-blur-md border rounded-[24px] p-6 flex flex-col md:flex-row items-start md:items-center gap-6 transition-all duration-300 shadow-glass animate-slide-up hover:-translate-y-1 ${
                  updating === item.id ? 'opacity-50 border-slate-700' : 'border-slate-700/50 hover:border-indigo-500/50 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)]'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2.5">
                    {item.is_essential ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">✓ Temel İhtiyaç</span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">◇ İsteğe Bağlı</span>
                    )}
                    {item.price_tier_category && (
                      <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold text-white uppercase tracking-wider border ${
                        item.price_tier_category === 'ucuz' ? 'bg-emerald-600/50 border-emerald-500/30 text-emerald-100' :
                        item.price_tier_category === 'uygun' ? 'bg-cyan-600/50 border-cyan-500/30 text-cyan-100' :
                        item.price_tier_category === 'pahali' ? 'bg-orange-600/50 border-orange-500/30 text-orange-100' : 'bg-rose-600/50 border-rose-500/30 text-rose-100'
                      }`}>
                        {item.price_tier_category}
                      </span>
                    )}
                    {item.item_code && (
                      <span className="text-[10px] bg-[#0F172A]/80 border border-slate-700/50 text-slate-400 px-2 py-1 rounded-md font-mono tracking-widest">#{item.item_code}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col mb-1.5">
                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">{item.brand || 'GENEL'}</span>
                    <h3 className="text-xl font-bold font-display text-white truncate leading-tight">{item.product_name}</h3>
                  </div>

                  {item.category_name1 && (
                    <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide">
                      {item.category_name1} <span className="opacity-50">&gt;</span> {item.category_name2} <span className="opacity-50">&gt;</span> {item.category_name3}
                    </p>
                  )}

                  <p className="text-[11px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Birim Fiyat: ₺{item.unit_price.toLocaleString()} / {item.unit}</p>
                </div>

                {/* Controls & Total */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-700/50">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 bg-[#0F172A]/50 p-2 rounded-2xl border border-slate-700/50">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.unit === 'kg' ? Math.max(0, item.quantity - 0.5) : item.quantity - 1, item.unit)}
                      className="w-10 h-10 bg-[#1E293B] hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Minus size={18} />
                    </button>
                    
                    <div className="text-center min-w-[70px]">
                      <input
                        type="number"
                        value={item.quantity}
                        min={item.unit === 'kg' ? 0.1 : 1}
                        step={item.unit === 'kg' ? 0.1 : 1}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > 0) handleUpdateQuantity(item.id, val, item.unit);
                        }}
                        className="w-16 bg-transparent text-white text-center text-lg font-black font-display outline-none"
                      />
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{item.unit}</p>
                    </div>

                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.unit === 'kg' ? item.quantity + 0.5 : item.quantity + 1, item.unit)}
                      className="w-10 h-10 bg-[#1E293B] hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Total + Remove */}
                  <div className="flex items-center gap-5">
                    <div className="text-right min-w-[110px]">
                      <p className="text-2xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">₺{item.total_price.toLocaleString()}</p>
                      {item.unit === 'kg' && (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{item.quantity} kg × ₺{item.unit_price}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 hover:shadow-inner"
                      title="Sepetten Çıkar"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#1E293B]/80 backdrop-blur-md border border-slate-700/50 rounded-[32px] p-8 space-y-6 shadow-glass sticky top-24 animate-slide-left">
              <h3 className="text-xl font-bold font-display text-white border-b border-slate-700/50 pb-4">Sipariş Özeti</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Temel İhtiyaçlar</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg tracking-wide">₺{(cartData?.essential_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">İsteğe Bağlı Ürünler</span>
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-lg tracking-wide">₺{(cartData?.discretionary_amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-5 flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-slate-300 font-bold uppercase tracking-widest text-sm mb-1">Toplam Tutar</span>
                  <span className="text-4xl font-black font-display text-white tracking-tight">₺{(cartData?.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full py-4.5 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-2xl font-bold text-lg flex justify-center items-center gap-3 transition-all duration-300 shadow-glow-purple disabled:shadow-none hover:scale-[1.02] active:scale-95 group"
              >
                {checkoutLoading ? (
                  <span className="flex items-center gap-2"><span className="animate-spin text-xl">⏳</span> Analiz Yapılıyor...</span>
                ) : (
                  <><CreditCard size={22} className="group-hover:rotate-6 transition-transform" /> Ödemeye Geç</>
                )}
              </button>
              
              <p className="text-[11px] text-center text-slate-500 mt-4 leading-relaxed px-2 font-medium">
                Ödemeye geçmeden önce <strong className="text-indigo-400 font-bold">MindfulSpend AI</strong> sepetinizi inceleyecek ve hedefleriniz için tavsiyelerde bulunacaktır.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
