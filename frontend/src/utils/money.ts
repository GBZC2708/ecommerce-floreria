// src/utils/money.ts
const PEN_FORMATTER = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return 'S/ 0.00'
  // Esto devuelve algo tipo: "S/ 279.80"
  return PEN_FORMATTER.format(num)
}
