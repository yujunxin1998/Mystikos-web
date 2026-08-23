<script setup lang="ts">
const { locale } = useMystikos()
const { authenticated } = useDemoAuth()
const companionApi = useCompanionApplication()

const copy = computed(() => locale.value === 'zh' ? {
  eyebrow: '账号安全 · 联系方式', title: '把可靠的联络信号留在星图上。', body: '邮箱或手机号任意完成一项验证，即可提交陪玩申请；联系方式也会在个人资料中统一维护。',
  back: '返回个人中心', oauthRule: '第三方账号规则', oauthHint: '邮箱或手机号认证一个即可申请。', regularRule: '普通账号规则', regularHint: '邮箱或手机号认证一个即可申请。'
} : {
  eyebrow: 'Account security · Contacts', title: 'Leave a reliable signal in the constellation.', body: 'Verify either an email address or a mobile number before applying. Contacts are maintained in your profile.',
  back: 'Back to profile', oauthRule: 'Third-party account rule', oauthHint: 'One verified email or mobile number is enough.', regularRule: 'Standard account rule', regularHint: 'One verified email or mobile number is enough.'
})

const completion = computed(() => companionApi.accountCompletion.value)

onMounted(() => {
  if (!authenticated.value) return navigateTo('/auth')
})
</script>

<template>
  <div class="companion-page section-wrap">
    <NuxtLink to="/profile#contact-verification" class="companion-back">← {{ copy.back }}</NuxtLink>
    <header class="companion-hero compact">
      <div>
        <p class="eyebrow"><span />{{ copy.eyebrow }}</p>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.body }}</p>
      </div>
      <div v-if="completion" class="eligibility-seal" :class="{ ready: completion.companionApplicationAllowed }">
        <i>{{ completion.companionApplicationAllowed ? '✓' : '!' }}</i>
        <strong>{{ completion.oauthBound ? copy.oauthRule : copy.regularRule }}</strong>
        <small>{{ completion.oauthBound ? copy.oauthHint : copy.regularHint }}</small>
      </div>
    </header>

    <ContactVerificationPanel show-ready-action />
  </div>
</template>
