import { createBookingApi } from '../utils/booking-api.mjs'
import type { PaymentCheckout, PaymentProvider, PaymentScene } from './useCommerceApi'
import type { PageResult } from './useCompanionShowcaseApi'

export type BookingId = number | string
export type BookingStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'MATCHING' | 'ACCEPTED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'DISPUTED' | 'REFUNDED'
export type BookingOrderView = {
  id: BookingId
  companionId: BookingId
  start: string
  end: string
  durationHours: number
  priceSnapshot: number
  status: BookingStatus
  createdAt: string
  expiresAt: string | null
}
export type BookingCartLineView = {
  id: BookingId
  companionId: BookingId
  start: string
  end: string
  durationHours: number
  estimatedPrice: number
  companionBookable: boolean
}
export type BookingGroupStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED' | 'CANCELLED'
export type BookingOrderGroupView = {
  id: BookingId
  status: BookingGroupStatus
  totalAmount: number
  createdAt: string
  expiresAt: string | null
  bookings: BookingOrderView[]
}
export function useBookingApi() {
  const { request: authedRequest } = useAuthedApi()
  const request = <T>(path: string, options: Record<string, unknown> = {}) => authedRequest<T>(path, options, '预约请求失败')

  return createBookingApi(request) as {
    createBooking(companionId: number, start: string, durationHours: number): Promise<string>
    getBooking(bookingId: BookingId): Promise<BookingOrderView>
    listMyBookings(pageNum?: number, pageSize?: number): Promise<PageResult<BookingOrderView>>
    requestBookingPayment(bookingId: BookingId, provider: PaymentProvider, scene?: PaymentScene): Promise<PaymentCheckout>
    cancelBooking(bookingId: BookingId): Promise<void>

    listBookingCart(): Promise<BookingCartLineView[]>
    addBookingCartLine(companionId: number, start: string, durationHours: number): Promise<string>
    removeBookingCartLine(lineId: BookingId): Promise<void>
    checkoutBookingCart(lineIds: BookingId[]): Promise<string>

    getBookingGroup(groupId: BookingId): Promise<BookingOrderGroupView>
    requestGroupPayment(groupId: BookingId, provider: PaymentProvider, scene?: PaymentScene): Promise<PaymentCheckout>
    cancelGroup(groupId: BookingId): Promise<void>
  }
}
