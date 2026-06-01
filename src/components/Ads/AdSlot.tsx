import { useEffect } from 'react';

interface AdSlotProps {
  slotId: string;
  format?: 'vertical' | 'horizontal' | 'square' | 'responsive';
  className?: string;
}

export function AdSlot({ slotId, format = 'responsive', className = '' }: AdSlotProps) {
  useEffect(() => {
    // Load Google AdSense script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx';
    script.onload = () => {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const getAdDimensions = () => {
    switch (format) {
      case 'vertical':
        return 'w-[300px] h-[600px]';
      case 'horizontal':
        return 'w-[728px] h-[90px]';
      case 'square':
        return 'w-[300px] h-[300px]';
      default:
        return 'w-full max-w-4xl h-auto';
    }
  };

  return (
    <div className={`flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 ${getAdDimensions()} ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...(format === 'responsive' && {
            width: '100%',
            height: 'auto'
          })
        }}
        data-ad-client={import.meta.env.VITE_GOOGLE_AD_CLIENT || 'ca-pub-xxxxxxxxxxxxxxxx'}
        data-ad-slot={slotId}
        data-ad-format={format === 'responsive' ? 'auto' : 'fixed'}
        data-full-width-responsive={format === 'responsive' ? 'true' : 'false'}
      />
      <p className="text-xs text-slate-400">الإعلانات</p>
    </div>
  );
}
