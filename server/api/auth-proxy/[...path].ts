export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || ''
  const config = useRuntimeConfig(event)
  const incomingHeaders = getRequestHeaders(event)
  const body = ['POST', 'PUT', 'PATCH'].includes(getMethod(event)) ? await readBody(event) : undefined
  const search = getRequestURL(event).search

  const response = await $fetch.raw(`${config.mystikosApiBase}/api/v1/${path}${search}`, {
    method: getMethod(event),
    body,
    ignoreResponseError: true,
    headers: {
      ...(incomingHeaders.authorization ? { authorization: incomingHeaders.authorization } : {}),
      'content-type': 'application/json'
    }
  })

  setResponseStatus(event, response.status)
  return response._data
})
