<script setup lang="ts">
const props = defineProps<{ current: number }>()
const { locale } = useMystikos()
const steps = computed(() => locale.value === 'zh'
  ? ['确认资格', '申请资料', '联系方式', '等待审核']
  : ['Eligibility', 'Application', 'Contact', 'Review'])
</script>

<template>
  <ol class="companion-journey" :aria-label="locale === 'zh' ? '陪玩申请进度' : 'Companion application progress'">
    <li v-for="(step, index) in steps" :key="step" :class="{ active: index + 1 === props.current, complete: index + 1 < props.current }">
      <i>{{ index + 1 < props.current ? '✓' : index + 1 }}</i>
      <span>{{ step }}</span>
    </li>
  </ol>
</template>
