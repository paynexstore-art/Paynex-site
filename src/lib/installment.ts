/**
 * Financial Engine — PayNex Installment Calculator
 *
 * Formula (per spec):
 *   Monthly = [((productPrice + adminFeeAmt) * (1 + interestRate)) + inquiryFee] / months
 *
 * Where:
 *   adminFeeAmt   = productPrice * (adminFeePercent / 100)   — absolute EGP
 *   interestRate  = annual %  stored as decimal (e.g. 0.25)
 *   inquiryFee    = fixed EGP (set by admin)
 */

import type { InstallmentPlan } from '@/types';
import { getSiteSettingsSync } from './storage';

export interface InstallmentCalculatorInput {
  productPrice: number;
  downPayment: number;
  months: number;
  interestRateOverride?: number;   // % (e.g. 25 means 25%)
  adminFeeOverride?: number;       // % of principal
  inquiryFeeOverride?: number;     // fixed EGP
}

/**
 * Core installment calculation — clean & commented per spec.
 */
export function calculateInstallment(input: InstallmentCalculatorInput): InstallmentPlan {
  const settings = getSiteSettingsSync();

  // --- Resolve configuration (allow per-order admin overrides) ---
  const interestRatePct = input.interestRateOverride ?? settings.defaultInterestRate ?? 0;
  const adminFeePct     = input.adminFeeOverride     ?? settings.defaultAdminFee     ?? 2;
  const inquiryFee      = input.inquiryFeeOverride   ?? settings.inquiryFee          ?? 150;

  // --- Guard against bad inputs ---
  const productPrice = Math.max(0, parseFloat(String(input.productPrice)) || 0);
  const downPayment  = Math.min(productPrice, Math.max(0, parseFloat(String(input.downPayment)) || 0));
  const months       = Math.max(1, parseInt(String(input.months)) || 12);

  // --- Principal after down payment ---
  const principal = productPrice - downPayment;

  // --- Admin fee (absolute EGP on principal) ---
  const adminFeeAmount = (principal * adminFeePct) / 100;

  // --- Interest rate as decimal ---
  const interestDecimal = interestRatePct / 100;

  // --- Apply PayNex formula ---
  // Step 1: (principal + adminFee) * (1 + interestRate)
  const withInterest = (principal + adminFeeAmount) * (1 + interestDecimal);

  // Step 2: Add inquiry fee
  const finalTotal = withInterest + inquiryFee;

  // Step 3: Divide by months — round to 2 decimal places per spec
  const monthly = Number((finalTotal / months).toFixed(2));

  // Ceil the monthly payment (never lose money on rounding)
  const monthlyPayment = Math.ceil(monthly);

  // Total MUST be derived from the actual ceiled monthly payment to avoid
  // financial discrepancy (e.g. showing 3 × 334 EGP but total says 1000 EGP)
  const totalAmount = monthlyPayment * months + downPayment;

  return {
    months,
    downPayment,
    interestRate: interestRatePct,
    adminFee: adminFeePct,
    adminFeeAmount: Number(adminFeeAmount.toFixed(2)),
    inquiryFee,
    monthlyPayment,
    totalAmount,
  };
}

/**
 * Available month options up to admin-configured max.
 */
export function getAvailableMonths(): number[] {
  const settings = getSiteSettingsSync();
  const max = settings.maxInstallmentMonths ?? 36;
  const options: number[] = [];
  for (let m = 3; m <= max; m += 3) {
    options.push(m);
  }
  return options;
}

export function formatInstallmentSummary(plan: InstallmentPlan, lang: 'ar' | 'en' = 'ar'): string {
  if (lang === 'ar') {
    return `${plan.months} شهر × ${plan.monthlyPayment.toLocaleString('ar-EG')} ج.م`;
  }
  return `${plan.months} months × EGP ${plan.monthlyPayment.toLocaleString()}`;
}
