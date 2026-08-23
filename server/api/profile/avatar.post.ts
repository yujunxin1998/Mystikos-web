export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file')
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'Choose an image to upload.' })

  const form = new FormData()
  form.append('file', new Blob([file.data], { type: file.type || 'application/octet-stream' }), file.filename || 'avatar')
  return await $fetch(`${config.mystikosApiBase}/api/v1/files/upload`, {
    method: 'POST', body: form,
    headers: { authorization: getHeader(event, 'authorization') || '' },
    ignoreResponseError: true
  })
})
