export const getCurrencySymbol = (currency: string = 'INR') => {
  const symbols: Record<string, string> = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  }
  return symbols[currency] || currency
}

export const formatPrice = (price: number, currency: string = 'INR') => {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${price.toLocaleString()}`
}
