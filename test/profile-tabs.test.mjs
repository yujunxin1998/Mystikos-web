import test from 'node:test'
import assert from 'node:assert/strict'

const profileTabs = await import('../app/utils/profile-tabs.mjs').catch(() => ({
  normalizeProfileTab: () => undefined,
  profileTabLocation: () => undefined,
  profileTabAriaCurrent: () => undefined,
  profileRootClasses: () => undefined
}))

test('个人中心仅接受四个已知页签并为无效值回退到资料页', () => {
  assert.equal(profileTabs.normalizeProfileTab('security'), 'security')
  assert.equal(profileTabs.normalizeProfileTab('orders'), 'orders')
  assert.equal(profileTabs.normalizeProfileTab('wallet'), 'wallet')
  assert.equal(profileTabs.normalizeProfileTab('unexpected'), 'profile')
  assert.equal(profileTabs.normalizeProfileTab(undefined), 'profile')
})

test('页签导航保留现有查询参数', () => {
  assert.deepEqual(
    profileTabs.profileTabLocation('security', { complete: 'contact' }),
    { path: '/profile', query: { complete: 'contact', tab: 'security' }, hash: '' }
  )
  assert.deepEqual(
    profileTabs.profileTabLocation('profile', { tab: 'orders', source: 'menu' }),
    { path: '/profile', query: { source: 'menu' }, hash: '' }
  )
})

test('当前页签使用导航语义而不是不完整的 ARIA tab 语义', () => {
  assert.equal(profileTabs.profileTabAriaCurrent('orders', 'orders'), 'page')
  assert.equal(profileTabs.profileTabAriaCurrent('wallet', 'orders'), undefined)
})

test('资格提示打开时提升个人中心层叠上下文', () => {
  assert.deepEqual(profileTabs.profileRootClasses(false), { 'has-modal': false })
  assert.deepEqual(profileTabs.profileRootClasses(true), { 'has-modal': true })
})
