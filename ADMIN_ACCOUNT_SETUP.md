# 📋 دليل إعداد حساب المدير السوبر أدمن

## 📌 معلومات الحساب الأساسية

```
البريد الإلكتروني:     adminqastly@gmail.com
كلمة المرور السرية:   Mm.273199
الدور:                super_admin
الصلاحيات:           جميع الأذونات (*)
الحالة:              نشط وجاهز للعمل
```

---

## ✅ خطوات الإعداد الشامل

### 1️⃣ **إنشاء الجداول والبيانات في Supabase**

#### الخطوة الأولى: الوصول إلى Supabase Dashboard
```
1. ادخل إلى: https://app.supabase.com
2. اختر المشروع: paynex-site
3. قاعدة البيانات URL: https://kgkijgyzargmfyeyztgy.supabase.co
```

#### الخطوة الثانية: تشغيل نص SQL
```
1. اذهب إلى قسم SQL Editor
2. انقر على "New Query"
3. انسخ محتوى ملف: supabase/migrations/init_admin_schema.sql
4. اضغط "Run" لتنفيذ جميع الأوامر
```

### 2️⃣ **التحقق من الإعداد**

بعد تشغيل ملف SQL، تحقق من الآتي:

#### ✓ التحقق من الجدول
```sql
SELECT * FROM public.admin_users WHERE email = 'adminqastly@gmail.com';
```

**النتيجة المتوقعة:**
```
id          | email                    | name                    | role       | is_active
────────────┼──────────────────────────┼─────────────────────────┼────────────┼──────────
<uuid>      | adminqastly@gmail.com    | مدير النظام الرئيسي    | super_admin| true
```

#### ✓ التحقق من الإعدادات
```sql
SELECT * FROM public.site_settings WHERE setting_key = 'inquiry_fee';
```

**النتيجة المتوقعة:**
```
setting_key  | setting_value                    | data_type
─────────────┼──────────────────────────────────┼───────────
inquiry_fee  | {"value": 200, "currency": "EGP"} | number
```

---

## 🔐 بيانات الأمان

### كلمة المرور والرقم السري

| البيان | القيمة | النوع |
|--------|--------|-------|
| **البريد الإلكتروني** | adminqastly@gmail.com | معلنة |
| **الدور** | super_admin | معلنة |
| **كلمة المرور** | Mm.273199 | سرية ⚠️ |
| **الصلاحيات** | جميع الأذونات (*) | معلنة |

### ⚠️ **نقاط أمان مهمة:**
- كلمة المرور يجب أن تُحفظ في مكان آمن
- المفتاح السري يجب ألا ينسخ أو ينشر
- جميع العمليات مسجلة في سجل المراجعة
- استخدم HTTPS دائماً عند الدخول

---

## 🛠️ اختبار الوصول

### اختبار 1: محاكاة الدخول من الكود

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kgkijgyzargmfyeyztgy.supabase.co',
  'YOUR_ANON_KEY'
);

// جلب بيانات المدير
const { data, error } = await supabase
  .from('admin_users')
  .select('*')
  .eq('email', 'adminqastly@gmail.com');

if (data) {
  console.log('✅ تم الوصول بنجاح:', data[0]);
} else {
  console.error('❌ خطأ:', error);
}
```

### اختبار 2: فحص الصلاحيات

```typescript
// التحقق من الصلاحيات
const admin = data[0];
const hasFullAccess = admin.permissions.includes('*');
console.log('الصلاحيات الكاملة:', hasFullAccess); // true
```

---

## 📊 الجداول المنشأة

### جدول 1: admin_users
```
الحقول الرئيسية:
- id (UUID) - المعرف الفريد
- email (VARCHAR) - البريد الإلكتروني
- name (VARCHAR) - الاسم
- role (VARCHAR) - الدور (super_admin, admin, manager)
- permissions (JSONB) - الأذونات
- is_active (BOOLEAN) - الحالة
- phone (VARCHAR) - الهاتف
- province (VARCHAR) - المحافظة
- last_login (TIMESTAMP) - آخر دخول
- created_at (TIMESTAMP) - تاريخ الإنشاء
- updated_at (TIMESTAMP) - تاريخ التحديث
```

### جدول 2: audit_logs
```
تسجيل جميع عمليات:
- action - الإجراء المنفذ
- entity_type - نوع الكيان
- actor_email - بريد من قام بالإجراء
- changes - التغييرات
- old_values - القيم القديمة
- new_values - القيم الجديدة
```

### جدول 3: site_settings
```
الإعدادات الرئيسية:
- inquiry_fee: 200 ج.م (تم التحديث ✓)
- site_name: PayNex
- site_phone: رقم الاتصال
- maintenance_mode: معطل
```

---

## 🔄 تحديث الإعدادات

### تحديث رسوم الاستعلام

```sql
-- تحديث إلى 200 ج.م
UPDATE public.site_settings 
SET setting_value = '{"value": 200, "currency": "EGP"}'::jsonb
WHERE setting_key = 'inquiry_fee';

-- التحقق
SELECT * FROM public.site_settings WHERE setting_key = 'inquiry_fee';
```

### تحديث بيانات المدير

```sql
-- تحديث الهاتف والمحافظة
UPDATE public.admin_users
SET 
  phone = '+201234567890',
  province = 'Cairo',
  updated_at = NOW()
WHERE email = 'adminqastly@gmail.com';
```

---

## 📝 سجل المراجعة

كل عملية يقوم بها المدير يتم تسجيلها:

```sql
-- عرض أخر 10 عمليات للمدير
SELECT 
  created_at,
  action,
  entity_type,
  changes
FROM public.audit_logs
WHERE actor_email = 'adminqastly@gmail.com'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ قائمة التحقق النهائية

- [ ] تم تشغيل ملف SQL بنجاح
- [ ] تم إنشاء جدول admin_users
- [ ] تم إدراج حساب adminqastly@gmail.com
- [ ] الدور محدد كـ super_admin
- [ ] الصلاحيات مضبوطة على (*)
- [ ] تم تحديث رسوم الاستعلام إلى 200
- [ ] Row Level Security مفعل
- [ ] الفهارس منشأة للأداء
- [ ] سجل المراجعة يعمل
- [ ] تم اختبار الوصول بنجاح

---

## 🚀 الخطوات التالية

1. **الدخول إلى لوحة التحكم**
   ```
   البريد: adminqastly@gmail.com
   كلمة المرور: Mm.273199
   ```

2. **التحقق من جميع الصفحات**
   - الطلبات ✓
   - المشرفين ✓
   - الإعدادات ✓
   - الإحصائيات ✓
   - المحافظ ✓

3. **تفعيل المزامنة**
   - localStorage + Supabase
   - النسخ الاحتياطي التلقائي

4. **مراقبة الأداء**
   - سجل المراجعة
   - الأخطاء والتحذيرات

---

## 📞 دعم تقني

في حالة مواجهة أي مشاكل:

1. تحقق من اتصال Supabase
2. راجع سجل المراجعة للأخطاء
3. اختبر الاتصال بقاعدة البيانات
4. جرّب تشغيل السكريبت مرة أخرى

---

## 📚 ملفات مرجعية

- `supabase/migrations/init_admin_schema.sql` - نص الإنشاء الكامل
- `scripts/setup-admin.ts` - سكريبت الإعداد الآلي
- `scripts/verify-admin.ts` - سكريبت التحقق
- `COMPLETION_REPORT.md` - تقرير الإتمام

---

**تاريخ الإعداد:** 26 مايو 2026
**الإصدار:** 2.0.0
**الحالة:** ✅ جاهز للعمل
