import { getCategoryById } from './categories.ts'
import type { Transaction, TransactionInput } from './types.ts'

export type TransactionValidationResult = {
  valid: boolean
  errors: Partial<Record<keyof TransactionInput, string>>
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function normalizeDate(date: string): string {
  return date.trim()
}

function ensureValidTransactionInput(input: TransactionInput): void {
  const result = validateTransactionInput(input)

  if (!result.valid) {
    throw new Error('\u4ea4\u6613\u6570\u636e\u65e0\u6548')
  }
}

export function validateTransactionInput(input: TransactionInput): TransactionValidationResult {
  const errors: Partial<Record<keyof TransactionInput, string>> = {}
  const category = getCategoryById(input.categoryId)
  const normalizedDate = normalizeDate(input.date)

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.amount = '\u91d1\u989d\u5fc5\u987b\u5927\u4e8e 0'
  }

  if (!normalizedDate || !DATE_PATTERN.test(normalizedDate)) {
    errors.date = '\u8bf7\u9009\u62e9\u65e5\u671f'
  }

  if (!category) {
    errors.categoryId = '\u8bf7\u9009\u62e9\u5206\u7c7b'
  } else if (category.type !== input.type) {
    errors.categoryId = '\u5206\u7c7b\u4e0e\u8d26\u5355\u7c7b\u578b\u4e0d\u5339\u914d'
  }

  if (input.note.length > 100) {
    errors.note = '\u5907\u6ce8\u4e0d\u80fd\u8d85\u8fc7 100 \u4e2a\u5b57\u7b26'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

export function createTransaction(input: TransactionInput, now = new Date().toISOString()): Transaction {
  ensureValidTransactionInput(input)
  const normalizedDate = normalizeDate(input.date)

  return {
    id: `tx_${now.replace(/\D/g, '')}_${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    amount: roundMoney(input.amount),
    categoryId: input.categoryId,
    date: normalizedDate,
    note: input.note.trim(),
    createdAt: now,
    updatedAt: now
  }
}

export function updateTransaction(
  existing: Transaction,
  input: TransactionInput,
  now = new Date().toISOString()
): Transaction {
  ensureValidTransactionInput(input)
  const normalizedDate = normalizeDate(input.date)

  return {
    ...existing,
    type: input.type,
    amount: roundMoney(input.amount),
    categoryId: input.categoryId,
    date: normalizedDate,
    note: input.note.trim(),
    updatedAt: now
  }
}
