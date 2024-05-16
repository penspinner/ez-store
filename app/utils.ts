const currencyFormatter = new Intl.NumberFormat('en-us', { style: 'currency', currency: 'USD' })

export function formatMoney(amount: number) {
  return currencyFormatter.format(amount)
}

const dateFormatter = new Intl.DateTimeFormat('en-us')

export function formatDate(date: Date) {
  return dateFormatter.format(date)
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
