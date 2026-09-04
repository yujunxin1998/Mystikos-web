/** 遮罩层（侧栏 / 弹层）用的 body 滚动锁定，引用计数避免互相抢解锁。 */

let lockCount = 0

export function acquireScrollLock() {
  if (typeof document === 'undefined') return
  lockCount += 1
  if (lockCount === 1) document.body.style.overflow = 'hidden'
}

export function releaseScrollLock() {
  if (typeof document === 'undefined') return
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) document.body.style.overflow = ''
}
