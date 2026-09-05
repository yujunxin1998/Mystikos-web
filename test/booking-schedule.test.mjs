import assert from 'node:assert/strict'
import test from 'node:test'

let scheduleTools = {}
try {
  scheduleTools = await import('../app/utils/booking-schedule.mjs')
} catch {
  // RED 阶段允许目标模块尚不存在；断言会明确指出缺失的行为。
}

const {
  bookingScheduleIssue,
  bookingScheduleSummary,
  defaultBookingSchedule,
  listBookingDates,
  suggestBookingTimes
} = scheduleTools

test('默认点单时间至少提前十五分钟并向上对齐半小时', () => {
  assert.equal(typeof defaultBookingSchedule, 'function')
  assert.deepEqual(defaultBookingSchedule(new Date(2026, 8, 5, 13, 10)), {
    date: '2026-09-05',
    time: '13:30'
  })
  assert.deepEqual(defaultBookingSchedule(new Date(2026, 8, 5, 23, 50)), {
    date: '2026-09-06',
    time: '00:30'
  })
})

test('快捷日期覆盖今天到后天且不受 UTC 日期偏移影响', () => {
  assert.equal(typeof listBookingDates, 'function')
  assert.deepEqual(listBookingDates(new Date(2026, 8, 5, 22, 0)), [
    '2026-09-05',
    '2026-09-06',
    '2026-09-07'
  ])
})

test('快捷时间从最近可点单的半小时开始且不会跨到下一天', () => {
  assert.equal(typeof suggestBookingTimes, 'function')
  assert.deepEqual(suggestBookingTimes('2026-09-05', new Date(2026, 8, 5, 13, 10)), ['13:30', '14:00', '14:30', '15:00'])
  assert.deepEqual(suggestBookingTimes('2026-09-06', new Date(2026, 8, 5, 13, 10)), ['18:00', '18:30', '19:00', '19:30'])
  assert.deepEqual(suggestBookingTimes('2026-09-05', new Date(2026, 8, 5, 23, 20)), [])
})

test('点单时间缺失、非法或不足十五分钟时会在提交前拦截', () => {
  assert.equal(typeof bookingScheduleIssue, 'function')
  const now = new Date(2026, 8, 5, 13, 10)
  assert.equal(bookingScheduleIssue('', '', now), 'missing')
  assert.equal(bookingScheduleIssue('2026-09-05', '99:99', now), 'invalid')
  assert.equal(bookingScheduleIssue('2026-09-05', '13:20', now), 'too-soon')
  assert.equal(bookingScheduleIssue('2026-09-05', '13:30', now), null)
})

test('点单摘要给出明确的起止时间并标识跨日', () => {
  assert.equal(typeof bookingScheduleSummary, 'function')
  assert.deepEqual(bookingScheduleSummary('2026-09-05', '20:30', 2), {
    start: new Date(2026, 8, 5, 20, 30),
    startDate: '2026-09-05',
    startTime: '20:30',
    endDate: '2026-09-05',
    endTime: '22:30',
    crossesDay: false
  })
  assert.deepEqual(bookingScheduleSummary('2026-09-05', '23:30', 2), {
    start: new Date(2026, 8, 5, 23, 30),
    startDate: '2026-09-05',
    startTime: '23:30',
    endDate: '2026-09-06',
    endTime: '01:30',
    crossesDay: true
  })
})
