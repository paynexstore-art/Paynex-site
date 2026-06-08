# مراجعة البرومبت vs المشروع الحالي (PayNex)

## ✅ موجود بالفعل (70%)
1. Supabase Database + Storage
2. Google OAuth (basic)
3. Admin Dashboard (products, supervisors, wallets, analytics, attendance, settings, SEO, testimonials, supervisor activity)
4. Installment Calculator (0 down / 0 interest)
5. Order form with documents upload
6. Supervisor wallet (fees + installments)
7. Supervisor attendance (face + GPS)
8. Notifications (localStorage based)
9. PWA (sw.js + manifest.json)
10. 60-day reapply logic
11. Basic SEO / Analytics

## ❌ مفقود أو يحتاج تحسين (30%)
1. **Next.js** → المشروع React + Vite (لا يمكن تغييره في Sandbox)
2. **Auth بالبريد + الهاتف** → حالياً فقط بريد
3. **CMS كامل** → تغيير الألوان/البانرات برمجياً (جزئي)
4. **Cron Job Aman Store** → Scraper موجود لكن لا يعمل تلقائياً
5. **AdSense / MoneyTag** → SEOHead موجود لكن يحتاج tags
6. **Export Social Media** → غير موجود
7. **AI Poster/Video Generation** → غير موجود
8. **Face Recognition حقيقي** → يستخدم react-calendar (fake)
9. **Supabase RLS كامل** → Migrations جزئية
10. **Order auto-assignment** → يحتاج geofencing logic

## 🎯 خطة البناء
1. SQL Migration كامل (tables, RLS, functions, triggers)
2. Auth: بريد + هاتف + SMS verification
3. CMS كامل: ألوان، بانرات، SEO، إعدادات
4. AI Marketing: صفحة توليد بوسترات/فيديوهات
5. Social Export: تصدير منتجات كـ posts
6. Cron/Scraper: Edge Function لـ Aman Store sync
7. Real notifications: Supabase realtime
8. Face attendance: تحسين + GPS integration
9. Supervisor target/bonus: نظام مكافآت كامل
