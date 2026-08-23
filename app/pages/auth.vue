<script setup lang="ts">
import celestialArtwork from '~/assets/images/auth-celestial-editorial-v2.png'

const { t } = useMystikos()
const { loginPassword, loginWithCode, sendCode: requestCode, register, redeemOAuthTicket } = useDemoAuth()
const route = useRoute()
const config = useRuntimeConfig()

const mode = ref<'login' | 'register'>('login')
const method = ref<'password' | 'email'>('password')
const account = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const code = ref('')
const registerCode = ref('')
const acceptedTerms = ref(false)
const sentCode = ref(false)
const sending = ref(false)
const error = ref('')
const success = ref('')

useHead({ title: 'Welcome to Mystikos' })

const resetFeedback = () => { error.value = ''; success.value = '' }
const validLoginIdentifier = (value: string) => /\S+@\S+\.\S+/.test(value) || /^\+?[\d\s-]{6,}$/.test(value)
const switchMode = (value: 'login' | 'register') => {
  mode.value = value
  method.value = 'password'
  resetFeedback()
}
const sendCode = async (purpose: 'LOGIN' | 'REGISTER') => {
  resetFeedback()
  if (!email.value.includes('@')) { error.value = t('auth.required'); return }
  sending.value = true
  try { await requestCode(email.value, purpose); sentCode.value = true } catch (cause) { error.value = cause instanceof Error ? cause.message : t('auth.required') } finally { sending.value = false }
}
const finish = async (message: string) => {
  success.value = message
  await new Promise(resolve => setTimeout(resolve, 900))
  await navigateTo('/')
}
const submitLogin = async () => {
  resetFeedback()
  if (method.value === 'password') {
    if (!account.value || !password.value) { error.value = t('auth.required'); return }
    if (!validLoginIdentifier(account.value)) { error.value = t('auth.identifierFormat'); return }
    if (password.value.length < 8) { error.value = t('auth.passwordLength'); return }
    try { await loginPassword(account.value, password.value); await finish(t('auth.successLogin')) } catch (cause) { error.value = cause instanceof Error ? cause.message : t('auth.required') }
  } else {
    if (!email.value || !code.value) { error.value = t('auth.required'); return }
    try { await loginWithCode(email.value, code.value); await finish(t('auth.successLogin')) } catch (cause) { error.value = cause instanceof Error ? cause.message : t('auth.required') }
  }
}
const submitRegister = async () => {
  resetFeedback()
  if (!displayName.value || !email.value || !password.value || !confirmPassword.value || !registerCode.value) { error.value = t('auth.required'); return }
  if (password.value.length < 8) { error.value = t('auth.passwordLength'); return }
  if (password.value !== confirmPassword.value) { error.value = t('auth.match'); return }
  if (!acceptedTerms.value) { error.value = t('auth.required'); return }
  try { await register(displayName.value, email.value, password.value, registerCode.value); await finish(t('auth.successRegister')) } catch (cause) { error.value = cause instanceof Error ? cause.message : t('auth.required') }
}
const discordLogin = async () => {
  resetFeedback()
  window.location.assign(`${config.app.baseURL}api/oauth/discord/start`)
}
onMounted(async () => {
  if (route.query.oauth_error) {
    error.value = 'Discord login service is unavailable. Please check the backend configuration and try again.'
    return
  }
  const ticket = typeof route.query.oauth_ticket === 'string' ? route.query.oauth_ticket : ''
  if (ticket) {
    try {
      await redeemOAuthTicket(ticket)
      await navigateTo('/auth', { replace: true })
      await finish(t('auth.successLogin'))
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : t('auth.required')
    }
  }
})
</script>

<template>
  <section class="auth-page">
    <aside class="auth-art" aria-hidden="true">
      <NuxtLink to="/" class="auth-brand"><BrandLogo /></NuxtLink>
      <div class="auth-celestial" aria-hidden="true"><img :src="celestialArtwork" alt="" /></div>
      <div class="auth-art-copy"><span class="auth-art-kicker">MYSTIKOS / 01</span><h2>Stories written<br>in <em>starlight.</em></h2><span class="auth-art-caption">A guild for the games you remember.</span></div>
      <p>“The best games leave a little light behind.”</p>
      <div class="auth-art-footer"><span>✦</span><span>EST. IN THE CONSTELLATION</span></div>
    </aside>

    <main class="auth-main">
      <NuxtLink to="/" class="auth-back">← <span>{{ t('nav.home') }}</span></NuxtLink>
      <div class="auth-panel">
        <div class="auth-mode-tabs" role="tablist">
          <button :class="{ active: mode === 'login' }" role="tab" :aria-selected="mode === 'login'" @click="switchMode('login')">{{ t('auth.login') }}</button>
          <button :class="{ active: mode === 'register' }" role="tab" :aria-selected="mode === 'register'" @click="switchMode('register')">{{ t('auth.register') }}</button>
        </div>

        <template v-if="mode === 'login'">
          <p class="eyebrow"><span />MYSTIKOS GUILD</p>
          <h1>{{ t('auth.welcome') }}</h1>
          <p class="auth-intro">{{ t('auth.loginBody') }}</p>
          <div class="auth-method-tabs" role="tablist">
            <button :class="{ active: method === 'password' }" role="tab" :aria-selected="method === 'password'" @click="method = 'password'; resetFeedback()">{{ t('auth.password') }}</button>
            <button :class="{ active: method === 'email' }" role="tab" :aria-selected="method === 'email'" @click="method = 'email'; resetFeedback()">{{ t('auth.email') }}</button>
          </div>
          <form v-if="method === 'password'" class="auth-form" @submit.prevent="submitLogin">
            <label><span>{{ t('auth.accountLabel') }}</span><input v-model.trim="account" :placeholder="t('auth.accountPlaceholder')" autocomplete="username"></label>
            <label><span>{{ t('auth.passwordLabel') }}</span><input v-model="password" type="password" :placeholder="t('auth.passwordPlaceholder')" autocomplete="current-password"></label>
            <div class="auth-form-row"><label class="check-label"><input type="checkbox" checked><i />{{ t('auth.remember') }}</label><button type="button" class="inline-link">{{ t('auth.forgot') }}</button></div>
            <button class="auth-submit" type="submit">{{ t('auth.submitLogin') }} <span>→</span></button>
          </form>
          <form v-else class="auth-form" @submit.prevent="submitLogin">
            <label><span>{{ t('auth.emailLabel') }}</span><input v-model.trim="email" type="email" :placeholder="t('auth.emailPlaceholder')" autocomplete="email"></label>
            <label><span>{{ t('auth.codeLabel') }}</span><div class="code-field"><input v-model.trim="code" inputmode="numeric" :placeholder="t('auth.codePlaceholder')"><button type="button" :disabled="sending" @click="sendCode('LOGIN')">{{ sending ? t('auth.sending') : t('auth.sendCode') }}</button></div></label>
            <p v-if="sentCode" class="code-sent">✦ {{ t('auth.codeSent') }}</p>
            <button class="auth-submit" type="submit">{{ t('auth.submitLogin') }} <span>→</span></button>
          </form>
        </template>

        <template v-else>
          <p class="eyebrow"><span />NEW GUILD MEMBER</p>
          <h1>{{ t('auth.join') }}</h1>
          <p class="auth-intro">{{ t('auth.registerBody') }}</p>
          <form class="auth-form register-form" @submit.prevent="submitRegister">
            <label><span>{{ t('auth.nameLabel') }}</span><input v-model.trim="displayName" :placeholder="t('auth.namePlaceholder')" autocomplete="nickname"></label>
            <label><span>{{ t('auth.emailLabel') }}</span><input v-model.trim="email" type="email" :placeholder="t('auth.emailPlaceholder')" autocomplete="email"></label>
            <label><span>{{ t('auth.codeLabel') }}</span><div class="code-field"><input v-model.trim="registerCode" inputmode="numeric" :placeholder="t('auth.codePlaceholder')"><button type="button" :disabled="sending" @click="sendCode('REGISTER')">{{ sending ? t('auth.sending') : t('auth.sendCode') }}</button></div></label>
            <label><span>{{ t('auth.passwordLabel') }}</span><input v-model="password" type="password" :placeholder="t('auth.passwordPlaceholder')" autocomplete="new-password"></label>
            <label><span>{{ t('auth.confirmLabel') }}</span><input v-model="confirmPassword" type="password" :placeholder="t('auth.passwordPlaceholder')" autocomplete="new-password"></label>
            <label class="check-label terms-label"><input v-model="acceptedTerms" type="checkbox"><i />{{ t('auth.terms') }}</label>
            <button class="auth-submit" type="submit">{{ t('auth.submitRegister') }} <span>→</span></button>
          </form>
        </template>

        <p v-if="error" class="auth-feedback error" role="alert">{{ error }}</p>
        <p v-if="success" class="auth-feedback success" role="status">✦ {{ success }}</p>
        <div class="auth-divider"><span>{{ t('auth.or') }}</span></div>
        <button class="discord-button" type="button" @click="discordLogin">
          <svg class="discord-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.618-1.25.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.533 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.041 2.421 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.246.198.373.292a.077.077 0 0 1-.007.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029c1.961-.608 3.95-1.522 6.002-3.03a.077.077 0 0 0 .031-.055c.501-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419s.956-2.419 2.157-2.419c1.211 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419s.955-2.419 2.157-2.419c1.211 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419Z" />
          </svg>
          {{ t('auth.discord') }}
        </button>
        <p class="discord-note">{{ t('auth.discordNote') }}</p>
        <p class="auth-demo">✦ {{ t('auth.demo') }}</p>
      </div>
    </main>
  </section>
</template>

<style scoped>
.discord-button:hover {
  border-color: #5865f2;
  background: rgba(88, 101, 242, 0.08);
}

.discord-icon {
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
  fill: #5865f2;
}
</style>
