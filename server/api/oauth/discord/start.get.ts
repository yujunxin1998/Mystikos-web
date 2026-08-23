export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store, max-age=0')
  const config = useRuntimeConfig(event)
  if (!config.mystikosApiBase) {
    return sendRedirect(event, '/auth?oauth_error=oauth_backend_not_configured', 302)
  }
  const backendAuthorizeUrl = `${config.mystikosApiBase}/api/v1/auth/oauth/discord/authorize`
  try {
    const response = await fetch(backendAuthorizeUrl, { redirect: 'manual' })
    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      return sendRedirect(event, location, 302)
    }
  } catch {
    // The auth page presents the user-facing error below.
  }
  return sendRedirect(event, '/auth?oauth_error=oauth_start_failed', 302)
})
