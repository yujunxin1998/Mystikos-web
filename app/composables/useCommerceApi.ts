import { createCommerceApi } from '../utils/commerce-api.mjs'

export type ProductView = { id: number; categoryId: number; name: string; description: string; price: number; images: string[] }
export type CartLine = { productId: number; productName: string; unitPrice: number; quantity: number; subtotal: number }
export type WishlistLine = { productId: number; productName: string; unitPrice: number; addedAt: string }
export type OrderLine = { productId: number; productNameSnapshot: string; unitPriceSnapshot: number; quantity: number; subtotal: number }
export type CommerceId = number | string
export type CommerceOrder = { orderId: CommerceId; patronId: CommerceId; items: OrderLine[]; totalAmount: number; shippingAddress: string; status: string; createdAt: string }
export type PaymentCheckout = { intentId: number; clientSecret: string; status: string }

type ApiResponse<T> = { code: number; message?: string; data: T | null }

export function useCommerceApi() {
  const { accessToken } = useDemoAuth()
  const request = async <T>(path: string, options: Record<string, unknown> = {}) => {
    const response = await $fetch<ApiResponse<T>>(`/api/auth-proxy/${path}`, {
      ...options,
      ignoreResponseError: true,
      headers: { authorization: `Bearer ${accessToken.value}`, ...((options.headers as object) || {}) }
    })
    if (!response || response.code !== 200) throw new Error(response?.message || '商城请求失败')
    return response.data as T
  }

  return createCommerceApi(request) as {
    listProducts(): Promise<ProductView[]>
    getProduct(productId: number): Promise<ProductView>
    getCart(): Promise<CartLine[]>
    addToCart(productId: number, quantity?: number): Promise<void>
    removeFromCart(productId: number): Promise<void>
    getWishlist(): Promise<WishlistLine[]>
    addToWishlist(productId: number): Promise<void>
    removeFromWishlist(productId: number): Promise<void>
    createOrder(shippingAddress: string): Promise<string>
    getOrder(orderId: CommerceId): Promise<CommerceOrder>
    cancelOrder(orderId: CommerceId): Promise<void>
    requestPayment(orderId: CommerceId): Promise<PaymentCheckout>
  }
}
