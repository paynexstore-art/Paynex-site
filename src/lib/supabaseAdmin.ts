/**
 * Supabase Admin Data Layer
 * ─────────────────────────────────────────────────────
 * Centralized queries for Admin panel with strict TypeScript
 * All queries include error handling and proper typing
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────────
// TYPE DEFINITIONS (Strict TypeScript)
// ─────────────────────────────────────────────────────────

export interface SupervisorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  province: string;
  work_hours_start?: string;
  work_hours_end?: string;
  target?: number;
  is_active: boolean;
  created_at: string;
}

export interface OrderWithDetails {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_national_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  user_profiles?: { name: string };
  products?: { name_en: string; name_ar: string };
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id?: string;
  before?: string;
  after?: string;
  created_at: string;
}

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalFees: number;
  totalCustomers: number;
}

// ─────────────────────────────────────────────────────────
// SUPERVISORS QUERIES
// ─────────────────────────────────────────────────────────

export async function fetchSupervisors(): Promise<SupervisorData[]> {
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching supervisors:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return (data as SupervisorData[]) || [];
  } catch (err) {
    console.error('❌ Supervisors fetch failed:', err);
    throw err;
  }
}

export async function fetchSupervisorById(id: string): Promise<SupervisorData | null> {
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching supervisor:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return data as SupervisorData | null;
  } catch (err) {
    console.error('❌ Supervisor fetch failed:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────
// ORDERS QUERIES (with JOINs)
// ─────────────────────────────────────────────────────────

export async function fetchOrdersWithDetails(): Promise<OrderWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_phone,
        customer_national_id,
        status,
        total_amount,
        created_at,
        updated_at,
        user_profiles (name),
        products (name_en, name_ar)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching orders with details:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return (data as OrderWithDetails[]) || [];
  } catch (err) {
    console.error('❌ Orders fetch failed:', err);
    throw err;
  }
}

export async function fetchOrdersByStatus(status: string): Promise<OrderWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_phone,
        customer_national_id,
        status,
        total_amount,
        created_at,
        updated_at,
        user_profiles (name),
        products (name_en, name_ar)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching orders by status:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return (data as OrderWithDetails[]) || [];
  } catch (err) {
    console.error('❌ Orders by status fetch failed:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────
// AUDIT LOGS QUERIES
// ─────────────────────────────────────────────────────────

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching audit logs:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return (data as AuditLogEntry[]) || [];
  } catch (err) {
    console.error('❌ Audit logs fetch failed:', err);
    throw err;
  }
}

export async function fetchAuditLogsByEntity(entity: string): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity', entity)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching audit logs by entity:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return (data as AuditLogEntry[]) || [];
  } catch (err) {
    console.error('❌ Audit logs by entity fetch failed:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────
// ANALYTICS QUERIES (Aggregations)
// ─────────────────────────────────────────────────────────

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  try {
    // Total Orders Count
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordersError) throw ordersError;

    // Total Revenue (SUM of total_amount)
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total_amount');

    if (revenueError) throw revenueError;

    const totalRevenue = (revenueData as Array<{ total_amount: number }>)?.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    ) || 0;

    // Total Fees (SUM of total_fees from wallets)
    const { data: feesData, error: feesError } = await supabase
      .from('wallets')
      .select('total_fees');

    if (feesError) throw feesError;

    const totalFees = (feesData as Array<{ total_fees: number }>)?.reduce(
      (sum, wallet) => sum + (wallet.total_fees || 0),
      0
    ) || 0;

    // Total Customers Count
    const { count: totalCustomers, error: customersError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    if (customersError) throw customersError;

    return {
      totalOrders: totalOrders || 0,
      totalRevenue,
      totalFees,
      totalCustomers: totalCustomers || 0,
    };
  } catch (err) {
    console.error('❌ Analytics fetch failed:', err);
    throw err;
  }
}

/**
 * Orders aggregation by province
 */
export async function fetchOrdersByProvince(): Promise<Array<{ province: string; count: number; revenue: number }>> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('customer_province, total_amount');

    if (error) throw error;

    const aggregated: Record<string, { count: number; revenue: number }> = {};

    (data as Array<{ customer_province: string; total_amount: number }>)?.forEach((order) => {
      const province = order.customer_province || 'Unknown';
      if (!aggregated[province]) {
        aggregated[province] = { count: 0, revenue: 0 };
      }
      aggregated[province].count += 1;
      aggregated[province].revenue += order.total_amount || 0;
    });

    return Object.entries(aggregated).map(([province, data]) => ({
      province,
      count: data.count,
      revenue: data.revenue,
    }));
  } catch (err) {
    console.error('❌ Orders by province fetch failed:', err);
    throw err;
  }
}

/**
 * Supervisor performance metrics
 */
export async function fetchSupervisorPerformance(): Promise<
  Array<{ id: string; name: string; orders: number; revenue: number; fees: number }>
> {
  try {
    // Fetch all supervisors
    const { data: supervisors, error: supError } = await supabase
      .from('supervisors')
      .select('id, name');

    if (supError) throw supError;

    // For each supervisor, count orders and sum revenue
    const performance: Array<{ id: string; name: string; orders: number; revenue: number; fees: number }> = [];

    for (const sup of (supervisors as Array<{ id: string; name: string }>) || []) {
      const { count: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('supervisor_id', sup.id);

      if (ordersErr) throw ordersErr;

      const { data: orderData, error: dataErr } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('supervisor_id', sup.id);

      if (dataErr) throw dataErr;

      const revenue = (orderData as Array<{ total_amount: number }>)?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ) || 0;

      const { data: walletData, error: walletErr } = await supabase
        .from('wallets')
        .select('total_fees')
        .eq('supervisor_id', sup.id)
        .single();

      if (walletErr && walletErr.code !== 'PGRST116') throw walletErr;

      performance.push({
        id: sup.id,
        name: sup.name,
        orders: orders || 0,
        revenue,
        fees: (walletData as { total_fees: number } | null)?.total_fees || 0,
      });
    }

    return performance;
  } catch (err) {
    console.error('❌ Supervisor performance fetch failed:', err);
    throw err;
  }
}
