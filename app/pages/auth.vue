<script setup lang="ts">
const { t } = useMystikos()
const { loginPassword, loginWithCode, sendCode: requestCode, register, oauthLogin } = useDemoAuth()
const config = useRuntimeConfig()
const route = useRoute()

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
  const state = crypto.randomUUID()
  sessionStorage.setItem('mystikos_discord_oauth_state', state)
  if (config.public.discordAuthorizeUrl) {
    const authorizationUrl = new URL(config.public.discordAuthorizeUrl)
    authorizationUrl.searchParams.set('state', state)
    window.location.assign(authorizationUrl.toString())
    return
  }
  if (!config.public.discordClientId || !config.public.discordRedirectUri) { error.value = t('auth.discordConfig'); return }
  const authorizationUrl = new URL('https://discord.com/api/oauth2/authorize')
  authorizationUrl.searchParams.set('client_id', config.public.discordClientId)
  authorizationUrl.searchParams.set('redirect_uri', config.public.discordRedirectUri)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('scope', 'identify email')
  authorizationUrl.searchParams.set('state', state)
  window.location.assign(authorizationUrl.toString())
}
onMounted(async () => {
  const codeFromProvider = typeof route.query.code === 'string' ? route.query.code : ''
  const provider = typeof route.query.provider === 'string' ? route.query.provider : ''
  if (provider === 'discord' && codeFromProvider) {
    const expectedState = sessionStorage.getItem('mystikos_discord_oauth_state')
    const returnedState = typeof route.query.state === 'string' ? route.query.state : ''
    if (!expectedState || returnedState !== expectedState) { error.value = t('auth.discordState'); return }
    sessionStorage.removeItem('mystikos_discord_oauth_state')
    try { await oauthLogin('discord', codeFromProvider); await finish(t('auth.successLogin')) } catch (cause) { error.value = cause instanceof Error ? cause.message : t('auth.required') }
  }
})
</script>

<template>
  <section class="auth-page">
    <aside class="auth-art" aria-hidden="true">
      <NuxtLink to="/" class="auth-brand"><BrandLogo /></NuxtLink>
      <div class="auth-orbits"><i class="auth-orbit-one" /><i class="auth-orbit-two" /><i class="auth-orbit-three" /><span class="auth-star star-one">✦</span><span class="auth-star star-two">✧</span><span class="auth-star star-three">✦</span><div class="auth-moon"><span>☾</span></div></div>
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
        <button class="discord-button" @click="discordLogin"><b>⌁</b>{{ t('auth.discord') }}</button>
        <p class="discord-note">{{ t('auth.discordNote') }}</p>
        <p class="auth-demo">✦ {{ t('auth.demo') }}</p>
      </div>
    </main>
  </section>
</template>
