import { useEffect, useState } from 'react';
import { Settings, DollarSign, Zap, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  getAdminSettings,
  saveFeeSettings,
  saveAdSettings,
  saveSEOSettings,
  type AdminSettings as AdminSettingsType
} from '@/lib/admin-settings';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { t } = useApp();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AdminSettingsType | null>(null);
  const [activeTab, setActiveTab] = useState<'fees' | 'ads' | 'seo'>('fees');

  // Fee form state
  const [transactionFee, setTransactionFee] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [refundFee, setRefundFee] = useState(0);

  // Ads form state
  const [googleAdClient, setGoogleAdClient] = useState('');
  const [enableAds, setEnableAds] = useState(false);

  // SEO form state
  const [enableAnalytics, setEnableAnalytics] = useState(false);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getAdminSettings();
      if (data) {
        setSettings(data);
        setTransactionFee(data.fees.transaction_fee);
        setPlatformFee(data.fees.platform_fee);
        setRefundFee(data.fees.refund_fee);
        setGoogleAdClient(data.ads.google_ad_client);
        setEnableAds(data.ads.enable_ads);
        setEnableAnalytics(data.seo.enable_analytics);
        setGoogleAnalyticsId(data.seo.google_analytics_id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFees = async () => {
    setLoading(true);
    try {
      const success = await saveFeeSettings({
        transaction_fee: transactionFee,
        platform_fee: platformFee,
        refund_fee: refundFee
      });
      if (success) {
        setSettings(prev => prev ? {
          ...prev,
          fees: { transaction_fee: transactionFee, platform_fee: platformFee, refund_fee: refundFee }
        } : null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAds = async () => {
    setLoading(true);
    try {
      const success = await saveAdSettings({
        google_ad_client: googleAdClient,
        enable_ads: enableAds,
        ad_slots: {}
      });
      if (success) {
        setSettings(prev => prev ? {
          ...prev,
          ads: { google_ad_client: googleAdClient, enable_ads: enableAds, ad_slots: {} }
        } : null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSEO = async () => {
    setLoading(true);
    try {
      const success = await saveSEOSettings({
        enable_analytics: enableAnalytics,
        google_analytics_id: googleAnalyticsId
      });
      if (success) {
        setSettings(prev => prev ? {
          ...prev,
          seo: { enable_analytics: enableAnalytics, google_analytics_id: googleAnalyticsId }
        } : null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[#0f2460]">⚙️ إعدادات الإدارة</h1>
        <p className="text-slate-600 mt-2">إدارة الرسوم والإعلانات و SEO</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'fees' as const, label: '💰 الرسوم', icon: DollarSign },
          { id: 'ads' as const, label: '📢 الإعلانات', icon: Zap },
          { id: 'seo' as const, label: '🔍 SEO', icon: Search }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#0f2460] text-[#0f2460]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6">إعدادات الرسوم</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">رسوم المعاملات (%)</label>
              <input
                type="number"
                value={transactionFee}
                onChange={(e) => setTransactionFee(parseFloat(e.target.value))}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f2460]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">رسوم Qastly (%)</label>
              <input
                type="number"
                value={platformFee}
                onChange={(e) => setPlatformFee(parseFloat(e.target.value))}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f2460]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">رسوم الاسترجاع (%)</label>
              <input
                type="number"
                value={refundFee}
                onChange={(e) => setRefundFee(parseFloat(e.target.value))}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f2460]"
              />
            </div>
            <button
              onClick={handleSaveFees}
              disabled={loading}
              className="w-full px-4 py-3 bg-[#0f2460] text-white rounded-lg hover:bg-[#0f2460]/90 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الرسوم'}
            </button>
          </div>
        </div>
      )}

      {/* Ads Tab */}
      {activeTab === 'ads' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6">إعدادات إعلانات Google</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">معرّف ناشر Google AdSense</label>
              <input
                type="text"
                value={googleAdClient}
                onChange={(e) => setGoogleAdClient(e.target.value)}
                placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f2460]"
              />
              <p className="text-xs text-slate-500 mt-2">يمكنك الحصول عليه من Google AdSense</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableAds"
                checked={enableAds}
                onChange={(e) => setEnableAds(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="enableAds" className="text-sm font-medium text-slate-700">
                تفعيل الإعلانات على الموقع
              </label>
            </div>
            <button
              onClick={handleSaveAds}
              disabled={loading}
              className="w-full px-4 py-3 bg-[#0f2460] text-white rounded-lg hover:bg-[#0f2460]/90 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ إعدادات الإعلانات'}
            </button>
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6">إعدادات SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">معرّف Google Analytics</label>
              <input
                type="text"
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f2460]"
              />
              <p className="text-xs text-slate-500 mt-2">معرّف قياس Google Analytics 4</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableAnalytics"
                checked={enableAnalytics}
                onChange={(e) => setEnableAnalytics(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="enableAnalytics" className="text-sm font-medium text-slate-700">
                تفعيل تتبع Google Analytics
              </label>
            </div>
            <button
              onClick={handleSaveSEO}
              disabled={loading}
              className="w-full px-4 py-3 bg-[#0f2460] text-white rounded-lg hover:bg-[#0f2460]/90 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ إعدادات SEO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
