export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCurrencyForCard = (value: number): string => {
  const absValue = Math.abs(value);
  let minimumFractionDigits = 2;
  let maximumFractionDigits = 2;

  // If absolute value is 1000 or greater, remove decimals
  if (absValue >= 1000) {
    minimumFractionDigits = 0;
    maximumFractionDigits = 0;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: maximumFractionDigits,
    // Optional: add compact notation for very large numbers (M, B, etc.)
    // notation: absValue >= 1_000_000 ? 'compact' : undefined,
  }).format(value);
};

// Add an empty export to make this file a module
export {}; 