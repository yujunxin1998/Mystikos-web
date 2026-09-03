import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('陪玩目录的筛选工具栏可换行，吸顶偏移为视口顶部', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-public.css', import.meta.url), 'utf8')

  assert.match(css, /\.directory-toolbar\s*\{[^}]*top:0/)
  assert.doesNotMatch(css, /\.directory-toolbar\s*\{[^}]*top:82px/)
  assert.match(css, /\.directory-filters\s*\{[^}]*flex-wrap:wrap/)
  assert.match(css, /\.directory-search span\{[^}]*top:50%/)
  assert.match(css, /\.directory-search input\{[^}]*line-height:1\.25|\.directory-search input\{[^}]*\/1\.25/)
})

test('陪玩卡片使用按用户区分的视觉强调色', async () => {
  const source = await readFile(new URL('../app/pages/companions/index.vue', import.meta.url), 'utf8')

  assert.match(source, /--companion-accent.*companionAccent\(person\.userId\)/)
})
