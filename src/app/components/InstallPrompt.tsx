import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  isLightMode: boolean;
}

export default function InstallPrompt({ isLightMode }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-[70]"
        >
          <div className={`${isLightMode ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-700'} border rounded-2xl p-4 shadow-2xl`}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl ${isLightMode ? 'bg-purple-100' : 'bg-purple-900/30'} flex items-center justify-center flex-shrink-0`}>
                <Download size={24} className={isLightMode ? 'text-purple-600' : 'text-purple-400'} />
              </div>
              <div className="flex-1">
                <h3 className={`text-base mb-1 ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>
                  Instalar Eventos
                </h3>
                <p className={`text-sm mb-3 ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                  Instala la app en tu dispositivo para acceso rápido
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Instalar
                  </button>
                  <button
                    onClick={handleClose}
                    className={`px-4 py-2 rounded-lg transition-colors ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'}`}
                  >
                    <X size={18} className={isLightMode ? 'text-neutral-600' : 'text-neutral-400'} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
