export type UserRole = 'super_admin' | 'admin' | 'manager' | 'supervisor' | 'customer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  nationalId?: string;
  governorate?: string;
  address?: string;
  jobTitle?: string;
  isActive: boolean;
  isLocked: boolean;
  lockReason?: string;
  googleId?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  productId?: string;
  supervisorId?: string;
  customerName?: string;
  customerPhone?: string;
  customerNationalId?: string;
  customerGovernorate?: string;
  customerAddress?: string;
  customerJob?: string;
  status: 'pending' | 'inquiry_fee_pending' | 'under_inquiry' | 'admin_review' | 'approved' | 'delivered' | 'rejected' | 'cancelled';
  productPrice?: number;
  downPayment: number;
  months: number;
  interestRate?: number;
  adminFee?: number;
  inquiryFee?: number;
  monthlyInstallment?: number;
  totalAmount?: number;
  creditScore?: number;
  inquiryFeePaid: boolean;
  submittedAt: Date;
  approvedAt?: Date;
  deliveredAt?: Date;
  rejectedAt?: Date;
  rejectionCooldownUntil?: Date;
}
