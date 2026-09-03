import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { MYSTIKOS_API_BASE } from '../config/backend.config.mjs'

const require = createRequire(import.meta.url)
const ecosystem = require('../deploy/ecosystem.config.cjs')

test('local and PM2 runtime defaults target the HTTPS Mystikos backend', async () => {
  const envExample = await readFile(new URL('../.env.example', import.meta.url), 'utf8')
  const envApiBase = envExample.match(/^NUXT_MYSTIKOS_API_BASE=(.+)$/m)?.[1]
  const pm2ApiBase = ecosystem.apps[0]?.env?.NUXT_MYSTIKOS_API_BASE

  assert.equal(MYSTIKOS_API_BASE, 'https://www.joinmystikos.com')
  assert.equal(envApiBase, MYSTIKOS_API_BASE)
  assert.equal(pm2ApiBase, MYSTIKOS_API_BASE)
})
