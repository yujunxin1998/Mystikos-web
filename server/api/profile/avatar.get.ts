type ApiResponse<T> = { code: number; message?: string; data: T | null }

export default defineEventHandler(async (event) => {
  const objectKey = getQuery(event).objectKey
  if (typeof objectKey !== 'string' || !objectKey) throw createError({ statusCode: 400, statusMessage: 'Missing avatar object key.' })

  const config = useRuntimeConfig(event)
  const token = getCookie(event, 'mystikos_access_token')
  const result = await $fetch<ApiResponse<string>>(`${config.mystikosApiBase}/api/v1/files/url`, {
    query: { objectKey },
    headers: token ? { authorization: `Bearer ${token}` } : {},
    ignoreResponseError: true
  })
  if (!result || result.code !== 200 || !result.data) throw createError({ statusCode: 404, statusMessage: result?.message || 'Avatar not found.' })

  const image = await $fetch.raw<ArrayBuffer>(result.data, { responseType: 'arrayBuffer' })
  if (!image._data) throw createError({ statusCode: 404, statusMessage: 'Avatar image is empty.' })
  setHeader(event, 'content-type', image.headers.get('content-type') || 'image/jpeg')
  setHeader(event, 'cache-control', 'private, max-age=300')
  return new Uint8Array(image._data)
})
