import { createCommerceApi } from '../utils/commerce-api.mjs'

export type ProductView = { id: number; categoryId: number; name: string; description: string; price: number; images: string[] }
export type CartLine = { productId: number; productName: string; unitPrice: number; quantity: number; subtotal: number }
export type WishlistLine = { productId: number; productName: string; unitPrice: number; addedAt: string }
export type OrderLine = { productId: number; productNameSnapshot: string; unitPriceSnapshot: number; quantity: number; subtotal: number }
export type CommerceId = number | string
export type CommerceOrder = { orderId: CommerceId; patronId: CommerceId; items: OrderLine[]; totalAmount: number; shippingAddress: string; status: string; createdAt: string; expiresAt: string | null }
export type PaymentProvider = 'STRIPE' | 'ALIPAY' | 'WECHAT_PAY'
export type PaymentScene = 'DEFAULT' | 'PC_QR' | 'WAP_H5' | 'APP'
export type PaymentCheckout = { intentId: number; payloadType: string; payload: Record<string, string>; status: string }
export type AddressType = 'DOMESTIC' | 'OVERSEAS'
export type AddressPayload = {
  addressType: AddressType
  recipientName: string
  phone: string
  countryCode: string
  provinceCode?: string | null
  city?: string | null
  district?: string | null
  addressLine1: string
  addressLine2?: string | null
  stateRegion?: string | null
  postalCode?: string | null
  setDefault: boolean
}
export type Address = AddressPayload & { id: number; isDefault: boolean }

export function useCommerceApi() {
  const { request: authedRequest } = useAuthedApi()
  const request = <T>(path: string, options: Record<string, unknown> = {}) => authedRequest<T>(path, options, '商城请求失败')

  return createCommerceApi(request) as {
    listProducts(): Promise<ProductView[]>
    getProduct(productId: number): Promise<ProductView>
    getCart(): Promise<CartLine[]>
    addToCart(productId: number, quantity?: number): Promise<void>
    removeFromCart(productId: number): Promise<void>
    getWishlist(): Promise<WishlistLine[]>
    addToWishlist(productId: number): Promise<void>
    removeFromWishlist(productId: number): Promise<void>
    createOrder(productIds: number[], addressId: number): Promise<string>
    buyNow(productId: number, quantity: number, addressId: number): Promise<string>
    getOrder(orderId: CommerceId): Promise<CommerceOrder>
    cancelOrder(orderId: CommerceId): Promise<void>
    requestPayment(orderId: CommerceId, provider: PaymentProvider, scene?: PaymentScene): Promise<PaymentCheckout>
    listAddresses(): Promise<Address[]>
    createAddress(payload: AddressPayload): Promise<number>
    updateAddress(addressId: number, payload: AddressPayload): Promise<void>
    removeAddress(addressId: number): Promise<void>
    setDefaultAddress(addressId: number): Promise<void>
  }
}
