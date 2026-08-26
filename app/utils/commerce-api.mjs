const positiveId = (value) => {
  if (typeof value === 'string') {
    const id = value.trim()
    if (/^[1-9]\d*$/.test(id)) return id
    throw new Error('商城资源 ID 无效')
  }
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('商城资源 ID 无效')
  return id
}

export function openCommerceCheckout(cartOpen, checkoutOpen) {
  cartOpen.value = false
  checkoutOpen.value = true
}

export function summarizeWishlist(items) {
  return {
    count: items.length,
    total: items.reduce((sum, item) => sum + Number(item.unitPrice || 0), 0)
  }
}

export async function requireCommerceLogin(authenticated, navigate) {
  if (authenticated) return true
  await navigate('/auth?redirect=/shop')
  return false
}

export function wishlistLoginRedirect() {
  return `/auth?redirect=${encodeURIComponent('/shop?openWishlist=1')}`
}

export function parseCreateOrderResponse(json) {
  const preserved = json.replace(/("data"\s*:\s*)(\d{16,})(\s*[,}])/, '$1"$2"$3')
  return JSON.parse(preserved)
}

export function createCommerceApi(request) {
  return {
    listProducts: async () => request('products'),
    getProduct: async (productId) => request(`products/${positiveId(productId)}`),
    getCart: async () => request('cart'),
    addToCart: async (productId, quantity = 1) => {
      const normalizedQuantity = Number(quantity)
      if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) throw new Error('商品数量必须大于 0')
      return request('cart', { method: 'POST', body: { productId: positiveId(productId), quantity: normalizedQuantity } })
    },
    removeFromCart: async (productId) => request(`cart/${positiveId(productId)}`, { method: 'DELETE' }),
    getWishlist: async () => request('wishlist'),
    addToWishlist: async (productId) => request('wishlist', { method: 'POST', body: { productId: positiveId(productId) } }),
    removeFromWishlist: async (productId) => request(`wishlist/${positiveId(productId)}`, { method: 'DELETE' }),
    createOrder: async (shippingAddress) => {
      const address = shippingAddress.trim()
      if (!address) throw new Error('请填写收货地址')
      return request('orders', { method: 'POST', body: { shippingAddress: address } })
    },
    getOrder: async (orderId) => request(`orders/${positiveId(orderId)}`),
    cancelOrder: async (orderId) => request(`orders/${positiveId(orderId)}/cancel`, { method: 'POST' }),
    requestPayment: async (orderId) => request(`orders/${positiveId(orderId)}/payment`, { method: 'POST' })
  }
}
