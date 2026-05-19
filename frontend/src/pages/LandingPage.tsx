import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, ShieldCheck, ArrowRight, Wallet, Target, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans selection:bg-emerald-500/10 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Brain className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              MindfulSpend<span className="text-emerald-600 font-bold">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="hidden sm:block px-5 py-2.5 text-slate-600 hover:text-slate-950 font-bold transition cursor-pointer"
            >
              Giriş Yap
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 rounded-full font-bold transition shadow-glow-green hover:-translate-y-0.5 cursor-pointer"
            >
              Ücretsiz Başla
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 z-10"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-150 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles size={16} /> Davranışsal Finans ve Yapay Zeka Buluştu
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight font-display">
              Bütçenizi değil, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                hayallerinizi
              </span> yönetin.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg lg:text-xl text-slate-500 leading-relaxed max-w-lg font-medium">
              Kısıtlayıcı listeleri unutun. MindfulSpend AI, alışveriş anında devreye giren proaktif bir koçtur. Dürtüsel harcamalarınızı yargılamaz, onları hedeflerinize yönlendirir.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-full font-bold text-lg transition shadow-glow-green flex items-center justify-center gap-2 group cursor-pointer"
              >
                Finansal Yolculuğa Çık <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="text-emerald-600" size={16}/> Kart Bağlama Yok</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="text-emerald-600" size={16}/> %100 Ücretsiz</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="text-emerald-600" size={16}/> Güvenli Altyapı</span>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:h-[600px] flex items-center justify-center z-10 hidden sm:flex"
          >
            {/* Mockup / Abstract Graphic */}
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-green-500 rounded-3xl transform rotate-6 opacity-20 blur-xl"></div>
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl relative z-10 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Toplam Varlık</p>
                    <p className="text-3xl font-black font-display text-slate-900">₺34,250.00</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-150 rounded-full flex items-center justify-center text-emerald-600">
                    <Wallet />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-150 p-4 rounded-2xl flex gap-4 items-start relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                    <div className="w-10 h-10 bg-white border border-amber-200 rounded-full flex items-center justify-center flex-shrink-0">☕</div>
                    <div>
                      <p className="text-slate-900 font-bold text-sm">Gece Kahvesi - İsteğe Bağlı</p>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed font-medium">Bu 150 TL'yi Tatil Fonuna aktarırsan hedefine 3 gün erken ulaşırsın!</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-emerald-50 border border-emerald-150 rounded-full flex items-center justify-center text-emerald-600"><Target size={20} /></div>
                      <div>
                        <p className="text-slate-900 font-bold text-sm">Tatil Fonu</p>
                        <p className="text-slate-500 text-xs font-semibold">Hedefin %45'i tamamlandı</p>
                      </div>
                    </div>
                    <span className="text-emerald-600 font-black text-sm">+₺150</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section / Nudge Theory */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-display text-slate-900 mb-4">Suçluluk duygusuna son. <br/>Akıllı yönlendirmelerle tanışın.</h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              Sistemimiz Richard Thaler'in Nobel ödüllü <strong>Nudge (Dürtme) Teorisi</strong> üzerine kuruludur. Size "bunu alamazsın" demek yerine, karar anında proaktif alternatifler sunar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#FAF9F6] border border-slate-200 p-8 rounded-3xl hover:border-emerald-500/20 transition duration-300">
              <div className="w-14 h-14 bg-blue-50 border border-blue-150 rounded-2xl flex items-center justify-center text-blue-600 mb-6 font-bold text-xl">
                📈
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 mb-3">Tersine RFM Analizi</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                E-ticaret sitelerinin size daha fazla ürün satmak için kullandığı sadakat algoritmalarını tersine mühendislikle risk hesaplamak için kullanıyoruz.
              </p>
            </div>
            
            <div className="bg-[#FAF9F6] border border-slate-200 p-8 rounded-3xl hover:border-emerald-500/20 transition duration-300 relative overflow-hidden">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 font-bold text-xl">
                🧠
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 mb-3">Yapay Zeka Karar Motoru</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Alışveriş sepetinizi analiz eden AI, anlık harcamanızın bütçenizi aşma riskini milisaniyeler içinde hesaplar ve müdahale eder.
              </p>
            </div>

            <div className="bg-[#FAF9F6] border border-slate-200 p-8 rounded-3xl hover:border-emerald-500/20 transition duration-300">
              <div className="w-14 h-14 bg-purple-50 border border-purple-150 rounded-2xl flex items-center justify-center text-purple-650 mb-6 font-bold text-xl">
                🛡️
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 mb-3">Tam Gizlilik & Otonomi</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Gerçek banka verilerinize erişilmez. Kendi hedeflerinizi belirler ve Sanal Market'te risksiz bir ortamda finansal davranışınızı simüle edersiniz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#FAF9F6] border-t border-slate-200 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="text-emerald-600" size={24} />
          <span className="text-xl font-black font-display text-slate-950">MindfulSpend<span className="text-emerald-650 font-bold">AI</span></span>
        </div>
        <p className="text-slate-450 text-sm font-bold uppercase tracking-wider">
          Hackathon 2026 için geliştirilmiştir. Davranışsal finansın gücüyle bütçenizi yönetin.
        </p>
      </footer>
    </div>
  );
}
