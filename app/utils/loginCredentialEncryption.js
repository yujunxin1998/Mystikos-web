const RSA_OAEP_256 = 'RSA-OAEP-256'

const channelFor = (identifier) => /^\+?[\d\s-]{6,}$/.test(identifier) ? 'PHONE' : 'EMAIL'

const pemToArrayBuffer = (pem) => {
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '')

  if (!base64) throw new Error('The login public key is empty.')

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export const encryptLoginCredential = async (publicKeyPem, password, cryptoProvider = globalThis.crypto) => {
  if (!cryptoProvider?.subtle) throw new Error('Secure login encryption is unavailable in this browser.')

  const publicKey = await cryptoProvider.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
  const encrypted = await cryptoProvider.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    new TextEncoder().encode(password),
  )
  return arrayBufferToBase64(encrypted)
}

export const buildEncryptedPasswordLoginPayload = async (
  identifier,
  password,
  keyData,
  encrypt = encryptLoginCredential,
) => {
  if (keyData?.algorithm !== RSA_OAEP_256) {
    throw new Error(`Unsupported login encryption algorithm: ${keyData?.algorithm || 'unknown'}`)
  }
  if (!keyData.keyId || !keyData.publicKey) throw new Error('The login public key response is incomplete.')

  return {
    channel: channelFor(identifier),
    identifier,
    credentialType: 'PASSWORD',
    keyId: keyData.keyId,
    encryptedCredential: await encrypt(keyData.publicKey, password),
  }
}
