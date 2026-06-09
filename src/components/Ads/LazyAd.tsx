/**
 * LazyAd — PayNex Ad Revenue Optimization
 *
 * Lazy-loads ad slots via IntersectionObserver to prevent
 * layout shift (CLS) and speed up initial page paint.
 * Reserves a fixed-size container for the ad to prevent CLS.
 */

import { useEffect, useRef, useState } from 'react';

interface LazyAdProps {
  slotId: string;
  width?: number;
  height?: number;
  className?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  layout?: string;
  // MoneyTag fallback
  moneyTagZone?: string;
  onView?: () => void;
}

export function LazyAd({
  slotId,
  width = 300,
  height = 250,
  className = '',
  format = 'auto',
  layout,
  moneyTagZone,
  onView,
}: LazyAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || loaded) return;
    setLoaded(true);
    onView?.();

    // AdSense lazy injection
    try {
      const win = window as any;
      if (win.adsbygoogle && win.adsbygoogle.push) {
        win.adsbygoogle.push({});
      }
    } catch (e) {
      console.warn('[LazyAd] AdSense push failed', e);
    }
  }, [inView, loaded, onView]);

  return (
    <div
      ref={containerRef}
      className={`ad-container ${className}`}
      style={{
        width: '100%',
        maxWidth: width,
        minHeight: height,
        background: 'rgba(0,0,0,0.03)',
        borderRadius: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      data-ad-slot={slotId}
      data-money-tag-zone={moneyTagZone}
    >
      {loaded && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height }}
          data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-xxxxxxxxxx'}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
          {...(layout ? { 'data-ad-layout': layout } : {})}
        />
      )}
      {!loaded && (
        <span className="text-[10px] text-slate-300 uppercase tracking-widest">
          Loading Ad...
        </span>
      )}
    </div>
  );
}

/**
 * Sticky bottom ad bar (for supervisor dashboard / mobile)
 */
export function StickyAdBar({ slotId, height = 60 }: { slotId: string; height?: number }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-t border-slate-200"
      style={{ height }}
    >
      <div className="mx-auto max-w-7xl h-full flex items-center justify-center px-4">
        <LazyAd slotId={slotId} width={728} height={height} format="horizontal" />
      </div>
    </div>
  );
}

/**
 * In-feed native ad card (blends with product cards)
 */
export function InFeedAdCard({ slotId, index }: { slotId: string; index: number }) {
  return (
    <div className="card-surface p-5 flex flex-col items-center justify-center gap-3 min-h-[240px] border-dashed border-2 border-slate-200">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sponsored</span>
      <LazyAd slotId={`${slotId}-${index}`} width={300} height={250} format="rectangle" />
    </div>
  );
}
