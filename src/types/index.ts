// ============================================================
// Application Types — Qastly (قسطلي)
// ============================================================

export type Lang = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';
export type UserRole = 'customer' | 'supervisor' | 'admin';

// ———— CATEGORIES ————
export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon?: string;
  color?: string;
  order?: number;
}

// ——— Core User ———
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  province?: string;
  createdAt: string;
  updatedAt?: string;
  isActive?: boolean;
  googleId?: string;
}

// ——— Supervisor ———
export interface Supervisor extends User {
  baseSalary?: number;             // Monthly base salary (EGP)
  role: 'supervisor';
  province: string;
  workHoursStart: string;
  workHoursEnd: string;
  workDays: string[];
  target: number;
  wallet: SupervisorWallet;
  rewards: Reward[];
  attendanceRecords: AttendanceRecord[];
  isLocked?: boolean;           // Financial lock: must settle daily before next check-in
  lastCheckOutAt?: string;      // Timestamp of last check-out
  pendingDebt?: number;         // Current unsettled cash in custody
}

export interface SupervisorWallet {
  id: string;
  supervisorId: string;
  totalFees: number;
  totalInstallmentsCollected: number;
  totalBalance: number;
  transactions: WalletTransaction[];
  lastUpdated: string;
  lastSettledAt?: string;       // When admin last cleared debt
}

export interface WalletTransaction {
  id: string;
  type: 'fee' | 'installment' | 'withdrawal' | 'adjustment' | 'settlement';
  amount: number;
  description: string;
  orderId?: string;
  createdAt: string;
  approvedBy?: string;
  gpsLat?: number;
  gpsLng?: number;
}

// ——— Attendance ———
export interface AttendanceRecord {
  id: string;
  supervisorId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInGps?: GpsCoords;
  checkOutGps?: GpsCoords;
  status: 'present' | 'absent' | 'late' | 'early-leave';
  faceVerified: boolean;
  faceImage?: string;
  location?: string;
  isMockLocation?: boolean;
}

export interface GpsCoords {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
}

// ——— Rewards ———
export interface Reward {
  id: string;
  supervisorId: string;
  type: 'bonus' | 'certificate' | 'penalty';
  amount?: number;
  description: string;
  achievedAt: string;
  criteria: string;
}

// ——— Product (Complete Schema) ———
export interface Product {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  description: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;              // e.g. 'phones', 'laptops', 'tvs', 'appliances', 'gaming'
  categoryAr: string;
  brand: string;
  source: 'aman' | 'btech' | 'manual';
  sourceId?: string;
  sourceUrl?: string;
  isActive: boolean;
  stock: number;
  specs?: Record<string, string>;
  lastSyncedAt?: string;
  createdAt: string;
  adminPriceOverride?: number;
}

// ——— Order ———
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerNationalId: string;
  customerEmail: string;
  customerProvince: string;
  customerAddress: string;
  customerJob: string;
  productId: string;
  product?: Product;
  installmentPlan: InstallmentPlan;
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'delivered' | 'admin-review';
  supervisorId?: string;
  documents: OrderDocuments;
  fieldVisitGps?: GpsCoords;
  eSignature?: ESignature;
  createdAt: string;
  updatedAt: string;
  rejectedAt?: string;
  approvedAt?: string;
  deliveredAt?: string;
  canReapplyAt?: string;
}

export interface OrderDocuments {
  nationalIdFront?: string;
  nationalIdBack?: string;
  utilityBill?: string;
  incomeProof?: string;
}

export interface InstallmentPlan {
  months: number;
  downPayment: number;
  interestRate: number;
  adminFee: number;
  adminFeeAmount: number;
  inquiryFee: number;
  monthlyPayment: number;
  totalAmount: number;
}

// ——— Site Settings ———
export interface Banner {
  id: string;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  link: string;
  isActive: boolean;
  order: number;
}

export interface SiteSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  siteNameAr: string;
  siteNameEn: string;
  taglineAr: string;
  taglineEn: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  inquiryFee: number;
  defaultInterestRate: number;
  defaultAdminFee: number;
  minDownPaymentPercent: number;
  maxInstallmentMonths: number;
  defaultInstallmentMonths: number;
  footerTextAr: string;
  footerTextEn: string;
  lastSyncDate: string;
  syncJsonUrl: string;
  autoSyncEnabled: boolean;
  autoSyncIntervalHours: number;
  banners: Banner[];
  syncErrorMessage?: string;
}

// ——— Province ———
export interface Province {
  id: string;
  nameAr: string;
  nameEn: string;
}

// ——— E-Signature ———
export interface ESignature {
  signatureData: string;       // base64 image or SVG path
  signedAt: string;
  signedBy: string;            // customer name
  ipAddress?: string;
  userAgent?: string;
}

// ——— Credit Score ———
export interface CreditFactor {
  name: string;
  nameAr: string;
  weight: number;    // max points
  value: number;     // actual points
  note?: string;
}

export interface CreditScore {
  score: number;     // 0-100
  factors: CreditFactor[];
  risk: 'low' | 'medium' | 'high';
  calculatedAt: string;
}

// ——— WhatsApp Log ———
export interface WhatsAppLog {
  id: string;
  orderId: string;
  phone: string;
  template: 'installment_reminder' | 'late_alert' | 'thank_you' | 'admin_approval' | 'doc_request';
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  errorMessage?: string;
}

// ——— Notification ———
export interface Notification {
  id: string;
  userId: string;
  type: 'new-order' | 'order-update' | 'wallet' | 'lock-alert';
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

// ——— Analytics ———
export interface Analytics {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  ordersByProvince: { province: string; count: number; revenue: number }[];
  topProducts: { product: string; count: number }[];
  supervisorPerformance: { name: string; orders: number; revenue: number; attendance: number }[];
  monthlyTrend: { month: string; orders: number; revenue: number }[];
}
