const pad = value => String(value).padStart(2, '0')

const localDateValue = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const localTimeValue = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`

const parseLocalStart = (dateValue, timeValue) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue || '')
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue || '')
  if (!dateMatch || !timeMatch) return null
  const [, year, month, day] = dateMatch.map(Number)
  const [, hours, minutes] = timeMatch.map(Number)
  if (hours > 23 || minutes > 59) return null
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (
    start.getFullYear() !== year
    || start.getMonth() !== month - 1
    || start.getDate() !== day
    || start.getHours() !== hours
    || start.getMinutes() !== minutes
  ) return null
  return start
}

export const defaultBookingSchedule = (now = new Date()) => {
  const start = new Date(now.getTime() + 15 * 60_000)
  start.setSeconds(0, 0)
  const remainder = start.getMinutes() % 30
  if (remainder) start.setMinutes(start.getMinutes() + 30 - remainder)
  return { date: localDateValue(start), time: localTimeValue(start) }
}

export const listBookingDates = (now = new Date(), count = 3) => Array.from({ length: count }, (_, index) => {
  const date = new Date(now)
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + index)
  return localDateValue(date)
})

export const suggestBookingTimes = (dateValue, now = new Date(), count = 4) => {
  const today = localDateValue(now)
  if (dateValue < today) return []
  let firstMinutes = 18 * 60
  if (dateValue === today) {
    const first = defaultBookingSchedule(now)
    if (first.date !== dateValue) return []
    const [hours, minutes] = first.time.split(':').map(Number)
    firstMinutes = hours * 60 + minutes
  }
  return Array.from({ length: count }, (_, index) => firstMinutes + index * 30)
    .filter(minutes => minutes < 24 * 60)
    .map(minutes => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`)
}

export const bookingScheduleSummary = (dateValue, timeValue, durationHours) => {
  const start = parseLocalStart(dateValue, timeValue)
  const duration = Number(durationHours)
  if (!start || !Number.isFinite(duration) || duration <= 0) return null
  const end = new Date(start.getTime() + duration * 60 * 60_000)
  const startDate = localDateValue(start)
  const endDate = localDateValue(end)
  return {
    start,
    startDate,
    startTime: localTimeValue(start),
    endDate,
    endTime: localTimeValue(end),
    crossesDay: startDate !== endDate
  }
}

export const bookingScheduleIssue = (dateValue, timeValue, now = new Date()) => {
  if (!dateValue || !timeValue) return 'missing'
  const summary = bookingScheduleSummary(dateValue, timeValue, 1)
  if (!summary) return 'invalid'
  if (summary.start.getTime() < now.getTime() + 15 * 60_000) return 'too-soon'
  return null
}
