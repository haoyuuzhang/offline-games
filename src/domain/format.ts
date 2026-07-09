function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function formatCurrency(amount: number): string {
  return `\uFFE5${roundMoney(amount).toFixed(2)}`
}

export function formatMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
