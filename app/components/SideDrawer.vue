<script setup lang="ts">
import { acquireScrollLock, releaseScrollLock } from '~/utils/scroll-lock.mjs'

const props = withDefaults(defineProps<{
  open: boolean
  eyebrow?: string
  title: string
  subtitle?: string
  titleId?: string
  overlayKey?: string
  labelledBy?: string
  compact?: boolean
}>(), {
  eyebrow: '',
  subtitle: '',
  titleId: '',
  overlayKey: '',
  labelledBy: '',
  compact: true
})

const emit = defineEmits<{ close: [] }>()
const { t } = useMystikos()

const resolvedTitleId = computed(() => props.titleId || undefined)
const ariaLabelledBy = computed(() => props.labelledBy || resolvedTitleId.value || undefined)

let holdingLock = false
/** 打开时锁滚动，关闭 / 卸载时按引用释放 */
const syncScrollLock = (open: boolean) => {
  if (!import.meta.client) return
  if (open && !holdingLock) {
    acquireScrollLock()
    holdingLock = true
  } else if (!open && holdingLock) {
    releaseScrollLock()
    holdingLock = false
  }
}

watch(() => props.open, syncScrollLock, { immediate: true })
onBeforeUnmount(() => syncScrollLock(false))
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="side-drawer-backdrop commerce-drawer-backdrop shop-overlay"
        :data-shop-overlay="overlayKey || undefined"
        @click.self="emit('close')"
      >
        <aside
          class="side-drawer commerce-drawer"
          :class="{ 'side-drawer--compact': compact }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="ariaLabelledBy"
          :aria-label="ariaLabelledBy ? undefined : title"
        >
          <header>
            <div>
              <p v-if="eyebrow" class="eyebrow"><span />{{ eyebrow }}</p>
              <h2 :id="resolvedTitleId">{{ title }}</h2>
              <p v-if="subtitle">{{ subtitle }}</p>
            </div>
            <button class="modal-close" type="button" :aria-label="t('modal.close')" @click="emit('close')">×</button>
          </header>
          <slot name="alert" />
          <div class="side-drawer-body">
            <slot />
          </div>
          <footer v-if="$slots.footer">
            <slot name="footer" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
