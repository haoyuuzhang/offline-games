import { describe, expect, it } from 'vitest'
import { CATEGORIES, getCategoriesByType, getCategoryById } from '../../src/domain/categories.ts'
import { formatCurrency, formatDateKey, formatMonthKey } from '../../src/domain/format.ts'
import {
  createTransaction,
  updateTransaction,
  validateTransactionInput
} from '../../src/domain/transactions.ts'

describe('transaction validation', () => {
  it('rejects non-positive amounts', () => {
    const result = validateTransactionInput({
      type: 'expense',
      amount: 0,
      categoryId: 'expense-food',
      date: '2026-07-03',
      note: ''
    })

    expect(result.valid).toBe(false)
    expect(result.errors.amount).toBe('\u91d1\u989d\u5fc5\u987b\u5927\u4e8e 0')
  })

  it('rejects whitespace-only dates', () => {
    const result = validateTransactionInput({
      type: 'expense',
      amount: 10,
      categoryId: 'expense-food',
      date: '   ',
      note: ''
    })

    expect(result.valid).toBe(false)
    expect(result.errors.date).toBe('\u8bf7\u9009\u62e9\u65e5\u671f')
  })

  it('rejects non-YYYY-MM-DD dates', () => {
    const result = validateTransactionInput({
      type: 'expense',
      amount: 10,
      categoryId: 'expense-food',
      date: '2026/07/03',
      note: ''
    })

    expect(result.valid).toBe(false)
    expect(result.errors.date).toBe('\u8bf7\u9009\u62e9\u65e5\u671f')
  })

  it('rejects missing categories', () => {
    const result = validateTransactionInput({
      type: 'expense',
      amount: 10,
      categoryId: 'missing-category',
      date: '2026-07-03',
      note: ''
    })

    expect(result.valid).toBe(false)
    expect(result.errors.categoryId).toBe('\u8bf7\u9009\u62e9\u5206\u7c7b')
  })

  it('rejects notes longer than 100 characters', () => {
    const result = validateTransactionInput({
      type: 'expense',
      amount: 10,
      categoryId: 'expense-food',
      date: '2026-07-03',
      note: 'x'.repeat(101)
    })

    expect(result.valid).toBe(false)
    expect(result.errors.note).toBe('\u5907\u6ce8\u4e0d\u80fd\u8d85\u8fc7 100 \u4e2a\u5b57\u7b26')
  })

  it('rejects category type mismatch', () => {
    const result = validateTransactionInput({
      type: 'income',
      amount: 20,
      categoryId: 'expense-food',
      date: '2026-07-03',
      note: ''
    })

    expect(result.valid).toBe(false)
    expect(result.errors.categoryId).toBe('\u5206\u7c7b\u4e0e\u8d26\u5355\u7c7b\u578b\u4e0d\u5339\u914d')
  })
})

describe('transaction builders', () => {
  it('creates a valid transaction with rounded money and stable timestamps', () => {
    const tx = createTransaction(
      {
        type: 'expense',
        amount: 1.005,
        categoryId: CATEGORIES[0].id,
        date: '2026-07-03',
        note: '\u5348\u9910'
      },
      '2026-07-03T10:00:00.000Z'
    )

    expect(tx.id).toMatch(/^tx_/)
    expect(tx.amount).toBe(1.01)
    expect(tx.note).toBe('\u5348\u9910')
    expect(tx.createdAt).toBe('2026-07-03T10:00:00.000Z')
    expect(tx.updatedAt).toBe('2026-07-03T10:00:00.000Z')
  })

  it('rejects invalid create input', () => {
    expect(() =>
      createTransaction({
        type: 'expense',
        amount: 10,
        categoryId: CATEGORIES[0].id,
        date: '   ',
        note: ''
      })
    ).toThrowError('\u4ea4\u6613\u6570\u636e\u65e0\u6548')
  })

  it('updates a transaction with rounded money and preserved createdAt', () => {
    const existing = createTransaction(
      {
        type: 'expense',
        amount: 20,
        categoryId: CATEGORIES[0].id,
        date: '2026-07-03',
        note: '\u5348\u9910'
      },
      '2026-07-03T10:00:00.000Z'
    )

    const updated = updateTransaction(
      existing,
      {
        type: 'expense',
        amount: 2.675,
        categoryId: CATEGORIES[1].id,
        date: '2026-07-04',
        note: '\u665a\u9910'
      },
      '2026-07-04T10:00:00.000Z'
    )

    expect(updated.id).toBe(existing.id)
    expect(updated.createdAt).toBe(existing.createdAt)
    expect(updated.updatedAt).toBe('2026-07-04T10:00:00.000Z')
    expect(updated.amount).toBe(2.68)
    expect(updated.categoryId).toBe(CATEGORIES[1].id)
    expect(updated.date).toBe('2026-07-04')
    expect(updated.note).toBe('\u665a\u9910')
  })

  it('rejects invalid update input', () => {
    const existing = createTransaction(
      {
        type: 'expense',
        amount: 20,
        categoryId: CATEGORIES[0].id,
        date: '2026-07-03',
        note: '\u5348\u9910'
      },
      '2026-07-03T10:00:00.000Z'
    )

    expect(() =>
      updateTransaction(
        existing,
        {
          type: 'expense',
          amount: 10,
          categoryId: 'missing-category',
          date: '2026/07/04',
          note: ''
        },
        '2026-07-04T10:00:00.000Z'
      )
    ).toThrowError('\u4ea4\u6613\u6570\u636e\u65e0\u6548')
  })
})

describe('category helpers', () => {
  it('returns expense categories in sort order', () => {
    const expenseCategories = getCategoriesByType('expense')

    expect(expenseCategories.map((category) => category.type)).toEqual(
      Array.from({ length: expenseCategories.length }, () => 'expense')
    )
    expect(expenseCategories.map((category) => category.sortOrder)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
  })

  it('returns copies so callers cannot mutate the built-ins', () => {
    const category = getCategoryById('expense-food')

    expect(category?.name).toBe('\u9910\u996d')
    expect(category).toBeDefined()

    if (!category) {
      throw new Error('expected expense-food category')
    }

    category.name = 'mutated'

    expect(getCategoryById('expense-food')?.name).toBe('\u9910\u996d')

    const categories = getCategoriesByType('expense')
    categories[0].name = 'mutated again'

    expect(getCategoriesByType('expense')[0].name).toBe('\u9910\u996d')
  })
})

describe('format helpers', () => {
  it('formats currency and date keys', () => {
    expect(formatCurrency(1.005)).toBe('\uFFE51.01')
    expect(formatMonthKey(new Date(2026, 6, 3))).toBe('2026-07')
    expect(formatDateKey(new Date(2026, 6, 3))).toBe('2026-07-03')
  })
})
