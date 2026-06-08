import type { SiteSettings, Order, Product, Supervisor, AttendanceRecord } from '@/types';
import { DEFAULT_SETTINGS, MOCK_PRODUCTS, MOCK_ORDERS, MOCK_SUPERVISORS } from '@/constants/data';
import { generateId, addDays } from './utils';
import * as supabaseSync from './supabaseDataSync';

const KEY = {
  settings:    'qastly_settings',
  products:    'qastly_products',
  orders:      'qastly_orders',
  supervisors: 'qastly_supervisors',
};

// ===== SCRAPER / SYNC HISTORY (Export early for AdminDashboard import) =====

export interface ScraperImportRecord {
  id: string;
  importedAt: string;
  source: 'btech' | 'manual';
  totalInFile: number;
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
  durationMs: number;
}

const SCRAPER_HISTORY_KEY = 'qastly_scraper_history';
const MAX_HISTORY = 20;

export function getScraperHistory(): ScraperImportRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SCRAPER_HISTORY_KEY) ?? '[]') as ScraperImportRecord[];
  } catch { return []; }
}

export function getLastScraperImport(): ScraperImportRecord | null {
  const h = getScraperHistory();
  return h.length > 0 ? h[0] : null;
}

export function addScraperImport(record: Omit<ScraperImportRecord, 'id'>): ScraperImportRecord {
  const history = getScraperHistory();
  const newRecord: ScraperImportRecord = { ...record, id: generateId() };
  const updated = [newRecord, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(SCRAPER_HISTORY_KEY, JSON.stringify(updated));

  // Update site settings sync date
  getSiteSettings().then(settings => {
    settings.lastSyncDate = record.importedAt;
    settings.syncErrorMessage = record.errors.length > 0
      ? `${record.failed} منتج فشل في الاستيراد`
      : undefined;
    saveSiteSettings(settings);
  });

  return newRecord;
}

export function importScrapedProducts(
  rawProducts: Record<string, unknown>[],
  source: 'btech' | 'manual' = 'btech',
): ScraperImportRecord {
  const startTime = Date.now();
  const existingSync = getProductsSync();
  const existingMap = new Map(existingSync.map(p => [p.sourceId ?? p.id, p]));

  let added = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];
  const newProducts: Product[] = [...existingSync];

  for (const raw of rawProducts) {
    try {
      if (!raw.name && !raw.nameAr) { skipped++; continue; }
      const price = parseFloat(String(raw.price ?? '0')) || 0;
      if (price <= 0) { skipped++; continue; }

      const sourceId = String(raw.sourceId ?? raw.sku ?? raw.id ?? '');
      const existingProduct = sourceId ? existingMap.get(sourceId) : undefined;

      if (existingProduct) {
        // Update existing
        const idx = newProducts.findIndex(p => p.id === existingProduct.id);
        if (idx !== -1) {
          newProducts[idx] = {
            ...existingProduct,
            name: (raw.name as string) ?? existingProduct.name,
            nameAr: (raw.nameAr as string) ?? existingProduct.nameAr,
            price,
            description: (raw.description as string) ?? existingProduct.description,
            descriptionAr: (raw.descriptionAr as string) ?? existingProduct.descriptionAr,
          };
          updated++;
        }
      } else {
        // Add new
        const newProd: Product = {
          id: generateId(),
          name: (raw.name as string) ?? 'Unknown',
          nameAr: (raw.nameAr as string) ?? 'غير معروف',
          description: (raw.description as string) ?? '',
          descriptionAr: (raw.descriptionAr as string) ?? '',
          price,
          category: (raw.category as string) ?? '',
          categoryAr: (raw.categoryAr as string) ?? '',
          image: (raw.image as string) ?? '',
          stock: parseInt(String(raw.stock ?? '0'), 10) || 0,
          sourceId,
          source: source as 'btech' | 'manual',
          createdAt: new Date().toISOString(),
        };
        newProducts.push(newProd);
        added++;
      }
    } catch (err) {
      failed++;
      errors.push(`Row error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  saveProducts(newProducts);

  const record: ScraperImportRecord = {
    id: generateId(),
    importedAt: new Date().toISOString(),
    source,
    totalInFile: rawProducts.length,
    added,
    updated,
    skipped,
    failed,
    errors,
    durationMs: Date.now() - startTime,
  };

  addScraperImport(record);
  return record;
}

// ===== SITE SETTINGS =====
export async function getSiteSettings(): Promise<SiteSettings> {
  // Try Supabase first, fall back to localStorage
  return await supabaseSync.fetchSiteSettings();
}

export function getSiteSettingsSync(): SiteSettings {
  const stored = localStorage.getItem(KEY.settings);
  if (!stored) return DEFAULT_SETTINGS;
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }; }
  catch { return DEFAULT_SETTINGS; }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  // Save to localStorage immediately for performance
  localStorage.setItem(KEY.settings, JSON.stringify(settings));
  // Sync to Supabase in background
  await supabaseSync.saveSiteSettingsToSupabase(settings);
}

// ===== PRODUCTS =====
export async function getProducts(): Promise<Product[]> {
  // Try Supabase first, fall back to localStorage
  return await supabaseSync.fetchAllProducts();
}

export function getProductsSync(): Product[] {
  const stored = localStorage.getItem(KEY.products);
  if (!stored) { localStorage.setItem(KEY.products, JSON.stringify(MOCK_PRODUCTS)); return MOCK_PRODUCTS; }
  try { return JSON.parse(stored) as Product[]; } catch { return MOCK_PRODUCTS; }
}

export async function saveProducts(products: Product[]): Promise<void> {
  localStorage.setItem(KEY.products, JSON.stringify(products));
}

export async function getProductById(id: string): Promise<Product | null> {
  return await supabaseSync.fetchProductById(id);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  return await supabaseSync.fetchProductsByCategory(category);
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const products = await getProducts();
  const newProduct: Product = { ...product, id: generateId(), createdAt: new Date().toISOString() };
  await saveProducts([...products, newProduct]);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const products = await getProducts();
  await saveProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProducts();
  await saveProducts(products.filter(p => p.id !== id));
}

// ===== ORDERS =====
export async function getOrders(): Promise<Order[]> {
  // Try Supabase first, fall back to localStorage
  return await supabaseSync.fetchAllOrders();
}

export function getOrdersSync(): Order[] {
  const stored = localStorage.getItem(KEY.orders);
  if (!stored) { localStorage.setItem(KEY.orders, JSON.stringify(MOCK_ORDERS)); return MOCK_ORDERS; }
  try { return JSON.parse(stored) as Order[]; } catch { return MOCK_ORDERS; }
}

export async function saveOrders(orders: Order[]): Promise<void> {
  localStorage.setItem(KEY.orders, JSON.stringify(orders));
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  return await supabaseSync.fetchOrdersByCustomer(customerId);
}

export async function getOrdersBySupervisor(supervisorId: string): Promise<Order[]> {
  return await supabaseSync.fetchOrdersBySupervisor(supervisorId);
}

export async function getOrdersByStatus(status: string): Promise<Order[]> {
  return await supabaseSync.fetchOrdersByStatus(status);
}

export async function addOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const orders = await getOrders();
  const newOrder: Order = {
    ...order,
    id: `ord-${generateId()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveOrders([...orders, newOrder]);
  addNotification({
    userId: 'admin-001', type: 'new-order',
    titleAr: 'طلب جديد', titleEn: 'New Order',
    messageAr: `طلب جديد من ${newOrder.customerName}`,
    messageEn: `New order from ${newOrder.customerName}`,
    orderId: newOrder.id,
  });
  if (newOrder.supervisorId) {
    addNotification({
      userId: newOrder.supervisorId, type: 'new-order',
      titleAr: 'طلب جديد في محافظتك', titleEn: 'New order in your province',
      messageAr: `طلب جديد من ${newOrder.customerName}`,
      messageEn: `New order from ${newOrder.customerName}`,
      orderId: newOrder.id,
    });
  }
  return newOrder;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
  const orders = await getOrders();
  const updated = orders.map(o => {
    if (o.id !== id) return o;
    const updatedOrder = { ...o, ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === 'rejected') {
      updatedOrder.rejectedAt = new Date().toISOString();
      updatedOrder.canReapplyAt = addDays(new Date().toISOString(), 60);
      addNotification({
        userId: o.customerId, type: 'order-update',
        titleAr: 'تحديث على طلبك', titleEn: 'Order Update',
        messageAr: 'عذراً، لم تكتمل موافقة طلبك في الوقت الحالي. يمكنك إعادة التقديم بعد 60 يوماً.',
        messageEn: 'Your order was not approved at this time. You may reapply after 60 days.',
        orderId: id,
      });
    }
    if (updates.status === 'approved') {
      updatedOrder.approvedAt = new Date().toISOString();
      addNotification({
        userId: o.customerId, type: 'order-update',
        titleAr: 'تهانينا! تمت الموافقة على طلبك', titleEn: 'Order Approved!',
        messageAr: 'تمت الموافقة على طلب التقسيط الخاص بك. سيتواصل معك مشرف المحافظة قريباً.',
        messageEn: 'Your installment order has been approved. Province supervisor will contact you soon.',
        orderId: id,
      });
    }
    if (updates.status === 'delivered') {
      updatedOrder.deliveredAt = new Date().toISOString();
      addNotification({
        userId: o.customerId, type: 'order-update',
        titleAr: 'تم تسليم المنتج وتفعيل الأقساط', titleEn: 'Product Delivered',
        messageAr: 'تم تسليم منتجك وتفعيل خطة الأقساط. شكراً لثقتك في قسطلي.',
        messageEn: 'Your product has been delivered and installment plan activated.',
        orderId: id,
      });
    }
    if (updates.status === 'admin-review') {
      addNotification({
        userId: 'admin-001', type: 'new-order',
        titleAr: 'طلب ينتظر مراجعتك', titleEn: 'Order awaiting your review',
        messageAr: `طلب ${o.customerName} جاهز للمراجعة النهائية`,
        messageEn: `Order from ${o.customerName} is ready for final review`,
        orderId: id,
      });
    }
    return updatedOrder;
  });
  await saveOrders(updated);
}

// ===== SUPERVISORS =====
export async function getSupervisors(): Promise<Supervisor[]> {
  // Try Supabase first, fall back to localStorage
  return await supabaseSync.fetchAllSupervisors();
}

export function getSupervisorsSync(): Supervisor[] {
  const stored = localStorage.getItem(KEY.supervisors);
  if (!stored) { localStorage.setItem(KEY.supervisors, JSON.stringify(MOCK_SUPERVISORS)); return MOCK_SUPERVISORS; }
  try { return JSON.parse(stored) as Supervisor[]; } catch { return MOCK_SUPERVISORS; }
}

export async function saveSupervisors(supervisors: Supervisor[]): Promise<void> {
  localStorage.setItem(KEY.supervisors, JSON.stringify(supervisors));
}

export async function getSupervisorByProvince(provinceId: string): Promise<Supervisor | null> {
  return await supabaseSync.fetchSupervisorByProvince(provinceId);
}

export async function getSupervisorById(id: string): Promise<Supervisor | null> {
  return await supabaseSync.fetchSupervisorById(id);
}

// ===== FINANCIAL LOCK SYSTEM =====

/** Lock supervisor account after check-out */
export async function lockSupervisor(supervisorId: string): Promise<void> {
  const sups = await getSupervisors();
  await saveSupervisors(sups.map(s =>
    s.id === supervisorId
      ? { ...s, isLocked: true, lastCheckOutAt: new Date().toISOString() }
      : s
  ));
}

/**
 * Admin confirms cash received → full or partial settlement.
 * Any remaining balance becomes negative debt (رصيد سالب).
 */
export async function clearSupervisorDebt(supervisorId: string, adminId: string, amount: number): Promise<void> {
  const sups = await getSupervisors();
  const idx = sups.findIndex(s => s.id === supervisorId);
  if (idx === -1) return;
  const sup = sups[idx];
  const pendingBefore = sup.pendingDebt ?? 0;
  const remaining = pendingBefore - amount;
  // Negative means supervisor over-paid (credit), positive means still owes (debt)
  const newPendingDebt = remaining > 0 ? remaining : 0;
  const creditBalance = remaining < 0 ? Math.abs(remaining) : 0; // surplus returned

  sups[idx] = {
    ...sup,
    isLocked: false,
    pendingDebt: newPendingDebt,
    wallet: {
      ...sup.wallet,
      totalBalance: Math.max(0, sup.wallet.totalBalance - amount + creditBalance),
      lastSettledAt: new Date().toISOString(),
      transactions: [
        {
          id: generateId(),
          type: 'settlement',
          amount,
          description: `تصفير عهدة يدوي بواسطة المدير — مُسوَّى: ${amount} ج.م${remaining > 0 ? ` — متبقي (مدين): ${remaining} ج.م` : ''}`,
          createdAt: new Date().toISOString(),
          approvedBy: adminId,
        },
        ...sup.wallet.transactions,
      ],
      lastUpdated: new Date().toISOString(),
    },
  };
  await saveSupervisors(sups);

  addNotification({
    userId: supervisorId, type: 'wallet',
    titleAr: 'تم تصفير العهدة',
    titleEn: 'Debt Cleared',
    messageAr: `تم استلام ${amount} ج.م من عهدتك وفتح حسابك لليوم التالي.${remaining > 0 ? ` متبقي مدين: ${remaining} ج.م.` : ''}`,
    messageEn: `${amount} EGP received. Account unlocked.${remaining > 0 ? ` Remaining debt: ${remaining} EGP.` : ''}`,
  });
}

/** Add fee collection to supervisor wallet — registers as pending debt */
export async function addFeeToWallet(supervisorId: string, fee: number, orderId: string, customerName: string): Promise<void> {
  const sups = await getSupervisors();
  const idx = sups.findIndex(s => s.id === supervisorId);
  if (idx === -1) return;
  const sup = sups[idx];

  sups[idx] = {
    ...sup,
    pendingDebt: (sup.pendingDebt ?? 0) + fee,
    wallet: {
      ...sup.wallet,
      totalFees: sup.wallet.totalFees + fee,
      totalBalance: sup.wallet.totalBalance + fee,
      transactions: [
        {
          id: generateId(),
          type: 'fee',
          amount: fee,
          description: `رسوم استعلام — ${customerName}`,
          orderId,
          createdAt: new Date().toISOString(),
        },
        ...sup.wallet.transactions,
      ],
      lastUpdated: new Date().toISOString(),
    },
  };
  await saveSupervisors(sups);
}

/** Auto-suspend supervisors who have outstanding debt > 24h */
export async function checkAndAutoLockSupervisors(): Promise<void> {
  const sups = await getSupervisors();
  const now = Date.now();
  let changed = false;

  const updated = sups.map(s => {
    if (s.isLocked || !s.lastCheckOutAt || (s.pendingDebt ?? 0) === 0) return s;
    const hoursSinceCheckout = (now - new Date(s.lastCheckOutAt).getTime()) / 3600000;
    if (hoursSinceCheckout > 24) {
      changed = true;
      addNotification({
        userId: 'admin-001', type: 'lock-alert',
        titleAr: `تنبيه: تأخر تسليم عهدة ${s.name}`,
        titleEn: `Alert: ${s.name} delayed custody settlement`,
        messageAr: `المشرف ${s.name} لم يسلم العهدة منذ أكثر من 24 ساعة — تم تحويل الحساب للتحقيق.`,
        messageEn: `Supervisor ${s.name} has not settled custody for over 24 hours.`,
      });
      return { ...s, isLocked: true };
    }
    return s;
  });

  if (changed) await saveSupervisors(updated);
}

/** Admin manual deduction */
export async function deductWalletBalance(supervisorId: string, amount: number, description: string): Promise<void> {
  const sups = await getSupervisors();
  const idx = sups.findIndex(s => s.id === supervisorId);
  if (idx === -1) return;
  const sup = sups[idx];
  sups[idx] = {
    ...sup,
    wallet: {
      ...sup.wallet,
      totalBalance: sup.wallet.totalBalance - amount, // Allow negative
      transactions: [
        {
          id: generateId(),
          type: 'withdrawal',
          amount,
          description,
          createdAt: new Date().toISOString(),
          approvedBy: 'admin-001',
        },
        ...sup.wallet.transactions,
      ],
      lastUpdated: new Date().toISOString(),
    },
  };
  await saveSupervisors(sups);
}

// ===== SALARY MANAGEMENT =====
export interface SalaryRecord {
  id: string;
  supervisorId: string;
  month: string; // 'YYYY-MM'
  baseSalary: number;
  bonuses: { id: string; amount: number; reason: string; date: string }[];
  penalties: { id: string; amount: number; reason: string; date: string }[];
  debtCarriedOver: number; // رصيد مدين مُرحَّل
  finalAmount: number;
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  archivedData?: object; // Frozen snapshot
}

function getSalaryStorageKey(supervisorId: string, month: string) {
  return `qastly_salary_${supervisorId}_${month}`;
}

export function getSalaryRecord(supervisorId: string, month: string): SalaryRecord | null {
  try {
    const raw = localStorage.getItem(getSalaryStorageKey(supervisorId, month));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSalaryRecord(record: SalaryRecord): void {
  localStorage.setItem(getSalaryStorageKey(record.supervisorId, record.month), JSON.stringify(record));
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getOrCreateSalaryRecord(supervisorId: string, month?: string): Promise<SalaryRecord> {
  const m = month ?? getCurrentMonth();
  const existing = getSalaryRecord(supervisorId, m);
  if (existing) return existing;

  // Check for carried-over debt from previous month
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevRecord = getSalaryRecord(supervisorId, prevMonth);
  const debtCarriedOver = prevRecord && prevRecord.isApproved && prevRecord.finalAmount < 0
    ? Math.abs(prevRecord.finalAmount)
    : 0;

  const sup = await getSupervisorById(supervisorId);
  const newRecord: SalaryRecord = {
    id: generateId(),
    supervisorId,
    month: m,
    baseSalary: sup?.baseSalary ?? 3000,
    bonuses: [],
    penalties: [],
    debtCarriedOver,
    finalAmount: (sup?.baseSalary ?? 3000) - debtCarriedOver,
    isApproved: false,
  };
  saveSalaryRecord(newRecord);
  return newRecord;
}

export async function addBonus(supervisorId: string, amount: number, reason: string): Promise<void> {
  const record = await getOrCreateSalaryRecord(supervisorId);
  const updated: SalaryRecord = {
    ...record,
    bonuses: [...record.bonuses, { id: generateId(), amount, reason, date: new Date().toISOString() }],
    finalAmount: record.finalAmount + amount,
  };
  saveSalaryRecord(updated);
}

export async function addPenalty(supervisorId: string, amount: number, reason: string): Promise<void> {
  const record = await getOrCreateSalaryRecord(supervisorId);
  const updated: SalaryRecord = {
    ...record,
    penalties: [...record.penalties, { id: generateId(), amount, reason, date: new Date().toISOString() }],
    finalAmount: record.finalAmount - amount,
  };
  saveSalaryRecord(updated);
}

/**
 * Monthly close — approve and archive salary.
 * Carries forward any negative balance to next month.
 */
export async function approveMonthlySalary(supervisorId: string, adminId: string): Promise<SalaryRecord> {
  const record = await getOrCreateSalaryRecord(supervisorId);
  if (record.isApproved) throw new Error('Already approved');

  const sup = await getSupervisorById(supervisorId);
  const pendingDebt = sup?.pendingDebt ?? 0;
  const netFinal = record.finalAmount - pendingDebt;

  const approved: SalaryRecord = {
    ...record,
    finalAmount: netFinal,
    isApproved: true,
    approvedAt: new Date().toISOString(),
    approvedBy: adminId,
    archivedData: JSON.parse(JSON.stringify(record)), // deep freeze snapshot
  };
  saveSalaryRecord(approved);

  // Reset supervisor pending debt after salary settlement
  const sups = await getSupervisors();
  const idx = sups.findIndex(s => s.id === supervisorId);
  if (idx !== -1) {
    sups[idx] = { ...sups[idx], pendingDebt: 0, wallet: { ...sups[idx].wallet, totalFees: 0, totalBalance: 0, transactions: [], lastUpdated: new Date().toISOString() } };
    await saveSupervisors(sups);
  }

  addNotification({
    userId: supervisorId, type: 'wallet',
    titleAr: 'اعتماد الراتب الشهري',
    titleEn: 'Monthly Salary Approved',
    messageAr: `تم اعتماد راتب شهر ${record.month}. الصافي: ${netFinal} ج.م`,
    messageEn: `Salary for ${record.month} approved. Net: ${netFinal} EGP`,
  });

  return approved;
}

// ===== NOTIFICATIONS =====
export async function getNotifications(userId: string): Promise<import('@/types').Notification[]> {
  try { return JSON.parse(localStorage.getItem(`qastly_notifications_${userId}`) ?? '[]'); }
  catch { return []; }
}

export async function addNotification(notif: Omit<import('@/types').Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
  const notifications = await getNotifications(notif.userId);
  const newNotif = { ...notif, id: generateId(), isRead: false, createdAt: new Date().toISOString() };
  localStorage.setItem(`qastly_notifications_${notif.userId}`, JSON.stringify([newNotif, ...notifications]));
  
  // Also sync to Supabase
  await supabaseSync.saveNotificationToSupabase(notif);
}

export async function markNotificationsRead(userId: string): Promise<void> {
  const n = (await getNotifications(userId)).map(notif => ({ ...notif, isRead: true }));
  localStorage.setItem(`qastly_notifications_${userId}`, JSON.stringify(n));
}

// ===== ATTENDANCE =====
export function getAttendanceRecords(supervisorId: string): AttendanceRecord[] {
  try { return JSON.parse(localStorage.getItem(`qastly_attendance_${supervisorId}`) ?? '[]'); }
  catch { return []; }
}

export function saveAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
  const records = getAttendanceRecords(record.supervisorId);
  const newRecord: AttendanceRecord = { ...record, id: generateId() };
  localStorage.setItem(`qastly_attendance_${record.supervisorId}`, JSON.stringify([newRecord, ...records]));
  return newRecord;
}

export function updateAttendanceRecord(supervisorId: string, date: string, updates: Partial<AttendanceRecord>): void {
  const records = getAttendanceRecords(supervisorId);
  const updated = records.map(r => r.date === date ? { ...r, ...updates } : r);
  localStorage.setItem(`qastly_attendance_${supervisorId}`, JSON.stringify(updated));
}

// ===== TESTIMONIALS (Admin-managed) =====
export interface TestimonialItem {
  id: string;
  name: string;
  province: string;
  text: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
}

export function getTestimonials(): TestimonialItem[] {
  try {
    const raw = localStorage.getItem('qastly_testimonials');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveTestimonials(items: TestimonialItem[]): void {
  localStorage.setItem('qastly_testimonials', JSON.stringify(items));
}

export function addTestimonial(item: Omit<TestimonialItem, 'id' | 'createdAt'>): TestimonialItem {
  const all = getTestimonials();
  const newItem: TestimonialItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
  saveTestimonials([newItem, ...all]);
  return newItem;
}

export function deleteTestimonial(id: string): void {
  saveTestimonials(getTestimonials().filter(t => t.id !== id));
}
