import { parseCreateOrderResponse } from '~/utils/commerce-api.mjs'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || ''
  const config = useRuntimeConfig(event)
  const incomingHeaders = getRequestHeaders(event)
  const method = getMethod(event)
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method)
  const multipart = incomingHeaders['content-type']?.includes('multipart/form-data')
  let body: BodyInit | Record<string, unknown> | undefined
  if (hasBody && multipart) {
    const parts = await readMultipartFormData(event)
    const form = new FormData()
    for (const part of parts || []) {
      if (!part.name) continue
      if (part.filename) form.append(part.name, new Blob([part.data], { type: part.type || 'application/octet-stream' }), part.filename)
      else form.append(part.name, part.data.toString('utf8'))
    }
    body = form
  } else if (hasBody) {
    body = await readBody(event)
  }
  const search = getRequestURL(event).search

  const response = await $fetch.raw<string>(`${config.mystikosApiBase}/api/v1/${path}${search}`, {
    method,
    body,
    ignoreResponseError: true,
    responseType: 'text',
    headers: {
      ...(incomingHeaders.authorization ? { authorization: incomingHeaders.authorization } : {}),
      ...(!multipart && hasBody ? { 'content-type': 'application/json' } : {})
    }
  })

  setResponseStatus(event, response.status)
  const responseText = response._data || ''
  if (!response.headers.get('content-type')?.includes('application/json')) return responseText
  // 16+ 位 Long 型 id（订单号/地址ID/点单组ID等）在 JSON.parse 时会丢精度，parseCreateOrderResponse
  // 内部的正则在没有这种超长数字字面量时是 no-op，所以统一套用它比按路径挑着用更安全。
  return parseCreateOrderResponse(responseText)
})
