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
      <div className="max-w-2xl mx-auto animate-fade-in py-12 text-center space-y-8">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={56} className="text-green-400" />
        </div>
        <h1 className="text-4xl font-bold text-white">Alışveriş Tamamlandı! 🎉</h1>
        <p className="text-gray-400 text-lg">
          {confirmResult.transaction_count} ürün için toplam <span className="text-white font-bold">₺{confirmResult.total_amount?.toLocaleString()}</span> harcandı.
        </p>
        
        {/* Motivational Goal Message */}
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 p-6 rounded-2xl text-left">
          <p className="text-purple-300 text-lg leading-relaxed">
            🎯 {confirmResult.success_message || `${user.full_name || 'Kullanıcı'}, hedefine bir adım daha yaklaştın! Her bilinçli harcama seni hayallerine biraz daha yaklaştırır. Harcamalarını Dashboard'dan takip etmeyi unutma.`}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/dashboard')} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition">
            Dashboard'a Git
          </button>
          <button onClick={() => navigate('/market')} className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-bold transition">
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
      <div className="max-w-3xl mx-auto animate-fade-in py-8 space-y-8">
        {/* Nudge Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={44} className="text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Asistan Analizi</h1>
          <p className="text-gray-400">Sepetini analiz ettim. İşte gördüklerim:</p>
        </div>

        {/* Nudge Message */}
        {needs_nudge && (
          <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 p-6 rounded-2xl">
            <p className="text-white text-lg leading-relaxed">💡 {nudge_message}</p>
          </div>
        )}

        {/* Budget Context */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
            <p className="text-xs text-gray-400 mb-1">Sepet Toplamı</p>
            <p className="text-xl font-bold text-white">₺{cart_summary.total_amount.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
            <p className="text-xs text-gray-400 mb-1">Temel İhtiyaç</p>
            <p className="text-xl font-bold text-green-400">₺{cart_summary.essential_amount.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
            <p className="text-xs text-gray-400 mb-1">İsteğe Bağlı</p>
            <p className="text-xl font-bold text-red-400">₺{cart_summary.discretionary_amount.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
            <p className="text-xs text-gray-400 mb-1">Aylık Bütçe Kullanım</p>
            <p className={`text-xl font-bold ${(budget_context?.budget_usage_percent || 0) > 50 ? 'text-red-400' : 'text-green-400'}`}>
              %{budget_context?.budget_usage_percent || 0}
            </p>
            {budget_context?.monthly_salary > 0 && (
              <p className="text-xs text-gray-500 mt-1">₺{budget_context.disposable_income.toLocaleString()} kaldı</p>
            )}
          </div>
        </div>

        {/* Goal Impact */}
        {goal_impact && (
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
            <h3 className="text-white font-bold mb-2">🎯 Hedef Etkisi: {goal_impact.goal_title}</h3>
            <p className="text-gray-400 text-sm">
              İsteğe bağlı harcamalarından vazgeçersen <span className="text-green-400 font-bold">₺{goal_impact.savings_if_removed}</span> tasarruf edebilir
              ve hedefine <span className="text-orange-400 font-bold">{goal_impact.days_delayed_by_discretionary} gün</span> daha erken ulaşabilirsin.
            </p>
          </div>
        )}

        {/* Discretionary Items */}
        {discretionary_items && discretionary_items.length > 0 && (
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
            <h3 className="text-white font-bold mb-3">⚠️ İsteğe Bağlı Ürünler</h3>
            <div className="space-y-2">
              {discretionary_items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm bg-gray-900 px-4 py-2 rounded-lg">
                  <span className="text-gray-300">{item.name}</span>
                  <span className="text-red-400 font-bold">₺{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decision Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => handleConfirm(false)}
            disabled={checkoutLoading}
            className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-3 transition border border-gray-600"
          >
            <XCircle size={24} /> Vazgeç, Sepete Dön
          </button>
          <button
            onClick={() => handleConfirm(true)}
            disabled={checkoutLoading}
            className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-3 transition shadow-lg shadow-green-500/20"
          >
            {checkoutLoading ? 'İşleniyor...' : <><CheckCircle size={24} /> Devam Et, Satın Al</>}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: CART (Main View) ──────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sepetim</h1>
          <p className="text-gray-400">{items.length} çeşit ürün</p>
        </div>
        {items.length > 0 && (
          <button onClick={handleClearCart} className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-lg transition">
            <Trash2 size={16} /> Sepeti Temizle
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 space-y-6">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <Package size={48} className="text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-500">Sepetiniz boş</h2>
          <p className="text-gray-600">Sanal Market'ten ürün ekleyerek başlayın.</p>
          <button onClick={() => navigate('/market')} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition">
            Markete Git
          </button>
        </div>
      ) : (
        <>
          {/* Item List */}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className={`bg-gray-800 border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition ${
                updating === item.id ? 'opacity-50 border-gray-700' : 'border-gray-700 hover:border-purple-500/30'
              }`}>
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.is_essential ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-semibold">Temel</span>
                    ) : (
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-semibold">İsteğe Bağlı</span>
                    )}
                    <span className="text-xs text-gray-500 uppercase">{item.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white truncate">{item.product_name}</h3>
                  <p className="text-sm text-gray-400 mt-1">Birim Fiyat: ₺{item.unit_price.toLocaleString()} / {item.unit}</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.unit === 'kg' ? Math.max(0, item.quantity - 0.5) : item.quantity - 1, item.unit)}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-xl flex items-center justify-center transition"
                  >
                    <Minus size={18} />
                  </button>
                  
                  <div className="text-center min-w-[80px]">
                    <input
                      type="number"
                      value={item.quantity}
                      min={item.unit === 'kg' ? 0.1 : 1}
                      step={item.unit === 'kg' ? 0.1 : 1}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val > 0) handleUpdateQuantity(item.id, val, item.unit);
                      }}
                      className="w-20 bg-gray-900 border border-gray-700 text-white text-center text-lg font-bold py-2 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{item.unit}</p>
                  </div>

                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.unit === 'kg' ? item.quantity + 0.5 : item.quantity + 1, item.unit)}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-xl flex items-center justify-center transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Total + Remove */}
                <div className="flex items-center gap-4">
                  <div className="text-right min-w-[100px]">
                    <p className="text-xl font-bold text-purple-400">₺{item.total_price.toLocaleString()}</p>
                    {item.unit === 'kg' && (
                      <p className="text-xs text-gray-500">{item.quantity} kg × ₺{item.unit_price}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Temel İhtiyaçlar</span>
              <span className="text-green-400 font-bold">₺{(cartData?.essential_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">İsteğe Bağlı Ürünler</span>
              <span className="text-orange-400 font-bold">₺{(cartData?.discretionary_amount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-700 pt-4 flex justify-between">
              <span className="text-xl font-bold text-white">Toplam</span>
              <span className="text-2xl font-bold text-white">₺{(cartData?.total_amount || 0).toLocaleString()}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-3 transition shadow-lg shadow-purple-500/20"
            >
              {checkoutLoading ? 'AI Analiz Yapılıyor...' : <><CreditCard size={24} /> Ödemeye Geç</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
