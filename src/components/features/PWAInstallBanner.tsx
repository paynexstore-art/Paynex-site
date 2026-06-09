import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const { t } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('paynex_pwa_dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show manual install instructions on mobile if no prompt after 3 sec
    const timer = setTimeout(() => {
      if (!deferredPrompt && !dismissed) {
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        if (isMobile) setShowBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
    } else {
      // Show manual install instructions
      alert(
        t(
          'لتثبيت التطبيق:\n• على أندرويد: اضغط على القائمة (⋮) ثم "إضافة إلى الشاشة الرئيسية"\n• على iPhone: اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"',
          'To install the app:\n• On Android: Tap the menu (⋮) then "Add to Home Screen"\n• On iPhone: Tap the Share button then "Add to Home Screen"'
        )
      );
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('paynex_pwa_dismissed', '1');
  }

  if (!showBanner || dismissed) return null;

  return (
    <div className="pwa-install-banner no-print animate-fade-in">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone size={20} />
        </div>
        <div>
          <p className="font-semibold text-sm">{t('حمّل تطبيق باينكس', 'Download PayNex App')}</p>
          <p className="text-white/70 text-xs">
            {t('ثبّت التطبيق على هاتفك للوصول السريع', 'Install on your phone for quick access')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 ms-3">
        <button
          onClick={handleInstall}
          className="bg-[#d4a339] text-[#0f2460] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1 hover:bg-[#eabe5a] transition-colors"
        >
          <Download size={16} />
          {t('تثبيت', 'Install')}
        </button>
        <button
          onClick={handleDismiss}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
