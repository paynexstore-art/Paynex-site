import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import { lazy, Suspense, useEffect } from 'react';
import { initTestUsers } from '@/constants/data';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// ─── Public Pages (eager) ───────────────────────────────────────────
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';

// ─── Public Pages (lazy loaded) ────────────────────────────────────
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const OrderFormPage = lazy(() => import('@/pages/OrderFormPage'));
const OrderStatusPage = lazy(() => import('@/pages/OrderStatusPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));

// ─── Auth Pages ───────────────────────────────────────────────────
const GoogleCallbackPage = lazy(() => import('@/pages/auth/GoogleCallbackPage'));

// ─── Admin Pages (lazy) ────────────────────────────────────────────
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminSupervisors = lazy(() => import('@/pages/admin/AdminSupervisors'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminWallets = lazy(() => import('@/pages/admin/AdminWallets'));
const AdminMarketing = lazy(() => import('@/pages/admin/AdminMarketing'));
const AdminAIMarketing = lazy(() => import('@/pages/admin/AdminAIMarketing'));
const AdminSocialExport = lazy(() => import('@/pages/admin/AdminSocialExport'));
const AdminSupervisorActivity = lazy(
  () => import('@/pages/admin/AdminSupervisorActivity')
);
const AdminAuditLog = lazy(() => import('@/pages/admin/AdminAuditLog'));
const AdminSEO = lazy(() => import('@/pages/admin/AdminSEO'));
const AdminTestimonials = lazy(() => import('@/pages/admin/AdminTestimonials'));

// ─── Supervisor Pages (lazy) ───────────────────────────────────────
const SupervisorLayout = lazy(() => import('@/pages/supervisor/SupervisorLayout'));
const SupervisorDashboard = lazy(
  () => import('@/pages/supervisor/SupervisorDashboard')
);
const SupervisorOrders = lazy(() => import('@/pages/supervisor/SupervisorOrders'));
const SupervisorAttendance = lazy(
  () => import('@/pages/supervisor/SupervisorAttendance')
);
const SupervisorWalletPage = lazy(
  () => import('@/pages/supervisor/SupervisorWalletPage')
);

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#00d4ff] text-sm font-semibold tracking-widest uppercase">
          PayNex
        </p>
      </div>
    </div>
  );
}

function AppInner() {
  useEffect(() => {
    // Initialize test users with error handling
    try {
      initTestUsers();
      console.log('✅ Test users initialized successfully');
    } catch (error) {
      console.error(
        '❌ Failed to initialize test users:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Don't block app startup on initialization error
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors expand duration={4000} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ──────────────────────────────────── */}
          {/* PUBLIC ROUTES (No Auth Required)    */}
          {/* ──────────────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/order/:productId" element={<OrderFormPage />} />
          <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
          <Route path="/my-orders" element={<OrderStatusPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* ──────────────────────────────────── */}
          {/* AUTH CALLBACKS                       */}
          {/* ──────────────────────────────────── */}
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

          {/* ──────────────────────────────────── */}
          {/* ADMIN ROUTES (Auth Required)         */}
          {/* ──────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="supervisors" element={<AdminSupervisors />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="wallets" element={<AdminWallets />} />
            <Route path="marketing" element={<AdminMarketing />} />
            <Route path="ai-marketing" element={<AdminAIMarketing />} />
            <Route path="social-export" element={<AdminSocialExport />} />
            <Route path="supervisor-activity" element={<AdminSupervisorActivity />} />
            <Route path="audit-log" element={<AdminAuditLog />} />
            <Route path="seo" element={<AdminSEO />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
          </Route>

          {/* ──────────────────────────────────── */}
          {/* SUPERVISOR ROUTES (Auth Required)    */}
          {/* ──────────────────────────────────── */}
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute requiredRole="supervisor">
                <SupervisorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SupervisorDashboard />} />
            <Route path="orders" element={<SupervisorOrders />} />
            <Route path="attendance" element={<SupervisorAttendance />} />
            <Route path="wallet" element={<SupervisorWalletPage />} />
          </Route>

          {/* ──────────────────────────────────── */}
          {/* CATCH-ALL (404)                      */}
          {/* ──────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <AppInner />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}