<script setup lang="ts">
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import type { UserProfile } from '~/composables/useProfileApi'

const { locale } = useMystikos()
const { authenticated } = useDemoAuth()
const profileApi = useProfileApi()
const companionApi = useCompanionApplication()

const profile = ref<UserProfile | null>(null)
const loading = ref(true)
const sending = ref<'EMAIL' | 'PHONE' | null>(null)
const verifying = ref<'EMAIL' | 'PHONE' | null>(null)
const email = ref('')
const phone = ref('')
const phoneCountry = ref<CountryCode>('CN')
const emailCode = ref('')
const phoneCode = ref('')
const emailSent = ref(false)
const phoneSent = ref(false)
const notice = ref('')
const error = ref('')

const copy = computed(() => locale.value === 'zh' ? {
  eyebrow: '账号安全 · 陪玩资格', title: '先把联络方式留在星图上。', body: '邮箱或手机号任意完成一项验证，即可提交陪玩申请。申请表中的联系方式仍可另外填写。',
  back: '返回个人中心', email: '邮箱地址', phone: '手机号码', send: '发送验证码', sent: '验证码已发送', verify: '验证并保存', verified: '已验证', unverified: '待验证',
  emailPlaceholder: 'you@example.com', phonePlaceholder: '请输入本地手机号', code: '6 位验证码', ready: '资料已经完整，可以继续申请。', apply: '继续陪玩申请',
  oauthRule: '第三方账号规则', oauthHint: '邮箱或手机号认证一个即可申请。', regularRule: '普通账号规则', regularHint: '邮箱或手机号认证一个即可申请。',
  prototype: '本地页面预览使用测试验证码 246810；生产环境会调用短信和邮件验证接口。', invalidEmail: '请输入有效的邮箱地址。', invalidPhone: '请输入有效的国际手机号。'
} : {
  eyebrow: 'Account security · Eligibility', title: 'Leave a reliable signal in the constellation.', body: 'Verify either an email address or a mobile number before applying. The application can still use a different contact.',
  back: 'Back to profile', email: 'Email address', phone: 'Mobile number', send: 'Send code', sent: 'Code sent', verify: 'Verify and save', verified: 'Verified', unverified: 'Not verified',
  emailPlaceholder: 'you@example.com', phonePlaceholder: 'Local mobile number', code: '6-digit code', ready: 'Your account is ready for an application.', apply: 'Continue application',
  oauthRule: 'Third-party account rule', oauthHint: 'One verified email or mobile number is enough.', regularRule: 'Standard account rule', regularHint: 'One verified email or mobile number is enough.',
  prototype: 'Local preview code: 246810. Production uses the email and SMS verification APIs.', invalidEmail: 'Enter a valid email address.', invalidPhone: 'Enter a valid international phone number.'
})

const completion = computed(() => companionApi.accountCompletion.value)
const emailVerified = computed(() => completion.value?.emailVerified && completion.value.email === email.value)
const phoneE164 = computed(() => {
  const parsed = parsePhoneNumberFromString(phone.value, phoneCountry.value)
  return parsed?.isValid() ? parsed.number : ''
})
const phoneVerified = computed(() => completion.value?.phoneVerified && completion.value.phone === phoneE164.value)

const sendCode = async (channel: 'EMAIL' | 'PHONE') => {
  error.value = ''; notice.value = ''
  const identifier = channel === 'EMAIL' ? email.value.trim().toLowerCase() : phoneE164.value
  if (channel === 'EMAIL' && !/^\S+@\S+\.\S+$/.test(identifier)) { error.value = copy.value.invalidEmail; return }
  if (channel === 'PHONE' && !identifier) { error.value = copy.value.invalidPhone; return }
  sending.value = channel
  try {
    const result = await companionApi.sendContactCode(channel, identifier)
    if (channel === 'EMAIL') emailSent.value = true
    else phoneSent.value = true
    notice.value = result.developmentCode ? copy.value.prototype : copy.value.sent
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : copy.value.send
  } finally { sending.value = null }
}

const verify = async (channel: 'EMAIL' | 'PHONE') => {
  error.value = ''; notice.value = ''
  const identifier = channel === 'EMAIL' ? email.value.trim().toLowerCase() : phoneE164.value
  const code = channel === 'EMAIL' ? emailCode.value.trim() : phoneCode.value.trim()
  if (!/^\d{6}$/.test(code)) { error.value = copy.value.code; return }
  verifying.value = channel
  try {
    await companionApi.verifyContact(channel, identifier, code)
    notice.value = channel === 'EMAIL' ? `${copy.value.email} · ${copy.value.verified}` : `${copy.value.phone} · ${copy.value.verified}`
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : copy.value.unverified
  } finally { verifying.value = null }
}

onMounted(async () => {
  if (!authenticated.value) return navigateTo('/auth')
  try {
    profile.value = await profileApi.getProfile()
    const state = await companionApi.loadAccountCompletion(profile.value)
    email.value = state.email
    if (state.phone) phone.value = state.phone
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to load account details'
  } finally { loading.value = false }
})
</script>

<template>
  <div class="companion-page section-wrap">
    <NuxtLink to="/profile" class="companion-back">← {{ copy.back }}</NuxtLink>
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

    <CompanionJourney :current="1" />

    <div v-if="loading" class="companion-loading">Loading account details…</div>
    <section v-else class="security-grid">
      <article class="verification-card">
        <div class="verification-heading">
          <span>01</span><div><h2>{{ copy.email }}</h2><p :class="{ verified: emailVerified }">{{ emailVerified ? copy.verified : copy.unverified }}</p></div>
        </div>
        <label class="companion-field"><span>{{ copy.email }}</span><input v-model.trim="email" type="email" autocomplete="email" :placeholder="copy.emailPlaceholder"></label>
        <button class="text-action" type="button" :disabled="sending === 'EMAIL'" @click="sendCode('EMAIL')">{{ emailSent ? copy.sent : copy.send }} →</button>
        <div v-if="emailSent && !emailVerified" class="verification-code-row"><input v-model.trim="emailCode" inputmode="numeric" maxlength="6" :placeholder="copy.code"><button type="button" :disabled="verifying === 'EMAIL'" @click="verify('EMAIL')">{{ copy.verify }}</button></div>
      </article>

      <article class="verification-card">
        <div class="verification-heading">
          <span>02</span><div><h2>{{ copy.phone }}</h2><p :class="{ verified: phoneVerified }">{{ phoneVerified ? copy.verified : copy.unverified }}</p></div>
        </div>
        <InternationalPhoneField v-model="phone" v-model:country="phoneCountry" :label="copy.phone" :placeholder="copy.phonePlaceholder" />
        <button class="text-action" type="button" :disabled="sending === 'PHONE'" @click="sendCode('PHONE')">{{ phoneSent ? copy.sent : copy.send }} →</button>
        <div v-if="phoneSent && !phoneVerified" class="verification-code-row"><input v-model.trim="phoneCode" inputmode="numeric" maxlength="6" :placeholder="copy.code"><button type="button" :disabled="verifying === 'PHONE'" @click="verify('PHONE')">{{ copy.verify }}</button></div>
      </article>
    </section>

    <p v-if="companionApi.prototypeMode" class="prototype-note">{{ copy.prototype }}</p>
    <p v-if="notice" class="companion-feedback success" role="status">{{ notice }}</p>
    <p v-if="error" class="companion-feedback error" role="alert">{{ error }}</p>
    <div v-if="completion?.companionApplicationAllowed" class="security-ready"><div><strong>{{ copy.ready }}</strong><span>✦</span></div><NuxtLink to="/companion/apply" class="button button-primary">{{ copy.apply }} →</NuxtLink></div>
  </div>
</template>
