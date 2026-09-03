/**
 * 已登录接口共用的请求封装。除了原来"解 APIResponse 信封"的逻辑，
 * 还统一处理 401/403：清空本地过期的登录态并跳转登录页，
 * 而不是让每个业务 composable 各自把 "商城请求失败"/"预约请求失败" 之类的
 * 通用错误抛给页面——那种情况下用户看到的是一句无意义的报错，而不是"请重新登录"。
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('登录状态已失效，请重新登录')
    this.name = 'SessionExpiredError'
  }
}

type ApiResponse<T> = { code: number; message?: string; data: T | null }

export function useAuthedApi() {
  const { accessToken, authenticated, invalidateSession } = useDemoAuth()
  const route = useRoute()

  const request = async <T>(path: string, options: Record<string, unknown> = {}, fallbackMessage = '请求失败') => {
    const response = await $fetch.raw<ApiResponse<T>>(`/api/auth-proxy/${path}`, {
      ...options,
      ignoreResponseError: true,
      headers: { authorization: `Bearer ${accessToken.value}`, ...((options.headers as object) || {}) }
    })
    if (response.status === 401 || response.status === 403) {
      // authenticated 已经是 false 说明别的并发请求先一步处理过了，不用重复清理/重复跳转。
      if (authenticated.value) {
        invalidateSession()
        if (import.meta.client) navigateTo(`/auth?redirect=${encodeURIComponent(route.fullPath)}`)
      }
      throw new SessionExpiredError()
    }
    const body = response._data
    if (!body || body.code !== 200) throw new Error(body?.message || fallbackMessage)
    return body.data as T
  }

  return { request }
}
