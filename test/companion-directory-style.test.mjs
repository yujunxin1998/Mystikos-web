import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('陪玩目录的筛选工具栏可换行且避开固定顶部导航', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-public.css', import.meta.url), 'utf8')

  assert.match(css, /\.directory-toolbar\s*\{[^}]*top:82px/)
  assert.match(css, /\.directory-filters\s*\{[^}]*flex-wrap:wrap/)
})

test('陪玩卡片使用按用户区分的视觉强调色', async () => {
  const source = await readFile(new URL('../app/pages/companions/index.vue', import.meta.url), 'utf8')

  assert.match(source, /--companion-accent.*companionAccent\(person\.userId\)/)
})
