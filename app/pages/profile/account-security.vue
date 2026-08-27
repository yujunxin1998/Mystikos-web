<script setup lang="ts">
const { locale } = useMystikos()
const { authenticated } = useDemoAuth()
const companionApi = useCompanionApplication()
const oauthApi = useOAuthBinding()
const route = useRoute()

const copy = computed(() => locale.value === 'zh' ? {
  eyebrow: '账号安全 · 联系方式', title: '把可靠的联络信号留在星图上', body: '邮箱或手机号任意完成一项验证，即可提交陪玩申请；联系方式也会在个人资料中统一维护。',
  back: '返回个人中心', oauthRule: '第三方账号规则', oauthHint: '邮箱或手机号认证一个即可申请。', regularRule: '普通账号规则', regularHint: '邮箱或手机号认证一个即可申请。',
  discordTitle: 'Discord 账号', linked: '已关联', unlinked: '未关联', loading: '读取中', linkedHint: '你可以使用 Discord 登录当前 Mystikos 账号。', unlinkedHint: '关联后，Discord 身份会写入第三方账号关联表，并可用于登录。', bind: '关联 Discord', replace: '更换 Discord', unbind: '解除关联', verifyTitle: '验证账号所有权', verifyHint: '为了保护账号，验证码只会发送到当前账号已有的邮箱或手机号。', sendCode: '发送验证码', resend: '{seconds} 秒后重发', code: '6 位验证码', continueDiscord: '继续前往 Discord', confirmReplace: '我确认新 Discord 授权成功后会替换当前关联。', confirmUnbind: '我确认解除后将不能再用此 Discord 登录当前账号。', cancel: '取消', working: '处理中…', bindSuccess: 'Discord 账号关联成功', unbindSuccess: 'Discord 账号已解除关联', actionFailed: '操作失败，请重试。', securityNote: '关联、换绑和解绑均需要二次验证；Discord 账号不能同时关联其他 Mystikos 用户。'
} : {
  eyebrow: 'Account security · Contacts', title: 'Leave a reliable signal in the constellation.', body: 'Verify either an email address or a mobile number before applying. Contacts are maintained in your profile.',
  back: 'Back to profile', oauthRule: 'Third-party account rule', oauthHint: 'One verified email or mobile number is enough.', regularRule: 'Standard account rule', regularHint: 'One verified email or mobile number is enough.',
  discordTitle: 'Discord account', linked: 'Linked', unlinked: 'Not linked', loading: 'Loading', linkedHint: 'You can use Discord to sign in to this Mystikos account.', unlinkedHint: 'Once linked, your Discord identity is stored as a third-party binding and can be used to sign in.', bind: 'Link Discord', replace: 'Change Discord', unbind: 'Unlink', verifyTitle: 'Verify account ownership', verifyHint: 'For your protection, the code is only sent to the email or phone already attached to this account.', sendCode: 'Send code', resend: 'Resend in {seconds}s', code: '6-digit code', continueDiscord: 'Continue to Discord', confirmReplace: 'I understand that successful Discord authorization will replace the current binding.', confirmUnbind: 'I understand that this Discord account can no longer sign in to this account.', cancel: 'Cancel', working: 'Working…', bindSuccess: 'Discord account linked', unbindSuccess: 'Discord account unlinked', actionFailed: 'The operation failed. Please try again.', securityNote: 'Linking, changing, and unlinking require verification. A Discord account cannot be linked to another Mystikos user.'
})

const completion = computed(() => companionApi.accountCompletion.value)
const action = ref<'bind' | 'replace' | 'unbind' | null>(null)
const verificationCode = ref('')
const acknowledged = ref(false)
const busy = ref(false)
const sendingCode = ref(false)
const cooldown = ref(0)
const feedback = ref('')
const error = ref('')
const loadingBinding = ref(true)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

const isLinked = computed(() => Boolean(completion.value?.oauthBound))
const requiresAcknowledgement = computed(() => action.value === 'replace' || action.value === 'unbind')
const canSubmit = computed(() => /^\d{6}$/.test(verificationCode.value) && (!requiresAcknowledgement.value || acknowledged.value) && !busy.value)

const closeAction = () => { action.value = null; verificationCode.value = ''; acknowledged.value = false; error.value = '' }
const openAction = (next: 'bind' | 'replace' | 'unbind') => { closeAction(); action.value = next; feedback.value = '' }
const startCooldown = () => {
  cooldown.value = 60
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0 && cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null }
  }, 1000)
}
const sendBindingCode = async () => {
  if (sendingCode.value || cooldown.value > 0) return
  error.value = ''; sendingCode.value = true
  try { await oauthApi.sendVerificationCode('discord'); startCooldown() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : copy.value.actionFailed }
  finally { sendingCode.value = false }
}
const submitAction = async () => {
  if (!action.value || !canSubmit.value) return
  busy.value = true; error.value = ''
  try {
    if (action.value === 'unbind') {
      await oauthApi.unbind('discord', verificationCode.value)
      await companionApi.loadAccountCompletion()
      feedback.value = copy.value.unbindSuccess
      closeAction()
      return
    }
    const authorizeUrl = await oauthApi.beginBind('discord', verificationCode.value)
    window.location.assign(authorizeUrl)
  } catch (cause) { error.value = cause instanceof Error ? cause.message : copy.value.actionFailed }
  finally { busy.value = false }
}

onMounted(async () => {
  if (!authenticated.value) return navigateTo('/auth')
  try { await companionApi.loadAccountCompletion() } catch (cause) { error.value = cause instanceof Error ? cause.message : copy.value.actionFailed }
  finally { loadingBinding.value = false }
  if (route.query.oauth_bind === 'success') feedback.value = `${copy.value.bindSuccess}${typeof route.query.displayName === 'string' ? ` · ${route.query.displayName}` : ''}`
  if (route.query.oauth_bind === 'error') error.value = typeof route.query.reason === 'string' ? route.query.reason : copy.value.actionFailed
  if (route.query.oauth_bind) await navigateTo('/profile/account-security', { replace: true })
})
onBeforeUnmount(() => { if (cooldownTimer) clearInterval(cooldownTimer) })
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

    <section class="oauth-binding-card" aria-labelledby="discord-binding-title">
      <div class="oauth-binding-heading">
        <div class="discord-mark" aria-hidden="true">D</div>
        <div><h2 id="discord-binding-title">{{ copy.discordTitle }}</h2><p>{{ isLinked ? copy.linkedHint : copy.unlinkedHint }}</p></div>
        <span class="oauth-binding-status" :class="{ linked: isLinked }">{{ loadingBinding ? copy.loading : isLinked ? copy.linked : copy.unlinked }}</span>
      </div>
      <p class="oauth-security-note"><span>✦</span>{{ copy.securityNote }}</p>
      <div v-if="!loadingBinding && !action" class="oauth-binding-actions">
        <button v-if="!isLinked" type="button" class="button button-primary" @click="openAction('bind')">{{ copy.bind }}</button>
        <template v-else><button type="button" class="button button-ghost" @click="openAction('replace')">{{ copy.replace }}</button><button type="button" class="text-action danger" @click="openAction('unbind')">{{ copy.unbind }}</button></template>
      </div>
      <form v-else class="oauth-verification-form" @submit.prevent="submitAction">
        <h3>{{ copy.verifyTitle }}</h3><p>{{ copy.verifyHint }}</p>
        <div class="verification-code-row"><input v-model="verificationCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" :placeholder="copy.code" @input="verificationCode = verificationCode.replace(/\D/g, '').slice(0, 6)"><button type="button" :disabled="sendingCode || cooldown > 0" @click="sendBindingCode">{{ cooldown > 0 ? copy.resend.replace('{seconds}', String(cooldown)) : copy.sendCode }}</button></div>
        <label v-if="requiresAcknowledgement" class="oauth-risk-confirm"><input v-model="acknowledged" type="checkbox"><span>{{ action === 'replace' ? copy.confirmReplace : copy.confirmUnbind }}</span></label>
        <div class="oauth-form-actions"><button type="button" class="button button-ghost" :disabled="busy" @click="closeAction">{{ copy.cancel }}</button><button type="submit" class="button" :class="action === 'unbind' ? 'button-danger' : 'button-primary'" :disabled="!canSubmit">{{ busy ? copy.working : action === 'unbind' ? copy.unbind : copy.continueDiscord }}</button></div>
      </form>
      <p v-if="feedback" class="companion-feedback success" role="status">{{ feedback }}</p><p v-if="error" class="companion-feedback error" role="alert">{{ error }}</p>
    </section>
  </div>
</template>
