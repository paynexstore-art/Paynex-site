/**
 * Supabase Data Synchronization Layer
 * 
 * This module replaces localStorage data fetching with Supabase database queries
 * while maintaining a hybrid approach for offline support and performance optimization.
 * 
 * Strategy:
 * 1. Try to fetch from Supabase first
 * 2. Fall back to localStorage cache if Supabase fails
 * 3. Sync changes bidirectionally
 */

import { supabase } from '@/supabaseClient';
import type {
  SiteSettings,
  Order,
  Product,
  Supervisor,
  User,
  Notification,
} from '@/types';
import {
  getSiteSettings as getLocalSettings,
  saveSiteSettings as saveLocalSettings,
  getProducts as getLocalProducts,
  saveProducts as saveLocalProducts,
  getOrders as getLocalOrders,
  saveOrders as saveLocalOrders,
  getSupervisors as getLocalSupervisors,
  saveSupervisors as saveLocalSupervisors,
} from './storage';

// ─────────────────────────────────────────────────────────
// SITE SETTINGS
// ─────────────────────────────────────────────────────────

/**
 * Fetch site settings from Supabase with localStorage fallback
 */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (normal for first time)
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data) {
      const settings: SiteSettings = {
        consultationFee: data.consultation_fee ?? 200,
        deliveryFee: data.delivery_fee ?? 50,
        installmentMonths: data.installment_months ?? [3, 6, 12],
        maxInstallmentAmount: data.max_installment_amount ?? 50000,
        minInstallmentAmount: data.min_installment_amount ?? 500,
        siteName: data.site_name ?? 'PayNex',
        siteNameAr: data.site_name_ar ?? 'باينكس',
        supportEmail: data.support_email ?? 'support@paynex.com',
        supportPhone: data.support_phone ?? '+20201234567',
        lastSyncDate: data.updated_at ?? new Date().toISOString(),
      };

      // Update local cache
      saveLocalSettings(settings);
      return settings;
    }
  } catch (err) {
    console.warn('⚠️ Failed to fetch settings from Supabase:', err);
  }

  // Fall back to localStorage
  return getLocalSettings();
}

/**
 * Save site settings to both Supabase and localStorage
 */
export async function saveSiteSettingsToSupabase(settings: SiteSettings): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          id: 'default', // Single row pattern
          consultation_fee: settings.consultationFee,
          delivery_fee: settings.deliveryFee,
          installment_months: settings.installmentMonths,
          max_installment_amount: settings.maxInstallmentAmount,
          min_installment_amount: settings.minInstallmentAmount,
          site_name: settings.siteName,
          site_name_ar: settings.siteNameAr,
          support_email: settings.supportEmail,
          support_phone: settings.supportPhone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Also save to localStorage
    saveLocalSettings(settings);
    return true;
  } catch (err) {
    console.error('❌ Failed to save settings to Supabase:', err);
    // Still save locally
    saveLocalSettings(settings);
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────

/**
 * Fetch all products from Supabase with localStorage fallback
 */
export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data && Array.isArray(data)) {
      const products: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        nameAr: p.name_ar ?? p.name,
        nameEn: p.name_en ?? p.name,
        description: p.description ?? '',
        descriptionAr: p.description_ar ?? '',
        descriptionEn: p.description_en ?? '',
        price: p.price,
        originalPrice: p.original_price,
        images: p.images ?? [],
        category: p.category ?? '',
        categoryAr: p.category_ar ?? '',
        brand: p.brand ?? '',
        source: p.source ?? 'manual',
        sourceId: p.source_id,
        sourceUrl: p.source_url ?? '',
        isActive: p.is_active ?? true,
        stock: p.stock ?? 0,
        specs: p.specs ?? {},
        lastSyncedAt: p.last_synced_at ?? new Date().toISOString(),
        createdAt: p.created_at ?? new Date().toISOString(),
        adminPriceOverride: p.admin_price_override,
      }));

      // Update local cache
      saveLocalProducts(products);
      return products;
    }
  } catch (err) {
    console.warn('⚠️ Failed to fetch products from Supabase:', err);
  }

  // Fall back to localStorage
  return getLocalProducts();
}

/**
 * Fetch product by ID from Supabase with localStorage fallback
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data) {
      return {
        id: data.id,
        name: data.name,
        nameAr: data.name_ar ?? data.name,
        nameEn: data.name_en ?? data.name,
        description: data.description ?? '',
        descriptionAr: data.description_ar ?? '',
        descriptionEn: data.description_en ?? '',
        price: data.price,
        originalPrice: data.original_price,
        images: data.images ?? [],
        category: data.category ?? '',
        categoryAr: data.category_ar ?? '',
        brand: data.brand ?? '',
        source: data.source ?? 'manual',
        sourceId: data.source_id,
        sourceUrl: data.source_url ?? '',
        isActive: data.is_active ?? true,
        stock: data.stock ?? 0,
        specs: data.specs ?? {},
        lastSyncedAt: data.last_synced_at ?? new Date().toISOString(),
        createdAt: data.created_at ?? new Date().toISOString(),
        adminPriceOverride: data.admin_price_override,
      };
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch product ${id} from Supabase:`, err);
  }

  // Fall back to localStorage
  const products = getLocalProducts();
  return products.find(p => p.id === id) ?? null;
}

/**
 * Fetch products by category from Supabase with localStorage fallback
 */
export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data && Array.isArray(data)) {
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        nameAr: p.name_ar ?? p.name,
        nameEn: p.name_en ?? p.name,
        description: p.description ?? '',
        descriptionAr: p.description_ar ?? '',
        descriptionEn: p.description_en ?? '',
        price: p.price,
        originalPrice: p.original_price,
        images: p.images ?? [],
        category: p.category ?? '',
        categoryAr: p.category_ar ?? '',
        brand: p.brand ?? '',
        source: p.source ?? 'manual',
        sourceId: p.source_id,
        sourceUrl: p.source_url ?? '',
        isActive: p.is_active ?? true,
        stock: p.stock ?? 0,
        specs: p.specs ?? {},
        lastSyncedAt: p.last_synced_at ?? new Date().toISOString(),
        createdAt: p.created_at ?? new Date().toISOString(),
        adminPriceOverride: p.admin_price_override,
      }));
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch products by category from Supabase:`, err);
  }

  // Fall back to localStorage
  const products = getLocalProducts();
  return products.filter(p => p.category === category && p.isActive);
}

// ─────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────

/**
 * Fetch all orders from Supabase with localStorage fallback
 */
export async function fetchAllOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data && Array.isArray(data)) {
      const orders: Order[] = data.map((o: any) => ({
        id: o.id,
        customerId: o.customer_id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        productId: o.product_id,
        productName: o.product_name,
        productPrice: o.product_price,
        quantity: o.quantity ?? 1,
        installmentMonths: o.installment_months,
        monthlyPayment: o.monthly_payment,
        consultationFee: o.consultation_fee,
        deliveryFee: o.delivery_fee,
        totalAmount: o.total_amount,
        status: o.status,
        supervisorId: o.supervisor_id,
        province: o.province,
        city: o.city,
        address: o.address,
        notes: o.notes,
        approvedAt: o.approved_at,
        rejectedAt: o.rejected_at,
        deliveredAt: o.delivered_at,
        canReapplyAt: o.can_reapply_at,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      }));

      // Update local cache
      saveLocalOrders(orders);
      return orders;
    }
  } catch (err) {
    console.warn('⚠️ Failed to fetch orders from Supabase:', err);
  }

  // Fall back to localStorage
  return getLocalOrders();
}

/**
 * Fetch order by ID from Supabase with localStorage fallback
 */
export async function fetchOrderById(id: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data) {
      return {
        id: data.id,
        customerId: data.customer_id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        productId: data.product_id,
        productName: data.product_name,
        productPrice: data.product_price,
        quantity: data.quantity ?? 1,
        installmentMonths: data.installment_months,
        monthlyPayment: data.monthly_payment,
        consultationFee: data.consultation_fee,
        deliveryFee: data.delivery_fee,
        totalAmount: data.total_amount,
        status: data.status,
        supervisorId: data.supervisor_id,
        province: data.province,
        city: data.city,
        address: data.address,
        notes: data.notes,
        approvedAt: data.approved_at,
        rejectedAt: data.rejected_at,
        deliveredAt: data.delivered_at,
        canReapplyAt: data.can_reapply_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch order ${id} from Supabase:`, err);
  }

  // Fall back to localStorage
  const orders = getLocalOrders();
  return orders.find(o => o.id === id) ?? null;
}

/**
 * Fetch orders by customer ID from Supabase with localStorage fallback
 */
export async function fetchOrdersByCustomer(customerId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data && Array.isArray(data)) {
      return data.map((o: any) => ({
        id: o.id,
        customerId: o.customer_id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        productId: o.product_id,
        productName: o.product_name,
        productPrice: o.product_price,
        quantity: o.quantity ?? 1,
        installmentMonths: o.installment_months,
        monthlyPayment: o.monthly_payment,
        consultationFee: o.consultation_fee,
        deliveryFee: o.delivery_fee,
        totalAmount: o.total_amount,
        status: o.status,
        supervisorId: o.supervisor_id,
        province: o.province,
        city: o.city,
        address: o.address,
        notes: o.notes,
        approvedAt: o.approved_at,
        rejectedAt: o.rejected_at,
        deliveredAt: o.delivered_at,
        canReapplyAt: o.can_reapply_at,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      }));
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch orders by customer from Supabase:`, err);
  }

  // Fall back to localStorage
  return getLocalOrders().filter(o => o.customerId === customerId);
}

/**
 * Fetch orders by supervisor ID from Supabase with localStorage fallback
 */
export async function fetchOrdersBySupervisor(supervisorId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data && Array.isArray(data)) {
      return data.map((o: any) => ({
        id: o.id,
        customerId: o.customer_id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        productId: o.product_id,
        productName: o.product_name,
        productPrice: o.product_price,
        quantity: o.quantity ?? 1,
        installmentMonths: o.installment_months,
        monthlyPayment: o.monthly_payment,
        consultationFee: o.consultation_fee,
        deliveryFee: o.delivery_fee,
        totalAmount: o.total_amount,
        status: o.status,
        supervisorId: o.supervisor_id,
        province: o.province,
        city: o.city,
        address: o.address,
        notes: o.notes,
        approvedAt: o.approved_at,
        rejectedAt: o.rejected_at,
        deliveredAt: o.delivered_at,
        canReapplyAt: o.can_reapply_at,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      }));
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch orders by supervisor from Supabase:`, err);
  }

  // Fall back to localStorage
  return getLocalOrders().filter(o => o.supervisorId === supervisorId);
}

/**
 * Fetch orders by status from Supabase with localStorage fallback
 */
export async function fetchOrdersByStatus(status: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data && Array.isArray(data)) {
      return data.map((o: any) => ({
        id: o.id,
        customerId: o.customer_id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        productId: o.product_id,
        productName: o.product_name,
        productPrice: o.product_price,
        quantity: o.quantity ?? 1,
        installmentMonths: o.installment_months,
        monthlyPayment: o.monthly_payment,
        consultationFee: o.consultation_fee,
        deliveryFee: o.delivery_fee,
        totalAmount: o.total_amount,
        status: o.status,
        supervisorId: o.supervisor_id,
        province: o.province,
        city: o.city,
        address: o.address,
        notes: o.notes,
        approvedAt: o.approved_at,
        rejectedAt: o.rejected_at,
        deliveredAt: o.delivered_at,
        canReapplyAt: o.can_reapply_at,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      }));
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch orders by status from Supabase:`, err);
  }

  // Fall back to localStorage
  return getLocalOrders().filter(o => o.status === status);
}

// ─────────────────────────────────────────────────────────
// SUPERVISORS
// ─────────────────────────────────────────────────────────

/**
 * Fetch all supervisors from Supabase with localStorage fallback
 */
export async function fetchAllSupervisors(): Promise<Supervisor[]> {
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data && Array.isArray(data)) {
      const supervisors: Supervisor[] = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        province: s.province,
        baseSalary: s.base_salary ?? 3000,
        isActive: s.is_active ?? true,
        isLocked: s.is_locked ?? false,
        pendingDebt: s.pending_debt ?? 0,
        lastCheckOutAt: s.last_checkout_at,
        wallet: {
          totalBalance: s.wallet_total_balance ?? 0,
          totalFees: s.wallet_total_fees ?? 0,
          transactions: s.wallet_transactions ?? [],
          lastUpdated: s.wallet_last_updated ?? new Date().toISOString(),
          lastSettledAt: s.wallet_last_settled_at,
        },
        createdAt: s.created_at,
      }));

      // Update local cache
      saveLocalSupervisors(supervisors);
      return supervisors;
    }
  } catch (err) {
    console.warn('⚠️ Failed to fetch supervisors from Supabase:', err);
  }

  // Fall back to localStorage
  return getLocalSupervisors();
}

/**
 * Fetch supervisor by ID from Supabase with localStorage fallback
 */
export async function fetchSupervisorById(id: string): Promise<Supervisor | null> {
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data) {
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        province: data.province,
        baseSalary: data.base_salary ?? 3000,
        isActive: data.is_active ?? true,
        isLocked: data.is_locked ?? false,
        pendingDebt: data.pending_debt ?? 0,
        lastCheckOutAt: data.last_checkout_at,
        wallet: {
          totalBalance: data.wallet_total_balance ?? 0,
          totalFees: data.wallet_total_fees ?? 0,
          transactions: data.wallet_transactions ?? [],
          lastUpdated: data.wallet_last_updated ?? new Date().toISOString(),
          lastSettledAt: data.wallet_last_settled_at,
        },
        createdAt: data.created_at,
      };
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch supervisor ${id} from Supabase:`, err);
  }

  // Fall back to localStorage
  const supervisors = getLocalSupervisors();
  return supervisors.find(s => s.id === id) ?? null;
}

/**
 * Fetch supervisor by province from Supabase with localStorage fallback
 */
export async function fetchSupervisorByProvince(province: string): Promise<Supervisor | null> {
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('province', province)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data) {
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        province: data.province,
        baseSalary: data.base_salary ?? 3000,
        isActive: data.is_active ?? true,
        isLocked: data.is_locked ?? false,
        pendingDebt: data.pending_debt ?? 0,
        lastCheckOutAt: data.last_checkout_at,
        wallet: {
          totalBalance: data.wallet_total_balance ?? 0,
          totalFees: data.wallet_total_fees ?? 0,
          transactions: data.wallet_transactions ?? [],
          lastUpdated: data.wallet_last_updated ?? new Date().toISOString(),
          lastSettledAt: data.wallet_last_settled_at,
        },
        createdAt: data.created_at,
      };
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch supervisor by province from Supabase:`, err);
  }

  // Fall back to localStorage
  return getLocalSupervisors().find(s => s.province === province && s.isActive) ?? null;
}

// ─────────────────────────────────────────────────────────
// USER PROFILES
// ─────────────────────────────────────────────────────────

/**
 * Fetch user profile from Supabase with localStorage fallback
 */
export async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data) {
      return {
        id: data.id,
        name: data.full_name,
        email: data.email ?? '',
        phone: data.phone,
        role: data.role ?? 'customer',
        avatar: data.avatar_url,
      };
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch user profile from Supabase:`, err);
  }

  return null;
}

/**
 * Save user profile to Supabase
 */
export async function saveUserProfileToSupabase(user: Partial<User>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: user.id,
          full_name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role ?? 'customer',
          avatar_url: user.avatar,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return true;
  } catch (err) {
    console.error('❌ Failed to save user profile to Supabase:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────

/**
 * Fetch user notifications from Supabase
 */
export async function fetchUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (data && Array.isArray(data)) {
      return data.map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        titleAr: n.title_ar,
        titleEn: n.title_en,
        messageAr: n.message_ar,
        messageEn: n.message_en,
        orderId: n.order_id,
        isRead: n.is_read ?? false,
        createdAt: n.created_at,
      }));
    }
  } catch (err) {
    console.warn(`⚠️ Failed to fetch notifications from Supabase:`, err);
  }

  return [];
}

/**
 * Save notification to Supabase
 */
export async function saveNotificationToSupabase(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: notification.userId,
          type: notification.type,
          title_ar: notification.titleAr,
          title_en: notification.titleEn,
          message_ar: notification.messageAr,
          message_en: notification.messageEn,
          order_id: notification.orderId,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return true;
  } catch (err) {
    console.error('❌ Failed to save notification to Supabase:', err);
    return false;
  }
}
