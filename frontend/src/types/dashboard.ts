import type { FinancialRecordResponse } from '@/types/record'

export interface CategoryTotal {
  category: string
  total: number
  income: number
  expense: number
}

export interface MonthlyTrend {
  year: number
  month: number
  monthName: string
  income: number
  expense: number
}

export interface DashboardResponse {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  categoryTotals: CategoryTotal[]
  monthlyTrends: MonthlyTrend[]
  recentTransactions: FinancialRecordResponse[]
}
