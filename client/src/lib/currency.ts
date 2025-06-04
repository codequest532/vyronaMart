// Currency utility functions for Indian Rupees
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatCurrencyFromCents(cents: number): string {
  const rupees = cents / 100;
  return formatCurrency(rupees);
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[₹,]/g, '')) || 0;
}

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';