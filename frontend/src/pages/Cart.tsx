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
      setCheckoutStep('cart');
      setCheckoutData(null);
      return;
    }
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
    return <div className="p-8 text-slate-500 font-bold flex items-center justify-center h-full">Sepet yükleniyor...</div>;
  }

  const items: CartItemData[] = cartData?.items || [];

  // ── STEP: DONE ──────────────────────────────────────────────
  if (checkoutStep === 'done' && confirmResult) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return (
      <div className="max-w-2xl mx-auto animate-fade-in py-16 text-center space-y-10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(22,163,74,0.15)] border border-emerald-100 relative animate-scale-in">
          <div className="absolute inset-0 bg-emerald-500/5 rounded-full animate-ping opacity-20"></div>
          <CheckCircle size={64} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-5xl font-black font-display text-slate-900 tracking-tight mb-4">Alışveriş Tamamlandı! 🎉</h1>
          <p className="text-slate-600 text-lg">
            {confirmResult.transaction_count} ürün için toplam <span className="text-emerald-700 font-black text-2xl ml-1">₺{confirmResult.total_amount?.toLocaleString()}</span> harcandı.
          </p>
        </div>
        
        {/* Nudge Savings Success Card */}
        {confirmResult.saved_amount > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50/50 border-2 border-emerald-300 p-8 rounded-3xl text-left shadow-md relative overflow-hidden group animate-bounce-short">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-70"></div>
            <div className="relative z-10 flex items-start gap-4">
              <span className="text-4xl">🌟</span>
              <div>
                <h3 className="text-emerald-950 font-black text-xl mb-1">Harika Farkındalık!</h3>
                <p className="text-emerald-900 text-base leading-relaxed font-semibold">
                  Yapay zeka asistanının yönlendirmesine kulak verdin ve isteğe bağlı sepet kalemlerinden vazgeçerek <span className="text-emerald-700 font-extrabold text-lg bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-250">₺{confirmResult.saved_amount.toLocaleString()}</span> tasarruf ettin!
                </p>
                {confirmResult.goal_title && (
                  <p className="text-emerald-800 text-sm mt-2 font-medium">
                    Bu miktar <strong className="text-emerald-700 font-extrabold">"{confirmResult.goal_title}"</strong> hedefine otomatik olarak aktarıldı. Güncel birikim: <strong>₺{confirmResult.goal_current_amount?.toLocaleString()} / ₺{confirmResult.goal_target_amount?.toLocaleString()}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Motivational Goal Message */}
        <div className="bg-white border border-emerald-200 p-8 rounded-3xl text-left shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <p className="text-slate-700 text-lg leading-relaxed relative z-10 font-medium">
            <span className="text-2xl mr-2">🎯</span> {confirmResult.success_message || `${user.full_name || 'Kullanıcı'}, hedefine bir adım daha yaklaştın! Her bilinçli harcama seni hayallerine biraz daha yaklaştırır. Harcamalarını Dashboard'dan takip etmeyi unutma.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-glow-green hover:-translate-y-1 cursor-pointer">
            Dashboard'a Git
          </button>
          <button onClick={() => navigate('/market')} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-10 py-4 rounded-2xl font-bold transition-all hover:-translate-y-1 cursor-pointer">
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none"></div>
        {/* Nudge Header */}
        <div className="text-center relative z-10">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgba(245,158,11,0.1)] border border-amber-200">
            <AlertTriangle size={48} className="text-amber-500" />
          </div>
          <h1 className="text-4xl font-black font-display text-slate-900 mb-3 tracking-tight">AI Asistan Analizi</h1>
          <p className="text-slate-500 text-lg font-medium">Sepetini analiz ettim. İşte gördüklerim:</p>
        </div>

        {/* Nudge Message */}
        {needs_nudge && (
          <div className="bg-amber-50/50 border border-amber-200 p-8 rounded-[24px] shadow-sm relative z-10 text-center">
            <p className="text-amber-900 text-xl leading-relaxed font-bold">💡 {nudge_message}</p>
          </div>
        )}

        {/* Budget Context */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 relative z-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center group hover:-translate-y-1 transition-transform">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-extrabold">Sepet Toplamı</p>
            <p className="text-2xl font-black font-display text-slate-900">₺{cart_summary.total_amount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center group hover:-translate-y-1 transition-transform">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-extrabold">Temel İhtiyaç</p>
            <p className="text-2xl font-black font-display text-emerald-600">₺{cart_summary.essential_amount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center group hover:-translate-y-1 transition-transform">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-extrabold">İsteğe Bağlı</p>
            <p className="text-2xl font-black font-display text-amber-600">₺{cart_summary.discretionary_amount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center group hover:-translate-y-1 transition-transform">
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-extrabold">Aylık Bütçe Kullanım</p>
            <p className={`text-2xl font-black font-display ${(budget_context?.budget_usage_percent || 0) > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
              %{budget_context?.budget_usage_percent || 0}
            </p>
            {budget_context?.monthly_salary > 0 && (
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-extrabold">₺{budget_context.disposable_income.toLocaleString()} Kaldı</p>
            )}
          </div>
        </div>

        {/* Goal Impact */}
        {goal_impact && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50/50 p-7 rounded-[24px] border border-emerald-250 shadow-sm relative z-10 flex items-start gap-5">
            <div className="text-4xl">🎯</div>
            <div>
              <h3 className="text-slate-900 font-bold text-lg mb-2">Hedef Etkisi: <span className="text-emerald-700 font-extrabold">{goal_impact.goal_title}</span></h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                İsteğe bağlı harcamalarından vazgeçersen <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">₺{goal_impact.savings_if_removed}</span> tasarruf edebilir
                ve hedefine <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">{goal_impact.days_delayed_by_discretionary} gün</span> daha erken ulaşabilirsin.
              </p>
            </div>
          </div>
        )}

        {/* Discretionary Items */}
        {discretionary_items && discretionary_items.length > 0 && (
          <div className="bg-white p-7 rounded-[24px] border border-slate-200 shadow-sm relative z-10">
            <h3 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-amber-500">⚠️</span> İsteğe Bağlı Ürünler
            </h3>
            <div className="space-y-3">
              {discretionary_items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-slate-50 px-5 py-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-700 font-bold">{item.name}</span>
                  <span className="text-amber-700 font-bold bg-amber-100 px-3 py-1 rounded-md tracking-wide">₺{item.price.toLocaleString()}</span>
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
            className="flex-1 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-lg flex justify-center items-center gap-3 transition-all duration-300 border border-slate-200 hover:-translate-y-1 cursor-pointer"
          >
            <XCircle size={24} /> Vazgeç, Sepete Dön
          </button>
          <button
            onClick={() => handleConfirm(true)}
            disabled={checkoutLoading}
            className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-50 hover:to-green-50 text-white rounded-2xl font-bold text-lg flex justify-center items-center gap-3 transition-all duration-300 shadow-glow-green hover:-translate-y-1 cursor-pointer"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-4xl font-black font-display text-slate-900 mb-2 tracking-tight">Sepetim</h1>
          <p className="text-slate-500 font-bold">{items.length} çeşit ürün</p>
        </div>
        {items.length > 0 && (
          <button onClick={handleClearCart} className="text-red-600 hover:text-red-700 text-sm font-bold tracking-wide flex items-center gap-2 bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-xl transition-all duration-300 border border-red-100 group cursor-pointer">
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> Sepeti Temizle
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 space-y-6 bg-white rounded-[32px] border border-slate-200 shadow-sm relative z-10">
          <div className="w-28 h-28 bg-[#FAF9F6] rounded-full flex items-center justify-center mx-auto shadow-inner border border-slate-200 group">
            <Package size={56} className="text-slate-400 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-slate-800 mb-2">Sepetiniz boş</h2>
            <p className="text-slate-500 text-lg font-medium">Sanal Market'ten ürün ekleyerek başlayın.</p>
          </div>
          <button onClick={() => navigate('/market')} className="mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-300 shadow-glow-green hover:-translate-y-1 hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer">
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
                className={`bg-white border rounded-[24px] p-6 flex flex-col md:flex-row items-start md:items-center gap-6 transition-all duration-300 shadow-sm animate-slide-up hover:-translate-y-1 ${
                  updating === item.id ? 'opacity-50 border-slate-200' : 'border-slate-200/80 hover:border-emerald-500/50 hover:shadow-[0_10px_30px_rgba(22,163,74,0.05)]'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2.5">
                    {item.is_essential ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-250 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">✓ Temel İhtiyaç</span>
                    ) : (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-250 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">◇ İsteğe Bağlı</span>
                    )}
                    {item.price_tier_category && (
                      <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold text-white uppercase tracking-wider border ${
                        item.price_tier_category === 'ucuz' ? 'bg-emerald-600/90 border-emerald-500/20' :
                        item.price_tier_category === 'uygun' ? 'bg-cyan-600/90 border-cyan-500/20' :
                        item.price_tier_category === 'pahali' ? 'bg-orange-600/90 border-orange-500/20' : 'bg-red-600/90 border-red-500/20'
                      }`}>
                        {item.price_tier_category}
                      </span>
                    )}
                    {item.item_code && (
                      <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 px-2 py-1 rounded-md font-mono tracking-widest">#{item.item_code}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col mb-1.5">
                    <span className="text-xs text-emerald-600 font-extrabold uppercase tracking-widest mb-1">{item.brand || 'GENEL'}</span>
                    <h3 className="text-xl font-bold font-display text-slate-900 truncate leading-tight">{item.product_name}</h3>
                  </div>

                  {item.category_name1 && (
                    <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
                      {item.category_name1} <span className="opacity-50">&gt;</span> {item.category_name2} <span className="opacity-50">&gt;</span> {item.category_name3}
                    </p>
                  )}

                  <p className="text-[11px] text-slate-400 mt-2 uppercase font-extrabold tracking-widest">Birim Fiyat: ₺{item.unit_price.toLocaleString()} / {item.unit}</p>
                </div>

                {/* Controls & Total */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 bg-[#FAF9F6] p-2 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.unit === 'kg' ? Math.max(0, item.quantity - 0.5) : item.quantity - 1, item.unit)}
                      className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors shadow-sm cursor-pointer"
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
                        className="w-16 bg-transparent text-slate-900 text-center text-lg font-black font-display outline-none"
                      />
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{item.unit}</p>
                    </div>

                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.unit === 'kg' ? item.quantity + 0.5 : item.quantity + 1, item.unit)}
                      className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Total + Remove */}
                  <div className="flex items-center gap-5">
                    <div className="text-right min-w-[110px]">
                      <p className="text-2xl font-black font-display text-emerald-700">₺{item.total_price.toLocaleString()}</p>
                      {item.unit === 'kg' && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.quantity} kg × ₺{item.unit_price}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 cursor-pointer"
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
            <div className="bg-white border border-slate-200/80 rounded-[32px] p-8 space-y-6 shadow-sm sticky top-24 animate-slide-left">
              <h3 className="text-xl font-bold font-display text-slate-900 border-b border-slate-100 pb-4">Sipariş Özeti</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Temel İhtiyaçlar</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-150 px-3 py-1 rounded-lg tracking-wide">₺{(cartData?.essential_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">İsteğe Bağlı Ürünler</span>
                  <span className="text-amber-700 font-bold bg-amber-50 border border-amber-150 px-3 py-1 rounded-lg tracking-wide">₺{(cartData?.discretionary_amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 font-extrabold uppercase tracking-widest text-sm mb-1">Toplam Tutar</span>
                  <span className="text-4xl font-black font-display text-slate-900 tracking-tight">₺{(cartData?.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold text-lg flex justify-center items-center gap-3 transition-all duration-300 shadow-glow-green disabled:shadow-none hover:scale-[1.02] active:scale-95 group cursor-pointer"
              >
                {checkoutLoading ? (
                  <span className="flex items-center gap-2"><span className="animate-spin text-xl">⏳</span> Analiz Yapılıyor...</span>
                ) : (
                  <><CreditCard size={22} className="group-hover:rotate-6 transition-transform" /> Ödemeye Geç</>
                )}
              </button>
              
              <p className="text-[11px] text-center text-slate-400 mt-4 leading-relaxed px-2 font-medium">
                Ödemeye geçmeden önce <strong className="text-emerald-600 font-bold">MindfulSpend AI</strong> sepetinizi inceleyecek ve hedefleriniz için tavsiyelerde bulunacaktır.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
