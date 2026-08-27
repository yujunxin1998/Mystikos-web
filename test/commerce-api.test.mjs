import test from 'node:test'
import assert from 'node:assert/strict'
import { createCommerceApi, openCommerceCheckout, parseCreateOrderResponse, requireCommerceLogin, summarizeWishlist, wishlistLoginRedirect } from '../app/utils/commerce-api.mjs'

test('商城客户端按 OpenAPI 契约发送全部商品、购物车、心愿单和订单请求', async () => {
  const calls = []
  const request = async (path, options = {}) => {
    calls.push({ path, options })
    return path.includes('payment') ? { clientSecret: 'secret' } : null
  }
  const api = createCommerceApi(request)

  await api.listProducts()
  await api.getProduct(12)
  await api.getCart()
  await api.addToCart(12, 2)
  await api.removeFromCart(12)
  await api.getWishlist()
  await api.addToWishlist(12)
  await api.removeFromWishlist(12)
  await api.createOrder('浙江省杭州市西湖区')
  await api.getOrder(88)
  await api.cancelOrder(88)
  await api.requestPayment(88)

  assert.deepEqual(calls, [
    { path: 'products', options: {} },
    { path: 'products/12', options: {} },
    { path: 'cart', options: {} },
    { path: 'cart', options: { method: 'POST', body: { productId: 12, quantity: 2 } } },
    { path: 'cart/12', options: { method: 'DELETE' } },
    { path: 'wishlist', options: {} },
    { path: 'wishlist', options: { method: 'POST', body: { productId: 12 } } },
    { path: 'wishlist/12', options: { method: 'DELETE' } },
    { path: 'orders', options: { method: 'POST', body: { shippingAddress: '浙江省杭州市西湖区' } } },
    { path: 'orders/88', options: {} },
    { path: 'orders/88/cancel', options: { method: 'POST' } },
    { path: 'orders/88/payment', options: { method: 'POST' } }
  ])
})

test('商城客户端在发请求前拒绝无效数量、ID 和空收货地址', async () => {
  const api = createCommerceApi(async () => assert.fail('invalid input must not make a request'))

  await assert.rejects(() => api.addToCart(3, 0), /数量/)
  await assert.rejects(() => api.getProduct(0), /ID/)
  await assert.rejects(() => api.createOrder('   '), /收货地址/)
})

test('从购物车进入结算时关闭购物车遮罩并打开结算弹窗', () => {
  const cartOpen = { value: true }
  const checkoutOpen = { value: false }

  openCommerceCheckout(cartOpen, checkoutOpen)

  assert.equal(cartOpen.value, false)
  assert.equal(checkoutOpen.value, true)
})

test('心愿单汇总返回商品总数和后端单价总额', () => {
  const summary = summarizeWishlist([
    { productId: 1, unitPrice: 89 },
    { productId: 2, unitPrice: 39 },
    { productId: 3, unitPrice: 199 }
  ])

  assert.deepEqual(summary, { count: 3, total: 327 })
})

test('未登录商城操作跳转登录并停止后续请求', async () => {
  let destination = ''
  const allowed = await requireCommerceLogin(false, async path => { destination = path })

  assert.equal(allowed, false)
  assert.equal(destination, '/auth?redirect=/shop')
  assert.equal(await requireCommerceLogin(true, async () => assert.fail('logged-in user must not redirect')), true)
})

test('心愿单登录回跳使用可清除的一次性标记而不是持久 hash', () => {
  assert.equal(wishlistLoginRedirect(), '/auth?redirect=%2Fshop%3FopenWishlist%3D1')
})

test('雪花订单号在详情、取消和支付路径中保持原始精度', async () => {
  const paths = []
  const api = createCommerceApi(async path => { paths.push(path) })
  const orderId = '2092533063002484700'

  await api.getOrder(orderId)
  await api.cancelOrder(orderId)
  await api.requestPayment(orderId)

  assert.deepEqual(paths, [
    'orders/2092533063002484700',
    'orders/2092533063002484700/cancel',
    'orders/2092533063002484700/payment'
  ])
})

test('创建订单响应在 JSON 解析前把超长 Long 转成字符串', () => {
  const response = parseCreateOrderResponse('{"code":200,"message":"ok","data":2092533063002484700}')

  assert.deepEqual(response, { code: 200, message: 'ok', data: '2092533063002484700' })
})
