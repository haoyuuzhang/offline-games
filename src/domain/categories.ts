import type { Category, TransactionType } from './types.ts'

export const CATEGORIES: readonly Category[] = [
  { id: 'expense-food', type: 'expense', name: '\u9910\u996d', icon: 'food', color: '#f97316', sortOrder: 10 },
  { id: 'expense-transport', type: 'expense', name: '\u4ea4\u901a', icon: 'bus', color: '#0ea5e9', sortOrder: 20 },
  { id: 'expense-shopping', type: 'expense', name: '\u8d2d\u7269', icon: 'bag', color: '#ec4899', sortOrder: 30 },
  { id: 'expense-housing', type: 'expense', name: '\u4f4f\u623f', icon: 'home', color: '#8b5cf6', sortOrder: 40 },
  { id: 'expense-entertainment', type: 'expense', name: '\u5a31\u4e50', icon: 'game', color: '#14b8a6', sortOrder: 50 },
  { id: 'expense-healthcare', type: 'expense', name: '\u533b\u7597', icon: 'heart', color: '#ef4444', sortOrder: 60 },
  { id: 'expense-education', type: 'expense', name: '\u6559\u80b2', icon: 'book', color: '#6366f1', sortOrder: 70 },
  { id: 'expense-social', type: 'expense', name: '\u4eba\u60c5', icon: 'gift', color: '#f59e0b', sortOrder: 80 },
  { id: 'expense-daily', type: 'expense', name: '\u751f\u6d3b', icon: 'leaf', color: '#22c55e', sortOrder: 90 },
  { id: 'expense-other', type: 'expense', name: '\u5176\u4ed6', icon: 'dots', color: '#64748b', sortOrder: 100 },
  { id: 'income-salary', type: 'income', name: '\u5de5\u8d44', icon: 'wallet', color: '#16a34a', sortOrder: 10 },
  { id: 'income-bonus', type: 'income', name: '\u5956\u91d1', icon: 'star', color: '#eab308', sortOrder: 20 },
  { id: 'income-side', type: 'income', name: '\u526f\u4e1a', icon: 'briefcase', color: '#0891b2', sortOrder: 30 },
  { id: 'income-investment', type: 'income', name: '\u7406\u8d22', icon: 'trend', color: '#7c3aed', sortOrder: 40 },
  { id: 'income-gift', type: 'income', name: '\u7ea2\u5305', icon: 'gift', color: '#dc2626', sortOrder: 50 },
  { id: 'income-other', type: 'income', name: '\u5176\u4ed6', icon: 'dots', color: '#64748b', sortOrder: 60 }
]

export function getCategoriesByType(type: TransactionType): Category[] {
  return CATEGORIES.filter((category) => category.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({ ...category }))
}

export function getCategoryById(categoryId: string): Category | undefined {
  const category = CATEGORIES.find((item) => item.id === categoryId)

  return category ? { ...category } : undefined
}
