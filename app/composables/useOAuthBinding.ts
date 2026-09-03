export type OAuthBindResult = {
  provider: string
  providerUserId: string
  displayName: string | null
}

export function useOAuthBinding() {
  const { request: authedRequest } = useAuthedApi()
  const request = <T>(path: string, options: Record<string, unknown> = {}) => authedRequest<T>(path, options, 'Third-party account request failed')

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
