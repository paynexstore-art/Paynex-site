import { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  fetchAnalyticsData,
  fetchOrdersByProvince,
  fetchSupervisorPerformance,
  type AnalyticsData,
} from '@/lib/supabaseAdmin';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminAnalytics() {
  const { t, lang } = useApp();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [provinceData, setProvinceData] = useState<Array<{ province: string; count: number; revenue: number }>>([]);
  const [performanceData, setPerformanceData] = useState<
    Array<{ id: string; name: string; orders: number; revenue: number; fees: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch all analytics data on component mount
  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setErrors({});

      // Fetch each metric independently so one failure doesn't crash the whole dashboard
      let analyticsData: AnalyticsData | null = null;
      let provinces: Array<{ province: string; count: number; revenue: number }> = [];
      let performance: Array<{ id: string; name: string; orders: number; revenue: number; fees: number }> = [];

      // Fetch analytics
      try {
        analyticsData = await fetchAnalyticsData();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setErrors((prev) => ({ ...prev, analytics: errorMsg }));
        console.error('❌ Analytics fetch error:', err);
        analyticsData = {
          totalOrders: 0,
          totalRevenue: 0,
          totalFees: 0,
          totalCustomers: 0,
        };
      }

      // Fetch orders by province
      try {
        provinces = await fetchOrdersByProvince();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setErrors((prev) => ({ ...prev, provinces: errorMsg }));
        console.error('❌ Provinces fetch error:', err);
      }

      // Fetch supervisor performance
      try {
        performance = await fetchSupervisorPerformance();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setErrors((prev) => ({ ...prev, performance: errorMsg }));
        console.error('❌ Performance fetch error:', err);
      }

      setAnalytics(analyticsData);
      setProvinceData(provinces);
      setPerformanceData(performance);

      console.log('✅ Analytics data loaded:', { analyticsData, provinces, performance });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(t('فشل في تحميل الإحصائيات', 'Failed to load analytics'));
      console.error('❌ Load analytics error:', err);
      // Set default empty analytics to allow partial rendering
      setAnalytics({
        totalOrders: 0,
        totalRevenue: 0,
        totalFees: 0,
        totalCustomers: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="inline-block mb-3">
            <RefreshCw size={24} className="text-[#0f2460] animate-spin" />
          </div>
          <p className="text-slate-500">{t('جاري التحميل...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-5">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-900 text-sm font-medium">{t('فشل في تحميل الإحصائيات', 'Failed to load analytics')}</p>
            <button onClick={loadAnalytics} className="text-red-700 hover:underline text-xs mt-1">
              {t('حاول مرة أخرى', 'Try again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banners for Individual Metrics */}
      {Object.entries(errors).map(([key, errorMsg]) => (
        <div key={key} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} className="text-yellow-600 flex-shrink-0" />
          <span>⚠️ {key}: {errorMsg}</span>
        </div>
      ))}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: t('إجمالي الطلبات', 'Total Orders'),
            value: analytics.totalOrders,
            color: 'bg-blue-500',
          },
          {
            label: t('الإيرادات', 'Revenue'),
            value: formatCurrency(analytics.totalRevenue, lang),
            color: 'bg-[#d4a339]',
          },
          {
            label: t('العملاء', 'Customers'),
            value: analytics.totalCustomers,
            color: 'bg-green-500',
          },
          {
            label: t('إجمالي الرسوم', 'Total Fees'),
            value: formatCurrency(analytics.totalFees, lang),
            color: 'bg-[#0f2460]',
          },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-6 border border-slate-100">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-white mb-3`}>
              <span className="text-lg font-bold">{i + 1}</span>
            </div>
            <div className="text-2xl font-black text-[#0f2460]">{s.value}</div>
            <div className="text-slate-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Orders by Province */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0f2460] text-lg">{t('الطلبات حسب المحافظة', 'Orders by Province')}</h3>
          <button onClick={loadAnalytics} className="p-2 rounded hover:bg-slate-100 transition">
            <RefreshCw size={16} className="text-[#0f2460]" />
          </button>
        </div>
        <div className="space-y-3">
          {provinceData.length === 0 ? (
            <p className="text-slate-400 text-sm">{t('لا توجد بيانات', 'No data')}</p>
          ) : (
            provinceData.slice(0, 5).map((item, i) => {
              const maxCount = Math.max(...provinceData.map((x) => x.count));
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-[#0f2460]">{item.province}</span>
                    <span className="text-slate-500">
                      {item.count} {t('طلب', 'orders')} • {formatCurrency(item.revenue, lang)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0f2460] to-[#d4a339] h-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Supervisor Performance */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="font-bold text-[#0f2460] text-lg mb-4">
          {t('أداء المشرفين', 'Supervisor Performance')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">
                  {t('المشرف', 'Supervisor')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600">
                  {t('الطلبات', 'Orders')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600">
                  {t('الإيرادات', 'Revenue')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600">
                  {t('الرسوم', 'Fees')}
                </th>
              </tr>
            </thead>
            <tbody>
              {performanceData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    {t('لا توجد بيانات', 'No data')}
                  </td>
                </tr>
              ) : (
                performanceData.map((perf) => (
                  <tr key={perf.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-semibold text-[#0f2460]">{perf.name}</td>
                    <td className="px-4 py-3 text-right">{perf.orders}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#d4a339]">
                      {formatCurrency(perf.revenue, lang)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {formatCurrency(perf.fees, lang)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
