import { buildEncryptedPasswordLoginPayload, buildPlaintextPasswordLoginPayload } from '~/utils/loginCredentialEncryption.js'

type ApiResponse<T> = { code: number; message?: string; data: T | null }
type TokenResponse = { accessToken: string; refreshToken: string; userId: number }
type LoginPublicKeyResponse = { keyId: string; algorithm: string; publicKey: string }
type Channel = 'EMAIL' | 'PHONE'

const channelFor = (identifier: string): Channel => /^\+?[\d\s-]{6,}$/.test(identifier) ? 'PHONE' : 'EMAIL'

export function useDemoAuth() {
  const config = useRuntimeConfig()
  const accessToken = useCookie<string | null>('mystikos_access_token', { sameSite: 'lax' })
  const refreshToken = useCookie<string | null>('mystikos_refresh_token', { sameSite: 'lax' })
  const authenticated = useState('mystikos-authenticated', () => Boolean(accessToken.value))
  const userName = useState('mystikos-user-name', () => '')
  const userAvatarUrl = useState('mystikos-user-avatar-url', () => '')

  const request = async <T>(path: string, options: Record<string, unknown> = {}) => {
    const response = await $fetch<ApiResponse<T>>(`/api/auth-proxy/${path}`, { ...options, ignoreResponseError: true })
    if (!response) throw new Error('The authentication service did not return a response.')
    if (response.code !== 200) throw new Error(response.message || 'Authentication request failed')
    return response.data as T
  }
  const storeTokens = (tokens: TokenResponse, name: string) => {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
    userName.value = name || 'Stargazer'
    authenticated.value = true
  }
  const loginPassword = async (identifier: string, password: string) => {
    const body = config.public.passwordEncryptionEnabled
      ? await buildEncryptedPasswordLoginPayload(identifier, password, await request<LoginPublicKeyResponse>('auth/public-key'))
      : buildPlaintextPasswordLoginPayload(identifier, password)
    const tokens = await request<TokenResponse>('auth/login', { method: 'POST', body })
    storeTokens(tokens, identifier.split('@')[0] || identifier)
  }
  const loginWithCode = async (identifier: string, code: string) => {
    const tokens = await request<TokenResponse>('auth/login', { method: 'POST', body: { channel: channelFor(identifier), identifier, credentialType: 'VERIFICATION_CODE', credential: code } })
    storeTokens(tokens, identifier.split('@')[0] || identifier)
  }
  const sendCode = (identifier: string, purpose: 'LOGIN' | 'REGISTER') => request('auth/verification-codes', { method: 'POST', body: { channel: channelFor(identifier), identifier, purpose } })
  const register = async (name: string, identifier: string, password: string, verificationCode: string) => {
    const tokens = await request<TokenResponse>('auth/register', { method: 'POST', body: { channel: channelFor(identifier), identifier, password, verificationCode, initialRole: 'MEMBER' } })
    storeTokens(tokens, name)
  }
  const oauthLogin = async (provider: string, code: string) => {
    const tokens = await request<TokenResponse>(`auth/oauth/${provider}/login`, { method: 'POST', body: { code } })
    storeTokens(tokens, `${provider} traveler`)
  }
  const redeemOAuthTicket = async (ticket: string) => {
    const tokens = await request<TokenResponse>('auth/oauth/tickets', { method: 'POST', body: { ticket } })
    storeTokens(tokens, 'Discord traveler')
  }
  const logout = async () => {
    try { if (accessToken.value) await request('auth/logout', { method: 'POST', headers: { authorization: `Bearer ${accessToken.value}` } }) } catch { /* Local cleanup is still required. */ }
    accessToken.value = null; refreshToken.value = null; authenticated.value = false; userName.value = ''; userAvatarUrl.value = ''
  }

  return { authenticated, userName, userAvatarUrl, accessToken, loginPassword, loginWithCode, sendCode, register, oauthLogin, redeemOAuthTicket, logout }
}
