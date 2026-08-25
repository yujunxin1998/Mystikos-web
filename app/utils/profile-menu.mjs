export const shouldCloseProfileMenu = (target, trigger, menu) => {
  if (!target || !trigger || !menu) return false
  return !trigger.contains(target) && !menu.contains(target)
}
