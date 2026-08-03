export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export type FinishType = 'standard' | 'shiny-stones';
export type OrderMode = 'individual' | 'wholesale';

export function getSheetPrice(finish: FinishType, mode: OrderMode = 'individual') {
  if (mode === 'wholesale') {
    return finish === 'standard' ? 2000 : 2500;
  }
  return finish === 'standard' ? 3500 : 4000;
}
