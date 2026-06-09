import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Camera, Wallet, LogOut, Menu, X, ChevronLeft, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { getSupervisors } from '@/lib/storage';
import NotificationBell from '@/components/features/NotificationBell';
import logoImg from '@/assets/logo.png';

const NAV_ITEMS = [
  { path: '/supervisor',            icon: LayoutDashboard, labelAr: 'الرئيسية',        labelEn: 'Dashboard', exact: true },
  { path: '/supervisor/orders',     icon: ShoppingBag,     labelAr: 'الطلبات',          labelEn: 'Orders' },
  { path: '/supervisor/attendance', icon: Camera,          labelAr: 'تسجيل الحضور',    labelEn: 'Attendance' },
  { path: '/supervisor/wallet',     icon: Wallet,          labelAr: 'محفظتي',           labelEn: 'My Wallet' },
];

export default function SupervisorLayout() {
  const { user, logout, isSupervisor } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!user || !isSupervisor) navigate('/login');
    // Check lock status
    const sups = getSupervisors();
    const sup = sups.find(s => s.id === user?.id);
    setIsLocked(sup?.isLocked ?? false);
  }, [user, isSupervisor, navigate]);

  if (!user || !isSupervisor) return null;

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const currentTitle = NAV_ITEMS.find(n => isActive(n.path, n.exact));

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 right-0 z-50 w-64 bg-gradient-to-b from-[#0f2460] to-[#1a368e] flex flex-col
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-auto
        `}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImg} alt="باينكس" className="w-9 h-9 object-contain" />
            <div>
              <div className="text-white font-bold">باينكس</div>
              <div className="text-[#d4a339] text-xs">{t('لوحة المشرف', 'Supervisor Panel')}</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60"><X size={20} /></button>
        </div>

        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#d4a339] rounded-xl flex items-center justify-center font-black text-[#0f2460] text-lg">{user.name.charAt(0)}</div>
            <div>
              <div className="text-white text-sm font-semibold">{user.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="text-white/60 text-xs">{t('مشرف محافظة', 'Province Supervisor')}</div>
                {isLocked && <Lock size={11} className="text-red-400" />}
              </div>
            </div>
          </div>
          {isLocked && (
            <div className="mt-2 bg-red-500/20 border border-red-400/30 rounded-lg p-2 text-xs text-red-200 flex items-center gap-1">
              <Lock size={11} /> {t('الحساب مقفل — راجع المدير العام', 'Account locked — contact admin')}
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            // Block navigation (except attendance) when locked
            const blocked = isLocked && item.path !== '/supervisor/attendance' && !active;
            return (
              <button
                key={item.path}
                onClick={() => {
                  if (blocked) return;
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                disabled={blocked}
                className={`sidebar-link w-full text-right ${active ? 'active' : blocked ? 'opacity-40 cursor-not-allowed' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon size={18} />
                <span>{t(item.labelAr, item.labelEn)}</span>
                {blocked && <Lock size={12} className="ms-auto text-red-400" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={() => { logout(); navigate('/'); }}
            className="sidebar-link text-red-400 hover:bg-red-500/10 w-full">
            <LogOut size={18} /> {t('تسجيل الخروج', 'Logout')}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 md:px-6 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100"><Menu size={20} /></button>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[#0f2460] text-lg">
                {currentTitle ? t(currentTitle.labelAr, currentTitle.labelEn) : t('المشرف', 'Supervisor')}
              </h1>
              {isLocked && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock size={10} /> {t('مقفل', 'Locked')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/" className="btn-outline text-sm px-3 py-2 flex items-center gap-1">
              <ChevronLeft size={14} /> {t('الموقع', 'Site')}
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
