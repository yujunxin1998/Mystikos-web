import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldCloseProfileMenu } from '../app/utils/profile-menu.mjs'

test('点击头像和菜单内部时保持账户菜单打开', () => {
  const trigger = { contains: (node) => node === 'trigger' }
  const menu = { contains: (node) => node === 'menu-item' }

  assert.equal(shouldCloseProfileMenu('trigger', trigger, menu), false)
  assert.equal(shouldCloseProfileMenu('menu-item', trigger, menu), false)
})

test('点击账户菜单外部时关闭菜单', () => {
  const trigger = { contains: () => false }
  const menu = { contains: () => false }

  assert.equal(shouldCloseProfileMenu('outside', trigger, menu), true)
})
