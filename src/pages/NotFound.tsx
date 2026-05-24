import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function NotFound() {
  const { t } = useApp();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <AlertCircle size={64} className="text-red-500" />
        </div>
        <h2 className="text-4xl font-black text-[#0f2460] mb-3">404</h2>
        <p className="text-lg font-bold text-slate-800 mb-2">{t('الصفحة غير موجودة', 'Page Not Found')}</p>
        <p className="text-slate-600 mb-8">{t('الصفحة التي تبحث عنها غير موجودة أو تم نقلها', 'The page you are looking for does not exist or has been moved')}</p>
        
        <div className="flex gap-3 flex-col">
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary flex items-center justify-center gap-2 w-full"
          >
            <Home size={18} />
            {t('العودة للرئيسية', 'Back to Home')}
          </button>
          <button 
            onClick={() => navigate('/products')} 
            className="btn-outline w-full"
          >
            {t('استعرض المنتجات', 'Browse Products')}
          </button>
        </div>
      </div>
    </div>
  );
}
