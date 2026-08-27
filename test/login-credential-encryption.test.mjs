import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import test from 'node:test'

import {
  buildEncryptedPasswordLoginPayload,
  buildPlaintextPasswordLoginPayload,
  encryptLoginCredential,
} from '../app/utils/loginCredentialEncryption.js'

const toPem = (buffer) => {
  const base64 = Buffer.from(buffer).toString('base64')
  const lines = base64.match(/.{1,64}/g)?.join('\n') ?? base64
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`
}

test('encryptLoginCredential produces RSA-OAEP SHA-256 ciphertext decryptable by the matching key', async () => {
  const keyPair = await webcrypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt'],
  )
  const publicKeyPem = toPem(await webcrypto.subtle.exportKey('spki', keyPair.publicKey))

  const encrypted = await encryptLoginCredential(publicKeyPem, 'correct horse battery staple', webcrypto)
  const plaintext = await webcrypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    keyPair.privateKey,
    Buffer.from(encrypted, 'base64'),
  )

  assert.equal(new TextDecoder().decode(plaintext), 'correct horse battery staple')
})

test('buildEncryptedPasswordLoginPayload sends key metadata and never includes the plaintext password', async () => {
  const payload = await buildEncryptedPasswordLoginPayload(
    'user@example.com',
    'plain-text-password',
    { keyId: 'login-key-2026-08', algorithm: 'RSA-OAEP-256', publicKey: 'test-public-key' },
    async () => 'base64-ciphertext',
  )

  assert.deepEqual(payload, {
    channel: 'EMAIL',
    identifier: 'user@example.com',
    credentialType: 'PASSWORD',
    keyId: 'login-key-2026-08',
    encryptedCredential: 'base64-ciphertext',
  })
  assert.equal('credential' in payload, false)
})

test('buildEncryptedPasswordLoginPayload rejects an unexpected server algorithm', async () => {
  await assert.rejects(
    buildEncryptedPasswordLoginPayload(
      '+86 13800138000',
      'plain-text-password',
      { keyId: 'login-key-2026-08', algorithm: 'RSA-PKCS1-v1_5', publicKey: 'test-public-key' },
      async () => 'base64-ciphertext',
    ),
    /Unsupported login encryption algorithm/,
  )
})

test('buildPlaintextPasswordLoginPayload submits the plaintext password without a public key', async () => {
  assert.deepEqual(buildPlaintextPasswordLoginPayload('user@example.com', 'plain-text-password'), {
    channel: 'EMAIL',
    identifier: 'user@example.com',
    credentialType: 'PASSWORD',
    credential: 'plain-text-password',
  })
  assert.deepEqual(buildPlaintextPasswordLoginPayload('+86 13800138000', 'plain-text-password'), {
    channel: 'PHONE',
    identifier: '+86 13800138000',
    credentialType: 'PASSWORD',
    credential: 'plain-text-password',
  })
})
