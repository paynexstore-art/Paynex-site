import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, LogOut, User, ChevronDown, Zap } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/features/NotificationBell';
import qastlyLogo from '@/assets/qastly-logo.png';

export default function Navbar() {
  const { lang, setLang, t, settings } = useApp();
  const { user, logout, isAdmin, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  }

  const navLinks = [
    { label: t('الرئيسية', 'Home'), href: '/' },
    { label: t('المنتجات', 'Products'), href: '/products' },
    { label: t('تواصل معنا', 'Contact'), href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a1628]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-18">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="relative">
              <img src={qastlyLogo} alt="Qastly قسطلي" className="h-9 w-9 object-contain rounded-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00d4ff] rounded-full border-2 border-[#0a1628]" />
            </div>
            <div>
              <div className="font-black text-xl text-white leading-tight tracking-tight group-hover:text-[#00d4ff] transition-colors">
                {settings.siteNameEn}
              </div>
              <div className="text-[9px] text-[#c9a84c] font-semibold tracking-widest uppercase leading-none">
                {t('تقسيط ذكي', 'Smart Pay')}
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Lang Toggle */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 text-sm font-medium text-white/70 hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all"
            >
              {lang === 'ar' ? 'EN' : 'عر'}
            </button>

            {/* Notifications */}
            {user && <NotificationBell />}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0099bb] flex items-center justify-center text-[#0a1628] text-sm font-black overflow-hidden">
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      : user.name.charAt(0)
                    }
                  </div>
                  <span className="hidden md:block text-sm font-medium text-white max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown size={13} className="text-white/50" />
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full end-0 mt-2 w-52 bg-[#0e1f3d] border border-white/10 rounded-2xl shadow-2xl py-2 z-50">
                    {isAdmin && (
                      <button onClick={() => { navigate('/admin'); setUserMenuOpen(false); }}
                        className="w-full text-start px-4 py-2.5 text-sm hover:bg-white/5 text-[#00d4ff] font-bold flex items-center gap-2">
                        <Zap size={14} className="text-[#c9a84c]" />
                        {t('لوحة المدير العام', 'Admin Dashboard')}
                      </button>
                    )}
                    {isSupervisor && (
                      <button onClick={() => { navigate('/supervisor'); setUserMenuOpen(false); }}
                        className="w-full text-start px-4 py-2.5 text-sm hover:bg-white/5 text-[#00d4ff] font-bold flex items-center gap-2">
                        <User size={14} />
                        {t('لوحة المشرف', 'Supervisor Panel')}
                      </button>
                    )}
                    <button onClick={() => { navigate('/my-orders'); setUserMenuOpen(false); }}
                      className="w-full text-start px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 text-white/80">
                      <ShoppingBag size={14} />
                      {t('طلباتي', 'My Orders')}
                    </button>
                    <hr className="my-1 border-white/10" />
                    <button onClick={handleLogout}
                      className="w-full text-start px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 flex items-center gap-2">
                      <LogOut size={14} />
                      {t('تسجيل الخروج', 'Logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-cyan text-sm px-5 py-2.5 rounded-xl font-bold">
                {t('تسجيل الدخول', 'Login')}
              </Link>
            )}

            {/* Mobile toggle */}
            <button className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-3 space-y-1">
            {navLinks.map(link => (
              <Link key={link.href} to={link.href}
                className="block px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white font-medium"
                onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="block w-full text-start px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 font-medium">
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
