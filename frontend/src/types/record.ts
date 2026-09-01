export type TransactionType = 'INCOME' | 'EXPENSE'

export interface FinancialRecordResponse {
  id: number
  amount: number
  type: string
  category: string
  date: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
  userId: number
  userName?: string | null
  userEmail?: string | null
}

export interface FinancialRecordRequest {
  amount: number
  type: TransactionType
  category: string
  date: string
  description?: string
}

export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}
