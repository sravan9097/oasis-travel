/**
 * Format number as Indian Rupees
 */
export const formatINR = (amount: number, showDecimals: boolean = false): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

/**
 * Format number as currency (generic)
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Round money to 2 decimal places
 */
export const roundMoney = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Calculate percentage of amount
 */
export const percentage = (amount: number, percent: number): number => {
  return roundMoney((amount * percent) / 100);
};

/**
 * Add GST (18% in India)
 */
export const addGST = (amount: number, gstRate: number = 18): number => {
  return roundMoney(amount + percentage(amount, gstRate));
};

/**
 * Format large numbers with K/M suffixes
 */
export const formatCompact = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

