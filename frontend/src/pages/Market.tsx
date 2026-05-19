import React, { useEffect, useState } from 'react';
import { getCategories, getProducts, addToCart, getCart } from '../services/api';
import { ShoppingCart, X } from 'lucide-react';

export default function Market() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(40);
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    setVisibleCount(40);
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const [catRes, prodRes, cartRes] = await Promise.all([
          getCategories(),
          getProducts(),
          getCart().catch(() => ({ data: null }))
        ]);
        
        setCategories(catRes.data.categories || []);
        setProducts(prodRes.data.products || []);
        
        if (cartRes.data && cartRes.data.items) {
          setCartItemCount(cartRes.data.items.length);
        }
      } catch (err) {
        console.error('Market data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  const openModal = (p: any) => {
    setSelectedProduct(p);
    setQuantity(p.unit === 'kg' ? 1.0 : 1);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    
    setAddingToCart(true);
    try {
      const q = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
      const res = await addToCart(selectedProduct.id, q);
      
      if (res.data && res.data.items) {
        setCartItemCount(res.data.items.length);
      }
      
      closeModal();
    } catch (err) {
      alert('Sepete eklenemedi.');
    } finally {
      setAddingToCart(false);
    }
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div className="p-8 text-slate-500 font-bold">Market yükleniyor...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black font-display tracking-tight text-slate-900 mb-2">Sanal Market</h1>
          <p className="text-slate-500 font-medium">İhtiyaçlarını ve isteklerini sepetine ekle, <span className="text-emerald-600 font-bold">AI asistanın</span> seni yönlendirsin.</p>
        </div>
        
        {/* Cart Icon with Badge */}
        <div className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group cursor-pointer hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(22,163,74,0.1)] transition-all duration-300">
          <ShoppingCart size={28} className="text-emerald-600 group-hover:text-emerald-500 transition-colors" />
          {cartItemCount > 0 && (
            <span className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full shadow-[0_4px_10px_rgba(239,68,68,0.3)] border-2 border-white animate-scale-in">
              {cartItemCount}
            </span>
          )}
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row gap-5 items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="w-full md:max-w-xl relative group">
          <input
            type="text"
            placeholder="Ürün adı veya marka ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF9F6] border border-slate-200 text-slate-900 pl-12 pr-12 py-3.5 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-slate-400 text-sm font-medium shadow-inner group-hover:border-slate-300"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors text-lg">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1 rounded-full transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        <div className="text-sm text-slate-500 font-bold px-4 py-2 bg-[#FAF9F6] rounded-xl border border-slate-200">
          Listelenen Ürün: <span className="text-emerald-600 font-black">{filteredProducts.length}</span> <span className="opacity-50 font-normal">/ {products.length}</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2.5 pb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 text-sm ${
            activeCategory === 'all' 
              ? 'bg-emerald-600 text-white shadow-glow-green scale-105' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          Tümü ({products.length})
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2.5 text-sm ${
              activeCategory === cat.key 
                ? 'bg-emerald-600 text-white shadow-glow-green scale-105' 
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:-translate-y-0.5'
            }`}
          >
            <span className="text-lg">{cat.icon}</span>
            {cat.label} <span className="opacity-60 text-xs">({cat.product_count})</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.slice(0, visibleCount).map((p: any, index: number) => (
          <div 
            key={p.id} 
            onClick={() => openModal(p)}
            className="bg-white border border-slate-200/80 rounded-[24px] p-5 hover:border-emerald-500/50 hover:shadow-[0_12px_30px_rgba(22,163,74,0.08)] cursor-pointer transition-all duration-300 group flex flex-col justify-between animate-slide-up hover:-translate-y-1.5"
            style={{ animationDelay: `${(index % 12) * 40}ms` }}
          >
            <div>
              <div className="h-52 w-full bg-slate-50 border border-slate-100 rounded-[16px] mb-5 overflow-hidden relative shadow-inner flex items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl opacity-40 group-hover:scale-110 transition-transform duration-700">
                    🛍️
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {p.is_essential ? (
                    <span className="bg-emerald-500/90 text-white text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md shadow-sm">
                      ✓ Temel İhtiyaç
                    </span>
                  ) : (
                    <span className="bg-amber-500/90 text-white text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md shadow-sm">
                      ◇ İsteğe Bağlı
                    </span>
                  )}
                  {p.price_tier_category && (
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-sm text-white uppercase tracking-wider ${
                      p.price_tier_category === 'ucuz' ? 'bg-emerald-600/90' :
                      p.price_tier_category === 'uygun' ? 'bg-cyan-600/90' :
                      p.price_tier_category === 'pahali' ? 'bg-orange-600/90' : 'bg-red-600/90'
                    }`}>
                      {p.price_tier_category}
                    </span>
                  )}
                  {p.popularity === 'popüler' && (
                    <span className="bg-green-600/90 text-white text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                      <span>🔥</span> Popüler
                    </span>
                  )}
                </div>
                
                {p.item_code && (
                  <span className="absolute bottom-3 right-3 bg-white/90 text-slate-600 text-[10px] px-2 py-1 rounded-md font-mono border border-slate-200">
                    #{p.item_code}
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs text-emerald-600 font-extrabold tracking-widest uppercase">{p.brand || 'GENEL'}</span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{p.category_name1 || p.category}</span>
                </div>
                <h3 className="text-lg font-bold font-display text-slate-800 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-tight">{p.name}</h3>
                {p.category_name2 && (
                  <p className="text-xs text-slate-400 mb-1 line-clamp-1 font-medium">{p.category_name2} &gt; {p.category_name3}</p>
                )}
              </div>
            </div>
            
            <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-2xl font-black font-display text-slate-900 tracking-tight">₺{p.price.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">/{p.unit}</p>
              </div>
              <div className="bg-slate-100 p-3 rounded-xl text-slate-600 group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-green-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-glow-green">
                <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        ))}
        
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <span className="text-4xl opacity-50">🔍</span>
            <p className="font-bold text-slate-500">Bu kategoride veya aramada ürün bulunamadı.</p>
          </div>
        )}
      </div>

      {visibleCount < filteredProducts.length && (
        <div className="flex justify-center mt-12 animate-fade-in">
          <button
            onClick={() => setVisibleCount(prev => prev + 40)}
            className="px-10 py-3.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 hover:border-transparent rounded-full font-bold transition-all duration-300 hover:shadow-glow-green active:scale-95 group flex items-center gap-2 cursor-pointer"
          >
            Daha Fazla Göster <span className="group-hover:translate-y-1 transition-transform">↓</span>
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-lg overflow-hidden shadow-xl animate-scale-in">
            <div className="relative h-72 bg-slate-50 flex items-center justify-center border-b border-slate-100">
               {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
               ) : (
                  <div className="text-6xl">🛍️</div>
               )}
               <button 
                onClick={closeModal}
                className="absolute top-5 right-5 bg-white/80 hover:bg-white text-slate-700 p-2.5 rounded-full backdrop-blur-md transition-colors border border-slate-200 shadow-sm cursor-pointer"
               >
                 <X size={20} />
               </button>
            </div>
            
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddToCart(); }}
              className="p-8 space-y-6 relative z-10"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="bg-emerald-50 text-emerald-700 text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-emerald-200">
                    {selectedProduct.brand || 'Genel Marka'}
                  </span>
                  {selectedProduct.item_code && (
                    <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                      Kod: #{selectedProduct.item_code}
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-bold font-display text-slate-900 leading-tight mb-2">{selectedProduct.name}</h2>
                
                {selectedProduct.category_name1 && (
                  <p className="text-xs text-slate-450 font-medium tracking-wide">
                    {selectedProduct.category_name1} <span className="opacity-50">&gt;</span> {selectedProduct.category_name2} <span className="opacity-50">&gt;</span> {selectedProduct.category_name3}
                  </p>
                )}

                <div className="flex items-end gap-2 mt-4">
                  <p className="text-4xl font-black font-display text-slate-900 tracking-tight">₺{selectedProduct.price.toLocaleString()}</p>
                  <span className="text-slate-500 font-bold uppercase tracking-widest mb-1">/ {selectedProduct.unit}</span>
                </div>
              </div>

              {/* Data Insights Panel */}
              <div className="grid grid-cols-2 gap-4 bg-[#FAF9F6] p-5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Fiyat Seviyesi</span>
                  <span className="text-slate-950 font-bold uppercase tracking-wider">{selectedProduct.price_tier_category || 'Bilinmiyor'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Popülerlik</span>
                  <span className="text-slate-950 font-bold uppercase tracking-wider">{selectedProduct.popularity || 'Normal'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">AI Gereklilik</span>
                  <span className={`font-bold tracking-wider uppercase ${selectedProduct.is_essential ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedProduct.is_essential ? 'Temel İhtiyaç' : 'İsteğe Bağlı'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Toplam Satış</span>
                  <span className="text-slate-950 font-bold">{selectedProduct.total_sold?.toLocaleString() || 0} Adet</span>
                </div>
              </div>

              <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-slate-200">
                <label className="block text-slate-700 text-sm font-bold mb-3">
                  Miktar Seç ({selectedProduct.unit})
                </label>
                <div className="flex items-center gap-5">
                  <input 
                    type="number"
                    min={selectedProduct.unit === 'kg' ? "0.1" : "1"}
                    step={selectedProduct.unit === 'kg' ? "0.1" : "1"}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-900 text-xl font-bold px-4 py-3.5 rounded-xl w-32 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-shadow"
                  />
                  <div className="text-slate-500 text-sm flex flex-col justify-center">
                    <span>Toplam</span>
                    <span className="text-emerald-700 font-black font-display text-xl tracking-tight">₺{((typeof quantity === 'string' ? parseFloat(quantity) : quantity) * selectedProduct.price).toLocaleString()}</span>
                  </div>
                </div>
                {selectedProduct.unit === 'kg' && (
                  <p className="text-[11px] text-emerald-600 mt-3 font-bold tracking-wide">💡 İpucu: Küsuratlı değer girebilirsin (Örn: 1.5)</p>
                )}
              </div>

              <button
                type="submit"
                disabled={addingToCart || !quantity || Number(quantity) <= 0}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold text-lg flex justify-center items-center gap-3 transition-all duration-300 shadow-glow-green disabled:shadow-none hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                {addingToCart ? 'Ekleniyor...' : <><ShoppingCart size={22} /> Sepete Ekle</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
