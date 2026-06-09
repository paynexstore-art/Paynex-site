/**
 * Pricing Engine for PayNex Platform
 * Calculates monthly installments based on admin-configurable parameters
 */

export interface PricingConfig {
  interestRate: number;      // e.g., 0.25 = 25%
  adminFee: number;          // Fixed admin fee in EGP
  inquiryFee: number;        // Fixed inquiry fee in EGP
  months: number;            // Default installment months
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  interestRate: 0,
  adminFee: 2,
  inquiryFee: 150,
  months: 12,
};

/**
 * Calculate monthly installment
 * Formula: ((productPrice + adminFee) * (1 + interestRate) + inquiryFee) / months
 */
export function calculateMonthlyInstallment(
  productPrice: number,
  config: Partial<PricingConfig> = {}
): {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  breakdown: {
    productPrice: number;
    adminFee: number;
    interestAmount: number;
    inquiryFee: number;
  };
} {
  const {
    interestRate = DEFAULT_PRICING_CONFIG.interestRate,
    adminFee = DEFAULT_PRICING_CONFIG.adminFee,
    inquiryFee = DEFAULT_PRICING_CONFIG.inquiryFee,
    months = DEFAULT_PRICING_CONFIG.months,
  } = config;

  // Guard against zero/invalid values
  const safeMonths = Math.max(months, 1);
  const safePrice = Math.max(productPrice, 0);

  // Calculate total with interest: (price + adminFee) * (1 + interestRate)
  const subtotal = (safePrice + adminFee) * (1 + interestRate);

  // Add inquiry fee
  const totalAmount = subtotal + inquiryFee;

  // Calculate monthly payment (rounded to 2 decimal places)
  const monthlyPayment = Number((totalAmount / safeMonths).toFixed(2));

  // Round total amount to 2 decimal places
  const roundedTotal = Number(totalAmount.toFixed(2));

  // Interest amount breakdown
  const interestAmount = Number(((safePrice + adminFee) * interestRate).toFixed(2));

  return {
    monthlyPayment,
    totalAmount: roundedTotal,
    totalInterest: interestAmount,
    breakdown: {
      productPrice: safePrice,
      adminFee,
      interestAmount,
      inquiryFee,
    },
  };
}

/**
 * Load pricing config from admin settings (localStorage or Supabase)
 */
export function getActivePricingConfig(): PricingConfig {
  try {
    const stored = localStorage.getItem('paynex_pricing_config');
    if (stored) {
      return { ...DEFAULT_PRICING_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    console.warn('Failed to load pricing config, using defaults');
  }
  return DEFAULT_PRICING_CONFIG;
}

/**
 * Save pricing config (admin only)
 */
export function savePricingConfig(config: PricingConfig): void {
  localStorage.setItem('paynex_pricing_config', JSON.stringify(config));
}

/**
 * Format price breakdown for display
 */
export function formatPriceBreakdown(
  price: number,
  config: Partial<PricingConfig> = {}
): string {
  const result = calculateMonthlyInstallment(price, config);
  const { breakdown } = result;

  return [
    `سعر المنتج: ${breakdown.productPrice.toLocaleString('ar-EG')} ج.م`,
    `رسوم إدارية: ${breakdown.adminFee.toLocaleString('ar-EG')} ج.م`,
    `رسوم استعلام: ${breakdown.inquiryFee.toLocaleString('ar-EG')} ج.م`,
    breakdown.interestAmount > 0
      ? `الفائدة (${(config.interestRate ?? 0) * 100}%): ${breakdown.interestAmount.toLocaleString('ar-EG')} ج.م`
      : null,
    `---`,
    `الإجمالي: ${result.totalAmount.toLocaleString('ar-EG')} ج.م`,
    `القسط الشهري: ${result.monthlyPayment.toLocaleString('ar-EG')} ج.م`,
  ]
    .filter(Boolean)
    .join('\n');
}
