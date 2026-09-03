<script setup lang="ts">
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import type { AccountCompletion, CompanionContactType } from '~/composables/useCompanionApplication'
import { maskPhone } from '~/utils/privacy'

const props = withDefaults(defineProps<{
  showReadyAction?: boolean
}>(), {
  showReadyAction: false
})

const emit = defineEmits<{
  state: [value: AccountCompletion]
}>()

const { locale } = useMystikos()
const companionApi = useCompanionApplication()
const loading = ref(true)
const sending = ref<CompanionContactType | null>(null)
const verifying = ref<CompanionContactType | null>(null)
const editingEmail = ref(false)
const editingPhone = ref(false)
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
  loading: '正在读取账号联系方式…', email: '邮箱地址', phone: '手机号码', send: '发送验证码', sending: '正在发送…', sent: '验证码已发送', verify: '验证并保存', verifying: '正在验证…', verified: '已验证', unverified: '待验证', change: '更换', cancel: '取消更换',
  emailPlaceholder: 'you@example.com', phonePlaceholder: '请输入本地手机号', code: '6 位验证码', ready: '已满足申请条件：邮箱或手机号已完成一项验证。', apply: '继续陪玩申请',
  rule: '邮箱和手机号任选一项完成验证即可；已验证的手机号只显示前 3 位和后 4 位。', invalidEmail: '请输入有效的邮箱地址。', invalidPhone: '请输入有效的国际手机号。', invalidCode: '请输入 6 位数字验证码。', loadError: '无法读取账号联系方式。'
} : {
  loading: 'Loading account contacts…', email: 'Email address', phone: 'Mobile number', send: 'Send code', sending: 'Sending…', sent: 'Code sent', verify: 'Verify and save', verifying: 'Verifying…', verified: 'Verified', unverified: 'Not verified', change: 'Change', cancel: 'Cancel change',
  emailPlaceholder: 'you@example.com', phonePlaceholder: 'Local mobile number', code: '6-digit code', ready: 'Application requirement met: one contact method is verified.', apply: 'Continue application',
  rule: 'Verify either email or mobile. Verified mobile numbers only show the first 3 and last 4 characters.', invalidEmail: 'Enter a valid email address.', invalidPhone: 'Enter a valid international phone number.', invalidCode: 'Enter the 6-digit verification code.', loadError: 'Unable to load account contacts.'
})

const completion = computed(() => companionApi.accountCompletion.value)
const emailVerified = computed(() => Boolean(completion.value?.emailVerified))
const phoneVerified = computed(() => Boolean(completion.value?.phoneVerified))
const maskedVerifiedPhone = computed(() => maskPhone(completion.value?.phone))
const phoneE164 = computed(() => {
  const parsed = parsePhoneNumberFromString(phone.value, phoneCountry.value)
  return parsed?.isValid() ? parsed.number : ''
})

const hydrate = (state: AccountCompletion) => {
  email.value = state.email || ''
  if (state.phone) {
    const parsed = parsePhoneNumberFromString(state.phone)
    if (parsed?.country) phoneCountry.value = parsed.country
    phone.value = parsed?.nationalNumber || state.phone
  } else {
    phone.value = ''
  }
  if (state.emailVerified) editingEmail.value = false
  if (state.phoneVerified) editingPhone.value = false
  emit('state', state)
}

const refresh = async () => {
  loading.value = true
  error.value = ''
  try {
    const state = await companionApi.loadAccountCompletion()
    hydrate(state)
    return state
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : copy.value.loadError
    return null
  } finally {
    loading.value = false
  }
}

const sendCode = async (channel: CompanionContactType) => {
  error.value = ''
  notice.value = ''
  const identifier = channel === 'EMAIL' ? email.value.trim().toLowerCase() : phoneE164.value
  if (channel === 'EMAIL' && !/^\S+@\S+\.\S+$/.test(identifier)) { error.value = copy.value.invalidEmail; return }
  if (channel === 'PHONE' && !identifier) { error.value = copy.value.invalidPhone; return }
  sending.value = channel
  try {
    await companionApi.sendContactCode(channel, identifier)
    if (channel === 'EMAIL') emailSent.value = true
    else phoneSent.value = true
    notice.value = copy.value.sent
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : copy.value.send
  } finally {
    sending.value = null
  }
}

const verify = async (channel: CompanionContactType) => {
  error.value = ''
  notice.value = ''
  const identifier = channel === 'EMAIL' ? email.value.trim().toLowerCase() : phoneE164.value
  const code = channel === 'EMAIL' ? emailCode.value.trim() : phoneCode.value.trim()
  if (!/^\d{6}$/.test(code)) { error.value = copy.value.invalidCode; return }
  verifying.value = channel
  try {
    const state = await companionApi.verifyContact(channel, identifier, code)
    hydrate(state)
    if (channel === 'EMAIL') { emailSent.value = false; emailCode.value = '' }
    else { phoneSent.value = false; phoneCode.value = '' }
    notice.value = `${channel === 'EMAIL' ? copy.value.email : copy.value.phone} · ${copy.value.verified}`
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : copy.value.unverified
  } finally {
    verifying.value = null
  }
}

const toggleEdit = (channel: CompanionContactType) => {
  notice.value = ''
  error.value = ''
  if (channel === 'EMAIL') {
    editingEmail.value = !editingEmail.value
    emailSent.value = false
    emailCode.value = ''
    email.value = completion.value?.email || ''
  } else {
    editingPhone.value = !editingPhone.value
    phoneSent.value = false
    phoneCode.value = ''
    if (completion.value?.phone) {
      const parsed = parsePhoneNumberFromString(completion.value.phone)
      if (parsed?.country) phoneCountry.value = parsed.country
      phone.value = parsed?.nationalNumber || completion.value.phone
    }
  }
}

defineExpose({ refresh })
onMounted(refresh)
</script>

<template>
  <div class="contact-verification-panel">
    <div v-if="loading" class="companion-loading">{{ copy.loading }}</div>
    <template v-else>
      <section class="security-grid">
        <article class="verification-card" :class="{ 'is-verified': emailVerified && !editingEmail }">
          <header class="verification-heading">
            <span class="verification-index">01</span>
            <h3>{{ copy.email }}</h3>
            <em class="verification-status" :class="{ verified: emailVerified && !editingEmail }">{{ emailVerified && !editingEmail ? copy.verified : copy.unverified }}</em>
          </header>
          <div class="verification-body">
            <div v-if="emailVerified && !editingEmail" class="contact-value-row">
              <span class="contact-value">{{ completion?.email }}</span>
              <button type="button" class="contact-action" @click="toggleEdit('EMAIL')">{{ copy.change }}</button>
            </div>
            <template v-else>
              <label class="companion-field contact-input-field">
                <span class="visually-hidden">{{ copy.email }}</span>
                <input v-model.trim="email" type="email" autocomplete="email" :placeholder="copy.emailPlaceholder">
              </label>
              <div class="verification-actions">
                <button class="text-action" type="button" :disabled="sending === 'EMAIL'" @click="sendCode('EMAIL')">{{ sending === 'EMAIL' ? copy.sending : emailSent ? copy.sent : copy.send }} →</button>
                <button v-if="emailVerified" class="text-action muted" type="button" @click="toggleEdit('EMAIL')">{{ copy.cancel }}</button>
              </div>
              <div v-if="emailSent" class="verification-code-row">
                <input v-model.trim="emailCode" inputmode="numeric" maxlength="6" :placeholder="copy.code">
                <button type="button" :disabled="verifying === 'EMAIL'" @click="verify('EMAIL')">{{ verifying === 'EMAIL' ? copy.verifying : copy.verify }}</button>
              </div>
            </template>
          </div>
        </article>

        <article class="verification-card" :class="{ 'is-verified': phoneVerified && !editingPhone }">
          <header class="verification-heading">
            <span class="verification-index">02</span>
            <h3>{{ copy.phone }}</h3>
            <em class="verification-status" :class="{ verified: phoneVerified && !editingPhone }">{{ phoneVerified && !editingPhone ? copy.verified : copy.unverified }}</em>
          </header>
          <div class="verification-body">
            <div v-if="phoneVerified && !editingPhone" class="contact-value-row">
              <span class="contact-value">{{ maskedVerifiedPhone }}</span>
              <button type="button" class="contact-action" @click="toggleEdit('PHONE')">{{ copy.change }}</button>
            </div>
            <template v-else>
              <InternationalPhoneField v-model="phone" v-model:country="phoneCountry" :label="copy.phone" :placeholder="copy.phonePlaceholder" hide-label />
              <div class="verification-actions">
                <button class="text-action" type="button" :disabled="sending === 'PHONE'" @click="sendCode('PHONE')">{{ sending === 'PHONE' ? copy.sending : phoneSent ? copy.sent : copy.send }} →</button>
                <button v-if="phoneVerified" class="text-action muted" type="button" @click="toggleEdit('PHONE')">{{ copy.cancel }}</button>
              </div>
              <div v-if="phoneSent" class="verification-code-row">
                <input v-model.trim="phoneCode" inputmode="numeric" maxlength="6" :placeholder="copy.code">
                <button type="button" :disabled="verifying === 'PHONE'" @click="verify('PHONE')">{{ verifying === 'PHONE' ? copy.verifying : copy.verify }}</button>
              </div>
            </template>
          </div>
        </article>
      </section>

      <p v-if="!completion?.companionApplicationAllowed" class="contact-verification-rule"><span>✦</span>{{ copy.rule }}</p>
      <p v-if="notice" class="companion-feedback success" role="status">{{ notice }}</p>
      <p v-if="error" class="companion-feedback error" role="alert">{{ error }}</p>
      <div v-if="completion?.companionApplicationAllowed" class="security-ready"><div><span>✦</span><strong>{{ copy.ready }}</strong></div><NuxtLink v-if="props.showReadyAction" to="/companion/apply" class="button button-primary">{{ copy.apply }} →</NuxtLink></div>
    </template>
  </div>
</template>
