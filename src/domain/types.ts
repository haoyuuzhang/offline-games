export type TransactionType = 'expense' | 'income'

export type Category = {
  id: string
  type: TransactionType
  name: string
  icon: string
  color: string
  sortOrder: number
}

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  date: string
  note: string
  createdAt: string
  updatedAt: string
}

export type TransactionInput = {
  type: TransactionType
  amount: number
  categoryId: string
  date: string
  note: string
}
