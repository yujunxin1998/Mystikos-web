import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('账户菜单会在页面滚动时关闭并清理监听', async () => {
  const source = await readFile(new URL('../app/components/SiteHeader.vue', import.meta.url), 'utf8')

  assert.match(source, /const handleDocumentScroll = \(\) => \{ closeProfileMenu\(\) \}/)
  assert.match(source, /document\.addEventListener\('scroll', handleDocumentScroll, \{ passive: true \}\)/)
  assert.match(source, /document\.removeEventListener\('scroll', handleDocumentScroll\)/)
})
