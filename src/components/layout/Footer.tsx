import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import qastlyLogo from '@/assets/qastly-logo.png';

export default function Footer() {
  const { t, settings } = useApp();

  return (
    <footer className="bg-[#060e1d] text-white pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src={qastlyLogo} alt="Qastly" className="h-11 w-11 object-contain rounded-xl" />
              <div>
                <div className="font-black text-2xl text-white tracking-tight">{settings.siteNameEn}</div>
                <div className="text-[#00d4ff] text-xs font-semibold tracking-widest uppercase mt-0.5">
                  {t('حلول التقسيط الذكي', 'Smart Installment Solutions')}
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              {t(
                'قسطلي — منظومة التمويل الذكي للجيل القادم. اشتري منتجاتك المفضلة بأقساط شهرية ميسرة بدون فوائد خفية.',
                "Qastly — Smart financing for the next generation. Buy your favorites with easy monthly installments and no hidden fees."
              )}
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, url: settings.facebookUrl },
                { icon: Instagram, url: settings.instagramUrl },
                { icon: Twitter, url: settings.twitterUrl },
                { icon: Youtube, url: settings.youtubeUrl },
              ].map(({ icon: Icon, url }, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-[#00d4ff] hover:border-[#00d4ff] hover:text-[#0a1628] flex items-center justify-center text-white/60 transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-[#00d4ff] mb-5">{t('روابط سريعة', 'Quick Links')}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t('الرئيسية', 'Home'), href: '/' },
                { label: t('تصفح المنتجات', 'Browse Products'), href: '/products' },
                { label: t('تواصل معنا', 'Contact Us'), href: '/contact' },
                { label: t('تتبع طلبي', 'Track Order'), href: '/my-orders' },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-slate-400 hover:text-[#00d4ff] transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#00d4ff]/50 rounded-full" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-[#00d4ff] mb-5">{t('الفئات', 'Categories')}</h4>
            <ul className="space-y-2.5">
              {[
                t('موبايلات', 'Phones'),
                t('لابتوبات', 'Laptops'),
                t('تليفزيونات', 'TVs'),
                t('أجهزة منزلية', 'Appliances'),
                t('ألعاب', 'Gaming'),
              ].map(cat => (
                <li key={cat}>
                  <Link to={`/products?category=${cat}`} className="text-slate-400 hover:text-[#00d4ff] transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#c9a84c]/50 rounded-full" />
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-[#00d4ff] mb-5">{t('تواصل معنا', 'Contact Us')}</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="w-8 h-8 bg-[#00d4ff]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone size={14} className="text-[#00d4ff]" />
                </div>
                <a href={`tel:${settings.contactPhone}`} dir="ltr" className="hover:text-[#00d4ff] transition-colors">{settings.contactPhone}</a>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="w-8 h-8 bg-[#00d4ff]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-[#00d4ff]" />
                </div>
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-[#00d4ff] transition-colors">{settings.contactEmail}</a>
              </li>
              <li className="flex items-start gap-3 text-slate-400 text-sm">
                <div className="w-8 h-8 bg-[#00d4ff]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} className="text-[#00d4ff]" />
                </div>
                <span>{t('جمهورية مصر العربية', 'Arab Republic of Egypt')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">{settings.footerTextAr}</p>
          <div className="flex gap-4 text-slate-500 text-xs">
            <Link to="/privacy" className="hover:text-[#00d4ff] cursor-pointer transition-colors">{t('سياسة الخصوصية', 'Privacy Policy')}</Link>
            <span className="text-white/20">•</span>
            <Link to="/terms" className="hover:text-[#00d4ff] cursor-pointer transition-colors">{t('الشروط والأحكام', 'Terms & Conditions')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
