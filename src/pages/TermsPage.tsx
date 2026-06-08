import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SEOHead } from '@/components/SEO/SEOHead';
import { useApp } from '@/contexts/AppContext';
import { FileText, CheckCircle, AlertTriangle, Scale, Clock } from 'lucide-react';

export default function TermsPage() {
  const { t } = useApp();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <SEOHead
        title={t('الشروط والأحكام', 'Terms and Conditions')}
        description={t('الشروط والأحكام لاستخدام Qastly', 'Terms and conditions for using Qastly')}
      />
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[#0a1628] text-[#00d4ff] flex items-center justify-center mx-auto mb-4">
            <FileText size={28} />
          </div>
          <h1 className="text-3xl font-black text-[#0a1628] mb-2">
            {t('الشروط والأحكام', 'Terms and Conditions')}
          </h1>
          <p className="text-slate-500">{t('آخر تحديث: يونيو 2025', 'Last updated: June 2025')}</p>
        </div>

        <div className="space-y-8">
          {[
            {
              icon: CheckCircle,
              title: 'قبول الشروط',
              text: 'باستخدامك لموقع Qastly فإنك توافق على جميع الشروط والأحكام المذكورة هنا. إذا كنت لا توافق على أي من هذه الشروط، يُرجى عدم استخدام الموقع.',
            },
            {
              icon: Scale,
              title: 'التقسيط والالتزامات',
              text: 'يُشترط على العميل سداد الأقساط في مواعيدها المحددة. في حالة التأخر عن السداد لأكثر من 30 يوم، يحق للشركة اتخاذ الإجراءات القانونية اللازمة.',
            },
            {
              icon: AlertTriangle,
              title: 'المستندات والتحقق',
              text: 'يجب أن تكون جميع المستندات المرفوعة صحيحة ومحدثة. يحق للشركة رفض أي طلب يحتوي على مستندات مزورة أو غير كاملة.',
            },
            {
              icon: Clock,
              title: 'الموافقة والتسليم',
              text: 'يتم مراجعة الطلب خلال 24-72 ساعة عمل. بعد الموافقة، يتم تحديد موعد التسليم خلال 3-7 أيام عمل حسب المحافظة.',
            },
          ].map((section, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0a1628] text-[#00d4ff] flex items-center justify-center flex-shrink-0">
                  <section.icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0a1628] text-lg mb-2">{section.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{section.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
