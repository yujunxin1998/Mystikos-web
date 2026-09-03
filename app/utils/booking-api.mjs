const positiveId = (value) => {
  if (typeof value === 'string') {
    const id = value.trim()
    if (/^[1-9]\d*$/.test(id)) return id
    throw new Error('点单资源 ID 无效')
  }
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('点单资源 ID 无效')
  return id
}

export async function requireBookingLogin(authenticated, navigate) {
  if (authenticated) return true
  await navigate('/auth?redirect=/companions')
  return false
}

export function createBookingApi(request) {
  return {
    createBooking: async (companionId, start, durationHours) =>
      request('bookings', { method: 'POST', body: { companionId: positiveId(companionId), start, durationHours } }),
    getBooking: async (bookingId) => request(`bookings/${positiveId(bookingId)}`),
    listMyBookings: async (pageNum = 1, pageSize = 20) => request(`bookings?pageNum=${pageNum}&pageSize=${pageSize}`),
    requestBookingPayment: async (bookingId, provider, scene) =>
      request(`bookings/${positiveId(bookingId)}/payment`, { method: 'POST', body: { provider, scene } }),
    cancelBooking: async (bookingId) => request(`bookings/${positiveId(bookingId)}/cancel`, { method: 'POST' }),

    listBookingCart: async () => request('booking-cart'),
    addBookingCartLine: async (companionId, start, durationHours) =>
      request('booking-cart', { method: 'POST', body: { companionId: positiveId(companionId), start, durationHours } }),
    removeBookingCartLine: async (lineId) => request(`booking-cart/${positiveId(lineId)}`, { method: 'DELETE' }),
    checkoutBookingCart: async (lineIds) => {
      if (!Array.isArray(lineIds) || !lineIds.length) throw new Error('请至少选择一条点单')
      return request('booking-cart/checkout', { method: 'POST', body: { lineIds: lineIds.map(positiveId) } })
    },

    getBookingGroup: async (groupId) => request(`booking-groups/${positiveId(groupId)}`),
    requestGroupPayment: async (groupId, provider, scene) =>
      request(`booking-groups/${positiveId(groupId)}/payment`, { method: 'POST', body: { provider, scene } }),
    cancelGroup: async (groupId) => request(`booking-groups/${positiveId(groupId)}/cancel`, { method: 'POST' })
  }
}
