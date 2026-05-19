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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Brain className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
              MindfulSpend<span className="text-teal-400">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="hidden sm:block px-5 py-2.5 text-slate-300 hover:text-white font-medium transition"
            >
              Giriş Yap
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-bold transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Ücretsiz Başla
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 z-10"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-teal-400 font-medium text-sm">
              <Sparkles size={16} /> Davranışsal Finans ve Yapay Zeka Buluştu
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
              Bütçenizi değil, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                hayallerinizi
              </span> yönetin.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-lg">
              Kısıtlayıcı listeleri unutun. MindfulSpend AI, alışveriş anında devreye giren proaktif bir koçtur. Dürtüsel harcamalarınızı yargılamaz, onları hedeflerinize yönlendirir.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-full font-bold text-lg transition shadow-[0_0_40px_-10px_rgba(20,184,166,0.5)] flex items-center justify-center gap-2 group"
              >
                Finansal Yolculuğa Çık <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex items-center gap-4 text-sm text-slate-500 font-medium pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="text-teal-500" size={16}/> Kart Bağlama Yok</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="text-teal-500" size={16}/> %100 Ücretsiz</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="text-teal-500" size={16}/> Güvenli Altyapı</span>
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
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-indigo-500 rounded-3xl transform rotate-6 opacity-20 blur-xl"></div>
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-sm font-medium">Toplam Varlık</p>
                    <p className="text-3xl font-bold text-white">₺34,250.00</p>
                  </div>
                  <div className="w-12 h-12 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-400">
                    <Wallet />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">☕</div>
                    <div>
                      <p className="text-white font-medium text-sm">Gece Kahvesi - İsteğe Bağlı</p>
                      <p className="text-slate-400 text-xs mt-1">Bu 150 TL'yi Tatil Fonuna aktarırsan hedefine 3 gün erken ulaşırsın!</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400"><Target size={20} /></div>
                      <div>
                        <p className="text-white font-medium text-sm">Tatil Fonu</p>
                        <p className="text-slate-400 text-xs">Hedefin %45'i tamamlandı</p>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm">+₺150</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section / Nudge Theory */}
      <section className="py-24 bg-slate-800/30 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Suçluluk duygusuna son. <br/>Akıllı yönlendirmelerle tanışın.</h2>
            <p className="text-slate-400 text-lg">
              Sistemimiz Richard Thaler'in Nobel ödüllü <strong>Nudge (Dürtme) Teorisi</strong> üzerine kuruludur. Size "bunu alamazsın" demek yerine, karar anında proaktif alternatifler sunar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800 transition duration-300">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Tersine RFM Analizi</h3>
              <p className="text-slate-400 leading-relaxed">
                E-ticaret sitelerinin size daha fazla ürün satmak için kullandığı sadakat algoritmalarını tersine mühendislikle risk hesaplamak için kullanıyoruz.
              </p>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800 transition duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full"></div>
              <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-6">
                <Brain size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Yapay Zeka Karar Motoru</h3>
              <p className="text-slate-400 leading-relaxed">
                Alışveriş sepetinizi analiz eden AI, anlık harcamanızın bütçenizi aşma riskini milisaniyeler içinde hesaplar ve müdahale eder.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800 transition duration-300">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Tam Gizlilik & Otonomi</h3>
              <p className="text-slate-400 leading-relaxed">
                Gerçek banka verilerinize erişilmez. Kendi hedeflerinizi belirler ve Sanal Market'te risksiz bir ortamda finansal davranışınızı simüle edersiniz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="text-teal-500" size={24} />
          <span className="text-xl font-bold text-white">MindfulSpend<span className="text-teal-400">AI</span></span>
        </div>
        <p className="text-slate-500 text-sm">
          Hackathon 2026 için geliştirilmiştir. Davranışsal finansın gücüyle bütçenizi yönetin.
        </p>
      </footer>
    </div>
  );
}
