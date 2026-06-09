// src/lib/creditScore.ts
export interface CreditScoreInput {
  monthlyIncome?: number
  jobType?: 'government' | 'private' | 'business' | 'unemployed'
  previousOrders?: number
  previousDefaults?: number
  requestedAmount: number
  supervisorNotes?: string
}

export interface CreditScoreResult {
  score: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: string
  factors: string[]
}

export function calculateCreditScore(data: CreditScoreInput): CreditScoreResult {
  let score = 50
  const factors: string[] = []

  if (data.monthlyIncome) {
    if (data.monthlyIncome > 8000) { score += 25; factors.push('دخل مرتفع +25') }
    else if (data.monthlyIncome > 5000) { score += 15; factors.push('دخل متوسط مرتفع +15') }
    else if (data.monthlyIncome > 3000) { score += 5; factors.push('دخل متوسط +5') }
    else { score -= 10; factors.push('دخل منخفض -10') }
  }

  if (data.jobType === 'government') { score += 20; factors.push('وظيفة حكومية +20') }
  else if (data.jobType === 'private') { score += 10; factors.push('وظيفة خاصة +10') }
  else if (data.jobType === 'business') { score += 15; factors.push('أعمال حرة +15') }
  else { score -= 15; factors.push('بدون وظيفة -15') }

  if (data.previousOrders && data.previousOrders > 0) {
    score += Math.min(data.previousOrders * 5, 15)
    factors.push(`تاريخ مشتريات +${Math.min(data.previousOrders * 5, 15)}`)
  }

  if (data.previousDefaults && data.previousDefaults > 0) {
    score -= data.previousDefaults * 20
    factors.push(`تأخر سابق -${data.previousDefaults * 20}`)
  }

  if (data.monthlyIncome && data.monthlyIncome > 0) {
    const ratio = data.requestedAmount / (data.monthlyIncome * 12)
    if (ratio > 0.7) { score -= 20; factors.push('طلب مرتفع مقارنة بالدخل -20') }
    else if (ratio > 0.5) { score -= 10; factors.push('طلب متوسط مقارنة بالدخل -10') }
  }

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    riskLevel: score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high',
    recommendation:
      score >= 70 ? 'يُنصح بالموافقة - مخاطر منخفضة'
      : score >= 40 ? 'يحتاج مراجعة إضافية - مخاطر متوسطة'
      : 'خطر مرتفع - يُنصح بالرفض أو ضمانات إضافية',
    factors,
  }
}
