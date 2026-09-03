export const PRODUCT_IMAGE_PLACEHOLDER = '/images/product-placeholder.svg'

export const productImageSource = (images = []) => {
  const source = Array.isArray(images)
    ? images.find(image => typeof image === 'string' && image.trim())
    : undefined
  return source?.trim() || PRODUCT_IMAGE_PLACEHOLDER
}

export const recoverProductImage = (event) => {
  const target = event?.currentTarget
  if (!target || target.src?.endsWith(PRODUCT_IMAGE_PLACEHOLDER)) return false
  target.onerror = null
  target.src = PRODUCT_IMAGE_PLACEHOLDER
  return true
}

export const shopErrorPresentation = productLoadFailed => productLoadFailed
  ? { title: '暂时无法连接商城', action: 'retry' }
  : { title: '操作未完成', action: 'dismiss' }

export const dialogFocusIndex = (currentIndex, focusableCount, shiftKey) => {
  if (focusableCount <= 0) return -1
  if (currentIndex < 0) return shiftKey ? focusableCount - 1 : 0
  const direction = shiftKey ? -1 : 1
  return (currentIndex + direction + focusableCount) % focusableCount
}

export const shopErrorSurface = (error, productLoadFailed, activeOverlayKey) => {
  if (!error) return 'none'
  if (!productLoadFailed && activeOverlayKey) return 'overlay'
  return 'page'
}
