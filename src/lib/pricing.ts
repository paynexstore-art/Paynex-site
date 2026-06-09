// src/lib/pricing.ts
export interface PricingParams {
  productPrice: number
  downPayment?: number
  months: number
  interestRate: number
  adminFee: number
  inquiryFee: number
}

export interface PricingResult {
  monthlyInstallment: number
  totalAmount: number
  totalInterest: number
  financedAmount: number
  effectiveRate: number
}

export function calculateInstallment(params: PricingParams): PricingResult {
  const {
    productPrice,
    downPayment = 0,
    months,
    interestRate,
    adminFee,
    inquiryFee,
  } = params

  if (months <= 0) throw new Error('مدة التقسيط يجب أن تكون أكبر من صفر')
  if (productPrice <= 0) throw new Error('سعر المنتج غير صحيح')
  if (downPayment > productPrice) throw new Error('المقدم أكبر من سعر المنتج')

  const financedAmount = productPrice - downPayment
  // Formula: (Financed + Admin Fee) * (1 + Interest) + Inquiry Fee
  const totalWithInterest = (financedAmount + adminFee) * (1 + interestRate)
  const totalAmount = totalWithInterest + inquiryFee
  const monthlyInstallment = totalAmount / months

  return {
    monthlyInstallment: Number(monthlyInstallment.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    totalInterest: Number((totalWithInterest - financedAmount).toFixed(2)),
    financedAmount: Number(financedAmount.toFixed(2)),
    effectiveRate: Number((interestRate * 100).toFixed(2)),
  }
}
