import React, { useEffect, useState } from 'react';
import { getCategories, getProducts, addToCart, getCart } from '../services/api';
import { ShoppingCart, X } from 'lucide-react';

export default function Market() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const [catRes, prodRes, cartRes] = await Promise.all([
          getCategories(),
          getProducts(),
          getCart().catch(() => ({ data: null }))
        ]);
        
        // Show all categories as requested
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
      
      // Update cart count from response
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

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  if (loading) {
    return <div className="p-8 text-gray-400">Market yükleniyor...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sanal Market</h1>
          <p className="text-gray-400">İhtiyaçlarını ve isteklerini sepetine ekle, AI asistanın seni yönlendirsin.</p>
        </div>
        
        {/* Cart Icon with Badge */}
        <div className="relative bg-gray-800 p-3 rounded-xl border border-gray-700">
          <ShoppingCart size={28} className="text-purple-400" />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg">
              {cartItemCount}
            </span>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-800">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-6 py-2 rounded-full font-medium transition ${
            activeCategory === 'all' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          Tümü ({products.length})
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-6 py-2 rounded-full font-medium transition flex items-center gap-2 ${
              activeCategory === cat.key 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label} 
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(p => (
          <div 
            key={p.id} 
            onClick={() => openModal(p)}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-5 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer transition-all group flex flex-col"
          >
            <div className="h-48 w-full bg-gray-900 rounded-xl mb-4 overflow-hidden relative">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  🛍️
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {p.is_essential ? (
                  <span className="bg-green-500/80 backdrop-blur text-white text-xs px-2 py-1 rounded shadow-sm">
                    ✓ Temel İhtiyaç
                  </span>
                ) : (
                  <span className="bg-orange-500/80 backdrop-blur text-white text-xs px-2 py-1 rounded shadow-sm">
                    ◇ İsteğe Bağlı
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{p.category}</p>
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{p.name}</h3>
            </div>
            
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-400">₺{p.price.toLocaleString()}</p>
                <p className="text-xs text-gray-500">/{p.unit}</p>
              </div>
              <div className="bg-gray-700 p-2 rounded-xl text-gray-300 group-hover:bg-purple-600 group-hover:text-white transition">
                <ShoppingCart size={20} />
              </div>
            </div>
          </div>
        ))}
        
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Bu kategoride ürün bulunamadı.
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="relative h-64">
               {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-6xl">🛍️</div>
               )}
               <button 
                onClick={closeModal}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur transition"
               >
                 <X size={24} />
               </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <p className="text-purple-400 text-sm uppercase tracking-wider font-semibold mb-1">{selectedProduct.category}</p>
                <h2 className="text-2xl font-bold text-white">{selectedProduct.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-3xl font-bold text-white">₺{selectedProduct.price.toLocaleString()}</p>
                  <span className="text-gray-400">/ {selectedProduct.unit}</span>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Miktar Seç ({selectedProduct.unit})
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number"
                    min={selectedProduct.unit === 'kg' ? "0.1" : "1"}
                    step={selectedProduct.unit === 'kg' ? "0.1" : "1"}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-white text-xl font-bold px-4 py-3 rounded-xl w-32 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <div className="text-gray-400 text-sm">
                    Toplam: <span className="text-white font-bold text-lg">₺{((typeof quantity === 'string' ? parseFloat(quantity) : quantity) * selectedProduct.price).toLocaleString()}</span>
                  </div>
                </div>
                {selectedProduct.unit === 'kg' && (
                  <p className="text-xs text-purple-400 mt-2">İpucu: Küsuratlı değer girebilirsin (Örn: 1.5)</p>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !quantity || Number(quantity) <= 0}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition shadow-lg shadow-purple-500/20"
              >
                {addingToCart ? 'Ekleniyor...' : <><ShoppingCart size={24} /> Sepete Ekle</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
