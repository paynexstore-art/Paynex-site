# PayNex Site - حلول التقسيط الذكي

## نظرة عامة

PayNex هي منصة تقسيط ذكية متطورة مبنية بـ React، Vite، TypeScript، Shadcn UI، و Supabase. توفر خدمات التقسيط الميسرة للعملاء في مصر مع إدارة متقدمة للأوامر والمشرفين.

## المتطلبات

- Node.js 18+
- npm أو yarn أو bun
- حساب Supabase
- متصفح حديث

## المميزات الرئيسية

✅ **لوحة تحكم Admin متقدمة** - إدارة كاملة للمنتجات والطلبات والمشرفين  
✅ **نظام أقساط ذكي** - حساب تلقائي للأقساط الشهرية والفوائد  
✅ **إدارة المشرفين** - تتبع الأداء والمحافظ والحضور  
✅ **معالجة الأخطاء الشاملة** - Error Boundaries وحماية الطرق  
✅ **قاعدة بيانات آمنة** - Supabase للتخزين الآمن  
✅ **واجهة متعددة اللغات** - دعم العربية والإنجليزية  

## التثبيت

### الخطوة 1: استنساخ المستودع

```bash
git clone https://github.com/paynexstore-art/paynex-site.git
cd paynex-site
```

### الخطوة 2: تثبيت المكتبات

```bash
npm install
# أو
yarn install
# أو
bun install
```

### الخطوة 3: إعداد متغيرات البيئة

أنشئ ملف `.env` في المجلد الجذري:

```dotenv
VITE_SUPABASE_URL=https://yzzbuvqyabzjaznttgbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6emJ1dnF5YWJ6amF6bnR0Z2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTEwNjgsImV4cCI6MjA5NTEyNzA2OH0.WRIgdkUxF9mYvjlvURmMNzs69_W71S-HE4bIifua42A

VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://paynex-site.vercel.app/auth/google/callback

VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

### الخطوة 4: تشغيل خادم التطوير

```bash
npm run dev
```

سيكون التطبيق متاحاً على: `http://localhost:5173`

## الاستخدام

### بيانات تسجيل الدخول الافتراضية

**Admin:**
- البريد: `admin@paynex.com`
- كلمة المرور: `Mm.273199`

**Customer (Test):**
- البريد: `aa@gmail.com`
- كلمة المرور: `000000`

## هيكل المشروع

```
src/
├── components/          # المكونات المعاد استخدامها
│   ├── ProtectedRoute.tsx
│   ├── ErrorBoundary.tsx
│   └── ...
├── contexts/            # React Contexts (Auth, App)
├── pages/               # صفحات التطبيق
│   ├── admin/          # صفحات لوحة الحكم
│   ├── supervisor/     # صفحات المشرفين
│   └── ...
├── lib/                 # دوال مساعدة وأداوات
│   ├── auth.ts
│   ├── storage.ts
│   ├── installment.ts
│   └── ...
├── constants/           # البيانات والثوابت
├── types/               # تعريفات TypeScript
└── App.tsx             # المكون الرئيسي
```

## البناء والنشر

### بناء للإنتاج

```bash
npm run build
```

### معاينة البناء

```bash
npm run preview
```

### النشر على Vercel

```bash
vercel deploy
```

## المزايا التقنية

### ✅ معالجة الأخطاء
- Error Boundary على مستوى التطبيق
- معالجة أخطاء Supabase
- توست التنبيهات للمستخدم

### ✅ الأمان
- Protected Routes
- Super Admin Bypass
- Role-Based Access Control (RBAC)
- التحقق من الجلسات

### ✅ الأداء
- Lazy Loading للمكونات
- Code Splitting
- Vite Fast Refresh
- caching بواسطة Service Worker

## استكشاف الأخطاء

### "Supabase connection failed"

تأكد من:
1. ✅ `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` في `.env`
2. ✅ الاتصال بالإنترنت
3. ✅ مفاتيح Supabase صحيحة

### "White Screen of Death"

افتح console المتصفح (F12) وتحقق من:
1. ✅ أخطاء JavaScript
2. ✅ استدعاءات الشبكة الفاشلة
3. ✅ المستندات الناقصة

### "401 Unauthorized"

✅ تأكد من أنك مسجل دخول
✅ تحقق من صلاحيات الدور (Role)
✅ تحديث الصفحة

## الدعم والتواصل

📧 البريد الإلكتروني: `support@paynex.com`  
📱 واتس آب: `+20 1000000000`  
🕐 الدعم: 24/7

## الترخيص

تم تطويره بواسطة PayNex Team © 2025

---

**آخر تحديث**: 2025-05-24  
**الإصدار**: 1.0.0  
**الحالة**: ✅ جاهز للإنتاج
