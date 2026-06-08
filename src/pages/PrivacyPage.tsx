import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SEOHead } from '@/components/SEO/SEOHead';
import { useApp } from '@/contexts/AppContext';
import { Shield, Lock, Eye, Server, Trash2, Phone, Mail } from 'lucide-react';

export default function PrivacyPage() {
  const { t } = useApp();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <SEOHead
        title={t('سياسة الخصوصية', 'Privacy Policy')}
        description={t('سياسة الخصوصية لـ Qastly - كيف نحمي بياناتك', 'Qastly privacy policy - how we protect your data')}
      />
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[#0a1628] text-[#00d4ff] flex items-center justify-center mx-auto mb-4">
            <Shield size={28} />
          </div>
          <h1 className="text-3xl font-black text-[#0a1628] mb-2">
            {t('سياسة الخصوصية', 'Privacy Policy')}
          </h1>
          <p className="text-slate-500">{t('آخر تحديث: يونيو 2025', 'Last updated: June 2025')}</p>
        </div>

        <div className="space-y-8">
          {[
            {
              icon: Lock,
              title: 'أمن البيانات',
              text: 'نستخدم تشفير AES-256 لحماية جميع البيانات الشخصية والمستندات المرفوعة. لا يتم مشاركة بياناتك مع أي طرف ثالث دون موافقة صريحة.',
            },
            {
              icon: Eye,
              title: 'جمع البيانات',
              text: 'نقوم بجمع البيانات الضرورية فقط لإتمام عملية التقسيط: الاسم، الرقم القومي، العنوان، الوظيفة، والمستندات. لا نقوم بجمع بيانات غير ضرورية.',
            },
            {
              icon: Server,
              title: 'التخزين والحماية',
              text: 'يتم تخزين بياناتك على خوادم آمنة داخل مصر. نستخدم أحدث تقنيات الحماية ونسخ احتياطية يومية لضمان عدم فقدان البيانات.',
            },
            {
              icon: Trash2,
              title: 'الحق في الحذف',
              text: 'يمكنك طلب حذف بياناتك الشخصية في أي وقت عبر التواصل مع خدمة العملاء. يتم حذف البيانات بشكل آمن ونهائي خلال 30 يوماً من تاريخ الطلب.',
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

        <div className="mt-12 bg-[#0a1628] rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-3">{t('للاستفسارات والشكاوى', 'For inquiries and complaints')}</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-[#00d4ff]" />
              <span>0100-000-0000</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-[#00d4ff]" />
              <span>privacy@qastly.com</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
