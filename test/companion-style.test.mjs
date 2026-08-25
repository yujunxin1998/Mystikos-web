import test from 'node:test'
import assert from 'node:assert/strict'
import { companionAccent } from '../app/utils/companion-style.mjs'

test('相同陪玩始终获得相同的有效强调色', () => {
  assert.equal(companionAccent('star-field'), companionAccent('star-field'))
  assert.match(companionAccent('star-field'), /^hsl\(\d+ 72% 67%\)$/)
})
