export const maskPhone = (value?: string | null) => {
  const compact = value?.replace(/\s+/g, '') || ''
  if (compact.length <= 7) return compact
  return `${compact.slice(0, 3)}••••${compact.slice(-4)}`
}

export const maskEmail = (value?: string | null) => {
  const [name = '', domain] = (value || '').split('@')
  if (!domain) return value || ''
  return `${name.slice(0, 2)}***@${domain}`
}
