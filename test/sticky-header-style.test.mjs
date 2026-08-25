import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('顶部导航使用固定定位，不随页面滚动', async () => {
  const css = await readFile(new URL('../app/assets/css/main.css', import.meta.url), 'utf8')
  assert.match(css, /\.site-header\s*\{[^}]*position:fixed/)
  assert.match(css, /\.site-shell:not\(\.is-auth-route\) main\s*\{[^}]*padding-top:82px/)
})
