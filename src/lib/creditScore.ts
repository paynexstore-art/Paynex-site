/**
 * Internal Credit Scoring Engine — PayNex
 *
 * Generates a 0–100 risk score to assist admin decision-making.
 * Score is advisory only — final decision is always made by the Super Admin.
 */

import type { CreditScore, CreditFactor, Order } from '@/types';

interface ScoringInput {
  job: string;
  income?: number;
  nationalIdAge?: number;   // Age derived from national ID (first digit = decade)
  hasUtilityBill: boolean;
  hasIncomeProof: boolean;
  previousOrders?: number;  // Number of previous completed orders
  previousDefaults?: number;
  province: string;
  productPrice: number;
  installmentMonths: number;
}

const JOB_SCORE: Record<string, number> = {
  'موظف حكومي': 25,
  'مدرس': 22,
  'طبيب': 25,
  'مهندس': 22,
  'محاسب': 20,
  'ضابط': 25,
  'عسكري': 24,
  'محامي': 20,
  'صيدلاني': 22,
  'ممرض': 18,
  'موظف بنك': 22,
};

function jobScore(job: string): number {
  for (const [key, val] of Object.entries(JOB_SCORE)) {
    if (job.includes(key)) return val;
  }
  if (job.length > 3) return 12; // Some job listed
  return 5;
}

/**
 * Build credit score from order data.
 */
export function calculateCreditScore(order: Order): CreditScore {
  const factors: CreditFactor[] = [];

  // 1. Employment (max 25)
  const empScore = jobScore(order.customerJob);
  factors.push({
    name: 'Employment',
    nameAr: 'طبيعة العمل',
    weight: 25,
    value: empScore,
    note: order.customerJob,
  });

  // 2. Documents completeness (max 20)
  const docs = order.documents;
  let docScore = 0;
  if (docs.nationalIdFront && docs.nationalIdBack) docScore += 10;
  if (docs.utilityBill) docScore += 5;
  if (docs.incomeProof) docScore += 5;
  factors.push({
    name: 'Documents',
    nameAr: 'اكتمال المستندات',
    weight: 20,
    value: docScore,
  });

  // 3. Installment ratio (max 20) — lower ratio = lower risk
  const monthlyBurden = order.installmentPlan.monthlyPayment;
  // Assume reasonable income floor is 3000 EGP
  const estimatedIncome = 4000;
  const ratio = monthlyBurden / estimatedIncome;
  const ratioScore = ratio < 0.2 ? 20 : ratio < 0.3 ? 16 : ratio < 0.4 ? 12 : ratio < 0.5 ? 8 : 4;
  factors.push({
    name: 'Installment Burden',
    nameAr: 'نسبة القسط للدخل',
    weight: 20,
    value: ratioScore,
    note: `${Math.round(ratio * 100)}% من الدخل التقديري`,
  });

  // 4. Address quality (max 15) — detailed address = lower risk
  const addrScore = order.customerAddress.length > 30 ? 15 : order.customerAddress.length > 15 ? 10 : 5;
  factors.push({
    name: 'Address Detail',
    nameAr: 'تفصيل العنوان',
    weight: 15,
    value: addrScore,
  });

  // 5. Contact info (max 10)
  const contactScore = (order.customerEmail ? 5 : 0) + (order.customerPhone ? 5 : 0);
  factors.push({
    name: 'Contact Info',
    nameAr: 'بيانات التواصل',
    weight: 10,
    value: contactScore,
  });

  // 6. GPS field visit (max 10)
  const gpsScore = order.fieldVisitGps ? 10 : 0;
  factors.push({
    name: 'Field Visit GPS',
    nameAr: 'توثيق الزيارة الميدانية',
    weight: 10,
    value: gpsScore,
  });

  const total = factors.reduce((s, f) => s + f.value, 0);
  const risk: CreditScore['risk'] = total >= 70 ? 'low' : total >= 45 ? 'medium' : 'high';

  return {
    score: Math.min(100, total),
    risk,
    factors,
    calculatedAt: new Date().toISOString(),
  };
}

export function getCreditRiskLabel(risk: CreditScore['risk'], lang: 'ar' | 'en' = 'ar') {
  const map = {
    low:    { ar: 'مخاطرة منخفضة', en: 'Low Risk' },
    medium: { ar: 'مخاطرة متوسطة', en: 'Medium Risk' },
    high:   { ar: 'مخاطرة مرتفعة', en: 'High Risk' },
  };
  return map[risk][lang];
}

export function getCreditRiskColor(risk: CreditScore['risk']) {
  return {
    low:    'text-green-700 bg-green-100 border-green-200',
    medium: 'text-yellow-700 bg-yellow-100 border-yellow-200',
    high:   'text-red-700 bg-red-100 border-red-200',
  }[risk];
}
