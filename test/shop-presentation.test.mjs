import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const presentation = await import('../app/utils/shop-presentation.mjs').catch(() => ({}))

test('商品图片缺失时返回站内占位图，并保留首个有效图片地址', () => {
  assert.equal(presentation.productImageSource?.([]), '/images/product-placeholder.svg')
  assert.equal(presentation.productImageSource?.(['  ', 'https://cdn.example.com/product.webp']), 'https://cdn.example.com/product.webp')
})

test('商品图片加载失败时只回退一次，避免占位图失败后重复触发', () => {
  const target = { src: 'https://cdn.example.com/missing.webp', onerror: () => {} }

  assert.equal(presentation.recoverProductImage?.({ currentTarget: target }), true)
  assert.equal(target.src, '/images/product-placeholder.svg')
  assert.equal(target.onerror, null)
  assert.equal(presentation.recoverProductImage?.({ currentTarget: target }), false)
})

test('商品占位图位于 Nuxt 公共目录，可由回退地址直接访问', async () => {
  const svg = await readFile(new URL('../public/images/product-placeholder.svg', import.meta.url), 'utf8').catch(() => '')
  assert.match(svg, /<svg[\s>]/)
})

test('商品列表失败提供重试，其他商城操作失败只提供关闭提示', () => {
  assert.deepEqual(presentation.shopErrorPresentation?.(true), {
    title: '暂时无法连接商城',
    action: 'retry'
  })
  assert.deepEqual(presentation.shopErrorPresentation?.(false), {
    title: '操作未完成',
    action: 'dismiss'
  })
})

test('商城弹层焦点在首尾之间循环', () => {
  assert.equal(presentation.dialogFocusIndex?.(2, 3, false), 0)
  assert.equal(presentation.dialogFocusIndex?.(0, 3, true), 2)
  assert.equal(presentation.dialogFocusIndex?.(-1, 3, false), 0)
  assert.equal(presentation.dialogFocusIndex?.(0, 0, false), -1)
})

test('商城弹层共享控件样式全部限制在商城遮罩内', async () => {
  const css = await readFile(new URL('../app/assets/css/shop.css', import.meta.url), 'utf8')
  const sharedClasses = ['product-modal-backdrop', 'commerce-drawer-backdrop', 'product-modal', 'checkout-modal', 'commerce-drawer', 'quantity-stepper', 'cart-select-all', 'cart-line-checkbox', 'cart-lines', 'address-picker', 'address-picker-option', 'address-manage-link']
  const selectors = [...css.matchAll(/(^|\n)([^@\n][^{}]*)\{/g)].map(match => match[2].trim())
  const leaked = selectors.filter(selector => sharedClasses.some(name => selector.includes(`.${name}`)) && !selector.includes('.shop-overlay'))
  assert.deepEqual(leaked, [])
})

test('弹层内商城操作失败时把错误提示显示在遮罩上方', () => {
  assert.equal(presentation.shopErrorSurface?.('', false, 'cart'), 'none')
  assert.equal(presentation.shopErrorSurface?.('商品加载失败', true, ''), 'page')
  assert.equal(presentation.shopErrorSurface?.('创建订单失败', false, 'checkout'), 'overlay')
  assert.equal(presentation.shopErrorSurface?.('心愿单更新失败', false, ''), 'page')
})

test('商品目录可用时忽略登录附属数据预加载失败', () => {
  assert.equal(presentation.shouldIgnoreMemberCommercePreloadError?.(true), true)
  assert.equal(presentation.shouldIgnoreMemberCommercePreloadError?.(false), false)
})
