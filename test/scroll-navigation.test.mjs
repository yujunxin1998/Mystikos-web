import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldShowBackToTop } from '../app/utils/scroll-navigation.mjs'

test('滚动距离超过阈值后显示回到顶部按钮', () => {
  assert.equal(shouldShowBackToTop(500), false)
  assert.equal(shouldShowBackToTop(501), true)
})
