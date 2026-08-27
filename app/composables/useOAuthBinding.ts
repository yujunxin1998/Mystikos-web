export type OAuthBindResult = {
  provider: string
  providerUserId: string
  displayName: string | null
}

type ApiResponse<T> = { code: number; message?: string; data: T | null }

export function useOAuthBinding() {
  const { accessToken } = useDemoAuth()

  const request = async <T>(path: string, options: Record<string, unknown> = {}) => {
    const response = await $fetch<ApiResponse<T>>(`/api/auth-proxy/${path}`, {
      ...options,
      ignoreResponseError: true,
      headers: { authorization: `Bearer ${accessToken.value}`, ...((options.headers as object) || {}) }
    })
    if (!response || response.code !== 200) throw new Error(response?.message || 'Third-party account request failed')
    return response.data as T
  }

  const sendVerificationCode = (provider: string) =>
    request<void>(`profile/me/oauth/${provider}/binding-verification-codes`, { method: 'POST' })

  const beginBind = async (provider: string, verificationCode: string) => {
    const result = await request<{ authorizeUrl: string }>(`profile/me/oauth/${provider}/bind-authorize`, {
      method: 'POST', body: { verificationCode }
    })
    if (!result?.authorizeUrl) throw new Error('The authorization service did not return a redirect URL.')
    return result.authorizeUrl
  }

  const unbind = (provider: string, verificationCode: string) =>
    request<void>(`profile/me/oauth/${provider}/unbind`, { method: 'POST', body: { verificationCode } })

  const redeemBindTicket = (ticket: string) =>
    request<OAuthBindResult>('auth/oauth/bind-tickets', { method: 'POST', body: { ticket } })

  return { sendVerificationCode, beginBind, unbind, redeemBindTicket }
}
