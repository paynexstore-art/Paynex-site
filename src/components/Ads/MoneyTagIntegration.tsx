/**
 * MoneyTag Integration — Qastly
 *
 * Anti-adblock + Vignette + Pop-under strategy for maximum revenue.
 * Loads MoneyTag scripts lazily after user interaction milestones
 * (e.g., order submit, scroll depth) to avoid hurting Core Web Vitals.
 */

import { useEffect, useRef } from 'react';

interface MoneyTagConfig {
  siteId?: string;
  vignetteEnabled?: boolean;
  popunderEnabled?: boolean;
  antiAdblockEnabled?: boolean;
  frequencyCapMinutes?: number; // default 30
}

const MT_CONFIG: MoneyTagConfig = {
  siteId: import.meta.env.VITE_MONEYTAG_SITE_ID || '',
  vignetteEnabled: true,
  popunderEnabled: true,
  antiAdblockEnabled: true,
  frequencyCapMinutes: 30,
};

const STORAGE_KEY = 'qastly_mt_last_shown';

function canShowAd(): boolean {
  const last = Number(localStorage.getItem(STORAGE_KEY) || '0');
  const mins = (Date.now() - last) / 60000;
  return mins >= (MT_CONFIG.frequencyCapMinutes || 30);
}
function markAdShown(): void {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

/**
 * Load MoneyTag script lazily. Call after a meaningful interaction.
 */
export function loadMoneyTag(): void {
  if (!MT_CONFIG.siteId) return;
  if (!canShowAd()) return;

  const existing = document.querySelector('script[data-moneytag]');
  if (existing) return;

  const script = document.createElement('script');
  script.src = `https://cdn.moneytag.tech/js/${MT_CONFIG.siteId}.js`;
  script.async = true;
  script.defer = true;
  script.dataset.moneytag = 'true';
  script.onload = () => {
    markAdShown();
    console.log('[MoneyTag] Loaded');
  };
  script.onerror = () => console.warn('[MoneyTag] Failed to load');
  document.body.appendChild(script);
}

/**
 * Hook: trigger MoneyTag on specific user milestones
 */
export function useMoneyTagOnMilestone(milestone: 'scroll-50' | 'order-submit' | 'time-30s') {
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;

    if (milestone === 'order-submit') {
      // Call loadMoneyTag() imperatively from the order success page
      return;
    }

    if (milestone === 'time-30s') {
      const timer = setTimeout(() => {
        if (!triggered.current) {
          triggered.current = true;
          loadMoneyTag();
        }
      }, 30000);
      return () => clearTimeout(timer);
    }

    if (milestone === 'scroll-50') {
      const handler = () => {
        if (triggered.current) return;
        const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        if (scrollPercent >= 0.5) {
          triggered.current = true;
          loadMoneyTag();
        }
      };
      window.addEventListener('scroll', handler, { passive: true });
      return () => window.removeEventListener('scroll', handler);
    }
  }, [milestone]);
}

/**
 * Anti-adblock detection (soft). Shows a polite reminder to disable adblock
 * on high-value pages (e.g., product pages, order success).
 */
export function detectAdBlock(): Promise<boolean> {
  return new Promise((resolve) => {
    const bait = document.createElement('div');
    bait.className = 'adsbox';
    bait.style.cssText = 'position:absolute;left:-9999px;height:1px;width:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(bait);
    setTimeout(() => {
      const blocked = !bait.offsetHeight || getComputedStyle(bait).display === 'none';
      bait.remove();
      resolve(blocked);
    }, 150);
  });
}

/**
 * Component: AdBlockWarning banner (rendered conditionally by parent)
 */
export function AdBlockWarning({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a1628] text-white p-4 text-center text-sm shadow-2xl">
      <p className="font-medium">
        🚫 يبدو أنك تستخدم مانع إعلانات. الإعلانات تساعدنا في تقديم خدمة التقسيط بأسعار ميسرة.
      </p>
      <button onClick={onDismiss} className="mt-2 text-xs underline text-[#00d4ff]">
        فهمت، أغلق
      </button>
    </div>
  );
}
