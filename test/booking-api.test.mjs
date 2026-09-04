import test from 'node:test'
import assert from 'node:assert/strict'
import { createBookingApi, bookingCartLoginRedirect, requireBookingLogin } from '../app/utils/booking-api.mjs'

test('点单客户端按 OpenAPI 契约发送单条点单、点单车和点单组请求', async () => {
  const calls = []
  const request = async (path, options = {}) => {
    calls.push({ path, options })
    return null
  }
  const api = createBookingApi(request)

  await api.createBooking(501, '2026-09-01T10:00:00Z', 2)
  await api.getBooking(88)
  await api.listMyBookings()
  await api.listMyBookings(2, 10)
  await api.requestBookingPayment(88, 'ALIPAY', 'PC_QR')
  await api.cancelBooking(88)
  await api.listBookingCart()
  await api.addBookingCartLine(501, '2026-09-01T10:00:00Z', 2)
  await api.removeBookingCartLine(10)
  await api.checkoutBookingCart([10, 11])
  await api.getBookingGroup(400)
  await api.requestGroupPayment(400, 'WECHAT_PAY', 'WAP_H5')
  await api.cancelGroup(400)

  assert.deepEqual(calls, [
    { path: 'bookings', options: { method: 'POST', body: { companionId: 501, start: '2026-09-01T10:00:00Z', durationHours: 2 } } },
    { path: 'bookings/88', options: {} },
    { path: 'bookings?pageNum=1&pageSize=20', options: {} },
    { path: 'bookings?pageNum=2&pageSize=10', options: {} },
    { path: 'bookings/88/payment', options: { method: 'POST', body: { provider: 'ALIPAY', scene: 'PC_QR' } } },
    { path: 'bookings/88/cancel', options: { method: 'POST' } },
    { path: 'booking-cart', options: {} },
    { path: 'booking-cart', options: { method: 'POST', body: { companionId: 501, start: '2026-09-01T10:00:00Z', durationHours: 2 } } },
    { path: 'booking-cart/10', options: { method: 'DELETE' } },
    { path: 'booking-cart/checkout', options: { method: 'POST', body: { lineIds: [10, 11] } } },
    { path: 'booking-groups/400', options: {} },
    { path: 'booking-groups/400/payment', options: { method: 'POST', body: { provider: 'WECHAT_PAY', scene: 'WAP_H5' } } },
    { path: 'booking-groups/400/cancel', options: { method: 'POST' } }
  ])
})

test('点单客户端在发请求前拒绝无效 ID 和空的结算选择', async () => {
  const api = createBookingApi(async () => assert.fail('invalid input must not make a request'))

  await assert.rejects(() => api.getBooking(0), /ID/)
  await assert.rejects(() => api.checkoutBookingCart([]), /点单/)
  await assert.rejects(() => api.removeBookingCartLine(-1), /ID/)
})

test('雪花点单/组ID在各路径中保持原始精度', async () => {
  const paths = []
  const api = createBookingApi(async path => { paths.push(path) })
  const bookingId = '2092533063002484700'
  const groupId = '2092533063002484701'

  await api.getBooking(bookingId)
  await api.requestBookingPayment(bookingId, 'STRIPE')
  await api.getBookingGroup(groupId)
  await api.checkoutBookingCart([bookingId])

  assert.deepEqual(paths, [
    'bookings/2092533063002484700',
    'bookings/2092533063002484700/payment',
    'booking-groups/2092533063002484701',
    'booking-cart/checkout'
  ])
})

test('未登录点单操作跳转登录并停止后续请求', async () => {
  let destination = ''
  const allowed = await requireBookingLogin(false, async path => { destination = path })

  assert.equal(allowed, false)
  assert.equal(destination, '/auth?redirect=/companions')
  assert.equal(await requireBookingLogin(true, async () => assert.fail('logged-in user must not redirect')), true)
})

test('点单车登录回跳使用可清除的一次性标记', () => {
  assert.equal(bookingCartLoginRedirect(), '/auth?redirect=%2Fcompanions%3FopenBookingCart%3D1')
})
