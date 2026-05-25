/**
 * Supabase Database Operations
 * Direct integration with Supabase tables for user registration and order management
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  full_name?: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

export interface OrderRecord {
  id: string;
  user_id?: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  price: number;
  stock?: number;
  created_at?: string;
}

// ─────────────────────────────────────────────────────────
// USER PROFILE OPERATIONS
// ─────────────────────────────────────────────────────────

/**
 * Insert a new user profile during registration
 * @param profile User profile data with name, phone, email
 */
export async function createUserProfile(profile: {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: profile.id,
        name: profile.name,
        phone: profile.phone || null,
        email: profile.email || null,
        full_name: profile.name,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user profile:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    console.log('✅ User profile created:', data);
    return data as UserProfile;
  } catch (err) {
    console.error('❌ Create user profile failed:', err);
    throw err;
  }
}

/**
 * Fetch user profile by ID
 */
export async function getUserProfile(id: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching user profile:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return data as UserProfile | null;
  } catch (err) {
    console.error('❌ Fetch user profile failed:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// ORDER OPERATIONS
// ─────────────────────────────────────────────────────────

/**
 * Insert a new order into the database
 * @param order Order data including user_id, customer details, and amount
 */
export async function createOrder(order: {
  id: string;
  user_id?: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_amount: number;
}): Promise<OrderRecord | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        id: order.id,
        user_id: order.user_id || null,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        status: order.status,
        total_amount: order.total_amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating order:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    console.log('✅ Order created:', data);
    return data as OrderRecord;
  } catch (err) {
    console.error('❌ Create order failed:', err);
    throw err;
  }
}

/**
 * Fetch all orders (raw data only)
 */
export async function getAllOrders(): Promise<OrderRecord[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching orders:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return (data as OrderRecord[]) || [];
  } catch (err) {
    console.error('❌ Fetch orders failed:', err);
    return [];
  }
}

/**
 * Fetch a single order by ID
 */
export async function getOrderById(id: string): Promise<OrderRecord | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching order:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return data as OrderRecord | null;
  } catch (err) {
    console.error('❌ Fetch order failed:', err);
    return null;
  }
}

/**
 * Fetch orders by customer phone
 */
export async function getOrdersByCustomerPhone(phone: string): Promise<OrderRecord[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching orders by phone:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return (data as OrderRecord[]) || [];
  } catch (err) {
    console.error('❌ Fetch orders by phone failed:', err);
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(id: string, status: string): Promise<OrderRecord | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating order status:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    console.log('✅ Order status updated:', data);
    return data as OrderRecord;
  } catch (err) {
    console.error('❌ Update order status failed:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// PRODUCT OPERATIONS
// ─────────────────────────────────────────────────────────

/**
 * Fetch all products
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching products:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return (data as Product[]) || [];
  } catch (err) {
    console.error('❌ Fetch products failed:', err);
    return [];
  }
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching product:', error);
      throw new Error(`Supabase Error: ${error.message}`);
    }

    return data as Product | null;
  } catch (err) {
    console.error('❌ Fetch product failed:', err);
    return null;
  }
}
