import test from 'node:test'
import assert from 'node:assert/strict'
import { acquireScrollLock, releaseScrollLock } from '../app/utils/scroll-lock.mjs'

test('滚动锁定使用引用计数', () => {
  const previous = globalThis.document
  const body = { style: { overflow: '' } }
  globalThis.document = { body }

  acquireScrollLock()
  assert.equal(body.style.overflow, 'hidden')
  acquireScrollLock()
  assert.equal(body.style.overflow, 'hidden')

  releaseScrollLock()
  assert.equal(body.style.overflow, 'hidden')
  releaseScrollLock()
  assert.equal(body.style.overflow, '')

  releaseScrollLock()
  assert.equal(body.style.overflow, '')

  globalThis.document = previous
})
