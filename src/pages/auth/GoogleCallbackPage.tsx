import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { handleGoogleCallback, isGoogleOAuthConfigured } from '@/lib/googleAuth';
import { toast } from 'sonner';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!isGoogleOAuthConfigured()) {
        const msg = 'Supabase not configured. Check your environment variables.';
        console.error(msg);
        setError(msg);
        toast.error(msg);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Supabase Auth returns data in query params: ?code=...
      // Google Implicit Flow returns in hash: #access_token=...
      const hashParams = new URLSearchParams(
        (window.location.hash || '').replace(/^#/, '')
      );
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get('access_token') ?? '';
      const state = hashParams.get('state') ?? queryParams.get('state') ?? '';
      const googleError = queryParams.get('error');

      console.log('Processing Google OAuth callback...');

      const result = await handleGoogleCallback(accessToken, state, googleError);

      if (result.user) {
        setUser(result.user);
        toast.success('تم تسجيل الدخول بنجاح');
        setTimeout(() => navigate('/'), 800);
      } else {
        const code = result.oauthError?.code;
        if (code === 'popup_closed') {
          toast.info('تم الغاء تسجيل الدخول');
        } else if (code === 'csrf_mismatch') {
          toast.error('فشل التحقق الامني - يرجى المحاولة مجددا');
        } else if (code === 'session_expired') {
          toast.warning('انتهت الجلسة - يرجى اعادة تسجيل الدخول');
        } else if (code === 'network_error') {
          toast.error('خطأ في الشبكة - تأكد من اتصالك بالإنترنت');
        } else {
          const msg = result.error ?? 'فشل تسجيل الدخول';
          toast.error(msg);
        }

        const displayError = result.error ?? 'فشل تسجيل الدخول';
        console.error('Google login failed:', displayError, result.oauthError);
        setError(displayError);
        setTimeout(() => navigate('/login'), 3000);
      }
    })();
  }, [navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4">!</div>
          <h2 className="text-white text-lg font-semibold mb-2">تسجيل الدخول فشل</h2>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <p className="text-gray-400 text-xs">سيتم اعادة التوجيه الى صفحة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin mx-auto mb-6" />
        <p className="text-[#00d4ff] text-lg font-semibold tracking-widest mb-2">PayNex</p>
        <p className="text-gray-400 text-sm">جاري معالجة تسجيل الدخول بـ Google...</p>
      </div>
    </div>
  );
}
