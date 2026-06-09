import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Settings,
  BarChart3, Wallet, Megaphone, Activity, ChevronLeft,
  LogOut, Menu, X, Shield, Search, Star, AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import NotificationBell from '@/components/features/NotificationBell';
import { getCurrentUser } from '@/lib/auth';
import { canAccessPage } from '@/lib/rbac';
import { isSpecialAdmin } from '@/lib/adminHelper';
import paynexLogo from '@/assets/paynex-logo.png';

const NAV_ITEMS = [
  { path: '/admin',                     icon: LayoutDashboard, labelAr: 'الرئيسية',          labelEn: 'Dashboard',          exact: true },
  { path: '/admin/orders',              icon: ShoppingBag,     labelAr: 'الطلبات',            labelEn: 'Orders' },
  { path: '/admin/products',            icon: Package,         labelAr: 'المنتجات',           labelEn: 'Products' },
  { path: '/admin/supervisors',         icon: Users,           labelAr: 'المشرفون',           labelEn: 'Supervisors' },
  { path: '/admin/wallets',             icon: Wallet,          labelAr: 'المحافظ والعهد',     labelEn: 'Wallets & Custody' },
  { path: '/admin/analytics',           icon: BarChart3,       labelAr: 'الإحصائيات',         labelEn: 'Analytics' },
  { path: '/admin/supervisor-activity', icon: Activity,        labelAr: 'نشاط المشرفين',      labelEn: 'Supervisor Activity' },
  { path: '/admin/seo',                 icon: Search,          labelAr: 'SEO والإعلانات',     labelEn: 'SEO & Ads' },
  { path: '/admin/testimonials',        icon: Star,            labelAr: 'آراء العملاء',       labelEn: 'Testimonials' },
  { path: '/admin/audit-log',           icon: Shield,          labelAr: 'سجل المراجعة',       labelEn: 'Audit Log' },
  { path: '/admin/marketing',           icon: Megaphone,       labelAr: 'التسويق',            labelEn: 'Marketing' },
  { path: '/admin/settings',            icon: Settings,        labelAr: 'الإعدادات',          labelEn: 'Settings' },
];

export default function AdminLayout() {
  const { user: ctxUser, logout, isAdmin } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // Race-condition fix: fall back to localStorage if React state hasn't synced yet
  const user = ctxUser ?? getCurrentUser();
  const effectiveIsAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user || !effectiveIsAdmin) {
      navigate('/login');
    } else {
      // Check if user is special admin or has proper admin role
      const hasAccess = isSpecialAdmin(user.email) || user.role === 'admin';
      if (!hasAccess) {
        setShowAccessDenied(true);
        setTimeout(() => navigate('/'), 3000);
      }
    }
  }, [user, effectiveIsAdmin, navigate]);

  if (!user || !effectiveIsAdmin) return null;

  // Show access denied message
  if (showAccessDenied) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0a1628] mb-2">{t('وصول مرفوض', 'Access Denied')}</h2>
          <p className="text-slate-600 mb-4">
            {t('ليس لديك صلاحية للوصول إلى لوحة التحكم', 'You do not have permission to access this panel')}
          </p>
          <p className="text-sm text-slate-500">
            {t('سيتم إعادة التوجيه خلال ثوان...', 'Redirecting in a few seconds...')}
          </p>
        </div>
      </div>
    );
  }

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const currentTitle = NAV_ITEMS.find(n => isActive(n.path, n.exact));

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* ─── Sidebar ─── */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-[#0a1628] flex flex-col
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:right-0 lg:h-screen
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <img src={paynexLogo} alt="PayNex" className="w-9 h-9 object-contain rounded-xl" />
            <div>
              <div className="text-white font-black text-lg">PayNex</div>
              <div className="text-[#00d4ff] text-[10px] font-semibold tracking-widest uppercase">{t('لوحة المدير العام', 'Super Admin')}</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white absolute top-4 left-4">
            <X size={18} />
          </button>
        </div>

        {/* Admin badge */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#0099bb] rounded-xl flex items-center justify-center font-black text-[#0a1628] text-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="text-white text-sm font-semibold">{user.name}</div>
              <div className="badge-gold text-[9px] mt-0.5">{t('صلاحية كاملة', 'Full Access')}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <Icon size={17} />
                <span className="text-sm">{t(item.labelAr, item.labelEn)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="sidebar-link text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full"
          >
            <LogOut size={17} />
            {t('تسجيل الخروج', 'Logout')}
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 md:px-6 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-[#0a1628] text-lg">
              {currentTitle ? t(currentTitle.labelAr, currentTitle.labelEn) : t('لوحة التحكم', 'Dashboard')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/" className="btn-outline text-sm px-3 py-2 flex items-center gap-1">
              <ChevronLeft size={14} />
              {t('الموقع', 'Site')}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
