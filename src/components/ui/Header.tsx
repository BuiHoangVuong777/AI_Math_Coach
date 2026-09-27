import { normalizeLanguage } from '@/types';
import { useFieldStore } from '@/stores/fieldStore';
import { useState } from 'react';
import { Globe, Info, FlaskConical, X, Keyboard, MousePointer, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { t, i18n } = useTranslation();
  const [showAbout, setShowAbout] = useState(false);
  
  const toggleLanguage = () => {
    const language = normalizeLanguage(i18n.language);
    const newLang = language === 'vi' ? 'en' : language === 'en' ? 'zh' : 'vi';
    useFieldStore.getState().setLanguage(newLang);
  };

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0a0a1a] flex items-center justify-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  ∑
                </span>
              </div>
            </div>
            {/* 辉光 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 blur-lg opacity-30 -z-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-['Space_Grotesk'] tracking-wide">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Math
              </span>
              <span className="text-white">Universe</span>
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">
              {t('app.subtitle')}
            </p>
          </div>
        </motion.div>
        
        {/* 右侧操作按钮 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          {/* 球体样式测试 */}
          <Link to="/sphere-test">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="glass p-2.5 rounded-full hover:bg-cyan-500/20 transition-colors btn-glow"
              title={t('sphere.testPageTitle')}
            >
              <FlaskConical className="w-5 h-5 text-cyan-400" />
            </motion.button>
          </Link>

          {/* 信息按钮 */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="glass p-2.5 rounded-full hover:bg-indigo-500/20 transition-colors btn-glow"
            title={t('app.about')}
            onClick={() => setShowAbout(true)}
          >
            <Info className="w-5 h-5 text-white" />
          </motion.button>
          
          {/* 语言切换 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLanguage}
            aria-label={t('app.changeLanguage')}
            title={t('app.changeLanguage')}
            className="glass px-4 py-2 rounded-full hover:bg-indigo-500/20 transition-colors btn-glow flex items-center gap-2"
          >
            <Globe className="w-5 h-5 text-indigo-400" />
            <span className="text-white text-sm font-medium uppercase tracking-wider">
              {i18n.language.toUpperCase()}
            </span>
          </motion.button>
        </motion.div>
      </div>
      </header>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={() => setShowAbout(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-[420px] max-w-[90vw] bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">
                  {t('app.about')} MathUniverse
                </h2>
                <button onClick={() => setShowAbout(false)} aria-label={t('detail.close')} title={t('detail.close')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-sm text-gray-300">
                <p>
                  {t('app.description')}
                </p>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {t('app.controls')}
                  </h3>
                  <div className="flex items-center gap-3">
                    <Keyboard className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>{t('app.shortcut')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MousePointer className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>{t('3d.hint')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>{t('app.dragSearch')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
