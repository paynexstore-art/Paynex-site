/**
 * AdminSEO — PayNex SEO & Revenue Optimization Control Panel
 *
 * Allows the admin to:
 * 1. Edit Meta tags per page (title, description, keywords, alt text)
 * 2. Inject custom header/footer code (tracking pixels, ads, etc.)
 * 3. Manage robots.txt and sitemap.xml preview
 * 4. View SEO health score per page
 * 5. Configure AdSense & MoneyTag settings
 * 6. Set up lazy-loading and CLS prevention for ad slots
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  Search, Globe, Code, FileText, Shield, BarChart3, Map,
  Save, Check, AlertTriangle, Loader2, Megaphone,
  DollarSign, Layers, Eye, MousePointer
} from 'lucide-react';
import { toast } from 'sonner';

interface PageSEO {
  path: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  keywords: string[];
  altText: string;
  ogImage: string;
  noindex: boolean;
  lastModified: string;
}

interface AdConfig {
  adsenseClient: string;
  moneyTagSiteId: string;
  vignetteEnabled: boolean;
  popunderEnabled: boolean;
  antiAdblockEnabled: boolean;
  frequencyCapMinutes: number;
  lazyLoadAds: boolean;
  reservedAdSlots: boolean; // prevent CLS
  autoRefreshSupervisor: boolean;
}

const DEFAULT_PAGES: PageSEO[] = [
  { path: '/', titleAr: 'PayNex باينكس - حلول التقسيط الذكي', titleEn: 'PayNex - Smart Installment Solutions', descriptionAr: 'اشتري موبايلات ولابتوبات وأجهزة منزلية بالتقسيط بدون فوائد. أكثر من 1000 منتج في 27 محافظة.', descriptionEn: 'Buy phones, laptops & home appliances in installments with zero hidden interest. 1000+ products across 27 provinces.', keywords: ['تقسيط', 'باينكس', 'PayNex', 'موبايلات بالتقسيط', 'أجهزة منزلية', '0 فوائد'], altText: 'PayNex Hero Banner - Smart Installments', ogImage: '', noindex: false, lastModified: new Date().toISOString() },
  { path: '/products', titleAr: 'تصفح المنتجات — PayNex باينكس', titleEn: 'Browse Products — PayNex', descriptionAr: 'تصفح أحدث الموبايلات واللابتوبات والأجهزة المنزلية المتاحة بالتقسيط.', descriptionEn: 'Browse latest phones, laptops & home appliances available on installments.', keywords: ['منتجات', 'تقسيط', 'PayNex', 'موبايلات', 'لابتوبات'], altText: 'PayNex Products Catalog', ogImage: '', noindex: false, lastModified: new Date().toISOString() },
  { path: '/contact', titleAr: 'تواصل مع باينكس — PayNex | خدمة العملاء', titleEn: 'Contact PayNex | Customer Service', descriptionAr: 'تواصل مع فريق خدمة العملاء في باينكس للاستفسار والدعم.', descriptionEn: 'Contact PayNex customer support team for inquiries.', keywords: ['تواصل', 'دعم', 'PayNex', 'خدمة عملاء'], altText: 'PayNex Contact', ogImage: '', noindex: false, lastModified: new Date().toISOString() },
  { path: '/login', titleAr: 'تسجيل الدخول — PayNex باينكس', titleEn: 'Login — PayNex', descriptionAr: 'سجّل الدخول إلى حسابك في باينكس لمتابعة طلباتك.', descriptionEn: 'Log in to your PayNex account to track orders.', keywords: ['تسجيل دخول', 'PayNex', 'حسابي'], altText: 'PayNex Login', ogImage: '', noindex: true, lastModified: new Date().toISOString() },
];

const STORAGE_KEY = 'paynex_seo_pages';
const HEADER_CODE_KEY = 'paynex_custom_header_code';
const FOOTER_CODE_KEY = 'paynex_custom_footer_code';
const ROBOTS_KEY = 'paynex_robots_txt';
const ADS_CONFIG_KEY = 'paynex_ad_config';

function loadPages(): PageSEO[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_PAGES;
}

function savePages(pages: PageSEO[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

function loadAdConfig(): AdConfig {
  try {
    const raw = localStorage.getItem(ADS_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    adsenseClient: 'ca-pub-xxxxxxxxxx',
    moneyTagSiteId: '',
    vignetteEnabled: true,
    popunderEnabled: true,
    antiAdblockEnabled: true,
    frequencyCapMinutes: 30,
    lazyLoadAds: true,
    reservedAdSlots: true,
    autoRefreshSupervisor: false,
  };
}

function saveAdConfig(config: AdConfig) {
  localStorage.setItem(ADS_CONFIG_KEY, JSON.stringify(config));
}

function calcScore(p: PageSEO): number {
  let s = 0;
  if (p.titleAr.length > 10 && p.titleEn.length > 10) s += 25;
  if (p.descriptionAr.length > 50 && p.descriptionEn.length > 50) s += 25;
  if (p.keywords.length >= 3) s += 20;
  if (p.altText.trim()) s += 15;
  if (p.ogImage.trim()) s += 15;
  return s;
}

function generateRobots(pages: PageSEO[]): string {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /supervisor',
    'Disallow: /login',
    'Disallow: /auth/',
    'Sitemap: https://paynex.com/sitemap.xml',
    'Host: https://paynex.com',
  ];
  pages.forEach(p => {
    if (p.noindex) {
      lines.push(`Disallow: ${p.path}`);
    }
  });
  return lines.join('\n');
}

function generateSitemap(pages: PageSEO[]): string {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.filter(p => !p.noindex).map(p => `  <url>\n    <loc>https://paynex.com${p.path}</loc>\n    <lastmod>${p.lastModified.split('T')[0]}</lastmod>\n    <priority>${p.path === '/' ? '1.0' : '0.8'}</priority>\n  </url>`),
    '</urlset>',
  ];
  return xml.join('\n');
}

export default function AdminSEO() {
  const { isAdmin } = useAuth();
  const { t } = useApp();
  const [pages, setPages] = useState<PageSEO[]>(loadPages);
  const [activeTab, setActiveTab] = useState<'seo' | 'code' | 'sitemap' | 'ads' | 'health'>('seo');
  const [selectedPath, setSelectedPath] = useState(pages[0].path);
  const [headerCode, setHeaderCode] = useState(localStorage.getItem(HEADER_CODE_KEY) ?? '');
  const [footerCode, setFooterCode] = useState(localStorage.getItem(FOOTER_CODE_KEY) ?? '');
  const [robotsTxt, setRobotsTxt] = useState(localStorage.getItem(ROBOTS_KEY) ?? generateRobots(pages));
  const [adConfig, setAdConfig] = useState<AdConfig>(loadAdConfig);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedPage = pages.find(p => p.path === selectedPath) || pages[0];
  const score = calcScore(selectedPage);
  const avgScore = Math.round(pages.reduce((a, b) => a + calcScore(b), 0) / pages.length);

  const handleSave = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      savePages(pages);
      localStorage.setItem(HEADER_CODE_KEY, headerCode);
      localStorage.setItem(FOOTER_CODE_KEY, footerCode);
      localStorage.setItem(ROBOTS_KEY, robotsTxt);
      saveAdConfig(adConfig);
      setLoading(false);
      setSaved(true);
      toast.success('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  }, [pages, headerCode, footerCode, robotsTxt, adConfig]);

  const updatePage = (path: string, patch: Partial<PageSEO>) => {
    setPages(prev => prev.map(p => p.path === path ? { ...p, ...patch, lastModified: new Date().toISOString() } : p));
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center bg-[#0a1628] text-white text-xl">🚫 Access Denied</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center text-[#00d4ff]">
              <Search size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0a1628]">SEO &amp; Revenue Optimization</h1>
              <p className="text-slate-500 text-sm">تحكم كامل في الميتا، الإعلانات، والخريطة</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {loading ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : 'حفظ الإعدادات'}
          </button>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'متوسط SEO Score', value: `${avgScore}%`, color: avgScore >= 80 ? 'text-emerald-600' : avgScore >= 60 ? 'text-amber-600' : 'text-red-600', icon: BarChart3 },
            { label: 'الصفحات المفهرسة', value: pages.filter(p => !p.noindex).length, color: 'text-[#0a1628]', icon: Globe },
            { label: 'الصفحات المحجوبة', value: pages.filter(p => p.noindex).length, color: 'text-slate-500', icon: Shield },
            { label: 'نقاط Ad Config', value: adConfig.lazyLoadAds ? 'Active' : 'Off', color: 'text-[#c9a84c]', icon: Megaphone },
          ].map((s, i) => (
            <div key={i} className="stat-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <s.icon size={18} />
              </div>
              <div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          {[
            { id: 'seo' as const, label: 'SEO & Meta', icon: Search },
            { id: 'code' as const, label: 'Header & Footer', icon: Code },
            { id: 'sitemap' as const, label: 'Sitemap & Robots', icon: Map },
            { id: 'ads' as const, label: 'Ads & Monetization', icon: DollarSign },
            { id: 'health' as const, label: 'Health Check', icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#0a1628] text-[#0a1628]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-[#0a1628] mb-3 flex items-center gap-2">
                  <Layers size={16} /> الصفحات
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {pages.map(p => (
                    <button
                      key={p.path}
                      onClick={() => setSelectedPath(p.path)}
                      className={`w-full text-start px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedPath === p.path
                          ? 'bg-[#0a1628] text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{p.path}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${calcScore(p) >= 80 ? 'bg-emerald-100 text-emerald-700' : calcScore(p) >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {calcScore(p)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#0a1628] text-lg">{selectedPage.path}</h3>
                  <div className={`text-sm font-bold px-3 py-1 rounded-full ${score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    SEO Score: {score}%
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Title (AR)</label>
                    <input
                      className="input-field"
                      value={selectedPage.titleAr}
                      onChange={e => updatePage(selectedPage.path, { titleAr: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Title (EN)</label>
                    <input
                      className="input-field"
                      value={selectedPage.titleEn}
                      onChange={e => updatePage(selectedPage.path, { titleEn: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Description (AR)</label>
                    <textarea
                      className="input-field resize-none"
                      rows={3}
                      value={selectedPage.descriptionAr}
                      onChange={e => updatePage(selectedPage.path, { descriptionAr: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Description (EN)</label>
                    <textarea
                      className="input-field resize-none"
                      rows={3}
                      value={selectedPage.descriptionEn}
                      onChange={e => updatePage(selectedPage.path, { descriptionEn: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Keywords (comma separated)</label>
                    <input
                      className="input-field"
                      value={selectedPage.keywords.join(', ')}
                      onChange={e => updatePage(selectedPage.path, { keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Alt Text (Main Image)</label>
                    <input
                      className="input-field"
                      value={selectedPage.altText}
                      onChange={e => updatePage(selectedPage.path, { altText: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">OG Image URL</label>
                    <input
                      className="input-field"
                      placeholder="https://paynex.com/og-image.jpg"
                      value={selectedPage.ogImage}
                      onChange={e => updatePage(selectedPage.path, { ogImage: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-3 md:col-span-2">
                    <input
                      id="noindex"
                      type="checkbox"
                      checked={selectedPage.noindex}
                      onChange={e => updatePage(selectedPage.path, { noindex: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="noindex" className="text-sm text-slate-700 font-medium">Noindex (منع الفهرسة)</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-[#0a1628] mb-3 flex items-center gap-2">
                <Code size={16} /> Custom Header Code
              </h3>
              <p className="text-xs text-slate-500 mb-2">يُحقن مباشرة بعد &lt;head&gt; (مثال: Google Tag Manager, Meta Pixel, MoneyTag)</p>
              <textarea
                className="input-field font-mono text-xs resize-none"
                rows={12}
                value={headerCode}
                onChange={e => setHeaderCode(e.target.value)}
                placeholder="<!-- Google Tag Manager --><script>...</script>"
              />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-[#0a1628] mb-3 flex items-center gap-2">
                <Code size={16} /> Custom Footer Code
              </h3>
              <p className="text-xs text-slate-500 mb-2">يُحقن قبل &lt;/body&gt; (مثال: Analytics, Chat Widgets)</p>
              <textarea
                className="input-field font-mono text-xs resize-none"
                rows={12}
                value={footerCode}
                onChange={e => setFooterCode(e.target.value)}
                placeholder="<!-- Global site tag (gtag.js) --><script async>...</script>"
              />
            </div>
          </div>
        )}

        {/* Sitemap Tab */}
        {activeTab === 'sitemap' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-[#0a1628] mb-3 flex items-center gap-2">
                <Map size={16} /> sitemap.xml (Preview)
              </h3>
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono overflow-auto h-80">
                {generateSitemap(pages)}
              </pre>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-[#0a1628] mb-3 flex items-center gap-2">
                <FileText size={16} /> robots.txt (Preview)
              </h3>
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono overflow-auto h-80">
                {robotsTxt}
              </pre>
              <textarea
                className="input-field font-mono text-xs resize-none mt-4"
                rows={6}
                value={robotsTxt}
                onChange={e => setRobotsTxt(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-bold text-[#0a1628] text-lg flex items-center gap-2">
                <DollarSign size={18} /> AdSense &amp; MoneyTag Config
              </h3>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">AdSense Client ID</label>
                <input
                  className="input-field"
                  value={adConfig.adsenseClient}
                  onChange={e => setAdConfig(prev => ({ ...prev, adsenseClient: e.target.value }))}
                  placeholder="ca-pub-xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">MoneyTag Site ID</label>
                <input
                  className="input-field"
                  value={adConfig.moneyTagSiteId}
                  onChange={e => setAdConfig(prev => ({ ...prev, moneyTagSiteId: e.target.value }))}
                  placeholder="mt-xxxxxxxxxx"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'vignetteEnabled', label: 'Vignette (Mobile)' },
                  { key: 'popunderEnabled', label: 'Pop-under' },
                  { key: 'antiAdblockEnabled', label: 'Anti-Adblock' },
                  { key: 'lazyLoadAds', label: 'Lazy Loading Ads' },
                  { key: 'reservedAdSlots', label: 'Reserve Ad Space (CLS)' },
                  { key: 'autoRefreshSupervisor', label: 'Auto-refresh (Supervisor)' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <input
                      id={item.key}
                      type="checkbox"
                      checked={(adConfig as any)[item.key]}
                      onChange={e => setAdConfig(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor={item.key} className="text-sm text-slate-700">{item.label}</label>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Frequency Cap (minutes)</label>
                <input
                  type="number"
                  className="input-field"
                  value={adConfig.frequencyCapMinutes}
                  onChange={e => setAdConfig(prev => ({ ...prev, frequencyCapMinutes: Number(e.target.value) }))}
                  min={5}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-[#0a1628] mb-3 flex items-center gap-2">
                <Eye size={16} /> Ad Slot Strategy
              </h3>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0a1628] text-white flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <div className="font-bold">Hero &amp; Product Feed</div>
                    <div className="text-xs text-slate-500">In-feed native ads between product cards (Lazy loaded, 300x250)</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0a1628] text-white flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <div className="font-bold">Sidebar Sticky (Supervisor)</div>
                    <div className="text-xs text-slate-500">160x600 or 300x600 sticky banner for high impression CPM</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0a1628] text-white flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <div className="font-bold">Order Success (Vignette)</div>
                    <div className="text-xs text-slate-500">Trigger MoneyTag vignette after successful order submission</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0a1628] text-white flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <div className="font-bold">Bottom Sticky (Mobile)</div>
                    <div className="text-xs text-slate-500">728x90 or 320x50 sticky banner for mobile users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-[#0a1628] mb-4">SEO Health Check</h3>
            <div className="space-y-3">
              {pages.map(p => {
                const s = calcScore(p);
                return (
                  <div key={p.path} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${s >= 80 ? 'bg-emerald-100 text-emerald-700' : s >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {s}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#0a1628]">{p.path}</div>
                        <div className="text-xs text-slate-500">{p.titleAr}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.noindex && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">Noindex</span>}
                      {!p.ogImage && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">Missing OG</span>}
                      {p.keywords.length < 3 && <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">Low Keywords</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
