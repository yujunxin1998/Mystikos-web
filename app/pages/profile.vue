<script setup lang="ts">
import type { Gender, RegionNode, UserProfile } from '~/composables/useProfileApi'
import type { AccountCompletion } from '~/composables/useCompanionApplication'
import { maskPhone } from '~/utils/privacy'

const { t, locale } = useMystikos()
const { authenticated, userName, userAvatarUrl } = useDemoAuth()
const route = useRoute()
const api = useProfileApi()
const companionApi = useCompanionApplication()
const notice = ref('')
const profile = ref<UserProfile | null>(null)
const tags = ref<{ id: number; label: string }[]>([])
const regions = ref<RegionNode[]>([])
const loading = ref(true)
const editing = ref(false)
const saving = ref(false)
const avatarUploading = ref(false)
const avatarLoadFailed = ref(false)
const feedback = ref('')
const error = ref('')
const regionPickerOpen = ref(false)
const regionSearch = ref('')
const expandedCountries = ref<string[]>([])
const contactCompletion = ref<AccountCompletion | null>(null)
const checkingCompanionEligibility = ref(false)
const eligibilityDialogOpen = ref(false)
const companionEligibilityError = ref('')
const form = reactive({ nickname: '', gender: 'UNDISCLOSED' as Gender, avatarObjectKey: '', avatarUrl: '', birthDate: '', bio: '', regionCode: '', tagIds: [] as number[], privacyAnonymous: false })

const companionCopy = computed(() => locale.value === 'zh' ? {
  eyebrow: '陪玩身份', title: '把熟悉的游戏，分享给更多同行者。', body: '所有用户默认都是 Member。提交申请并通过线下考核后，你会额外获得 Companion 身份。', apply: '申请成为陪玩', checking: '正在校验资料…', view: '查看申请进度', security: '查看账号联系方式',
  contactEyebrow: '账号联系方式', contactTitle: '你的联络信号', contactBody: '邮箱和手机号都在个人资料中统一维护。任选一项完成验证，就能申请成为陪玩。', contactReady: '已满足申请条件', contactPending: '还需验证一项',
  incompleteTitle: '账号信息还不完善', incompleteBody: '申请成为陪玩前，请先验证邮箱或手机号其中一项。联系方式会保存在你的个人资料中。', later: '稍后处理', complete: '去完善并验证', close: '关闭提示',
  status: { PENDING: '申请中', ASSESSING: '考核中', APPROVED: '审核通过', REJECTED: '审核未通过' }
} : {
  eyebrow: 'Companion identity', title: 'Share the games you know with someone new.', body: 'Everyone begins as a Member. After applying and completing the offline assessment, Companion is added to your account.', apply: 'Become a companion', checking: 'Checking profile…', view: 'View application', security: 'View account contacts',
  contactEyebrow: 'Account contacts', contactTitle: 'Your contact signals', contactBody: 'Email and mobile are maintained in your profile. Verify either one to become eligible for a companion application.', contactReady: 'Application requirement met', contactPending: 'One verification needed',
  incompleteTitle: 'Your profile is incomplete', incompleteBody: 'Before applying, verify either your email address or mobile number. Your contact information is maintained in your profile.', later: 'Not now', complete: 'Complete and verify', close: 'Close message',
  status: { PENDING: 'Application sent', ASSESSING: 'Assessment', APPROVED: 'Approved', REJECTED: 'Not approved' }
})
const companionApplication = computed(() => companionApi.application.value)
const companionStatus = computed(() => companionApplication.value ? companionCopy.value.status[companionApplication.value.status] : '')

const regionOptions = computed(() => regions.value.flatMap(country => [country, ...(country.children || [])].map(region => ({
  code: region.code,
  label: `${region.parentCode ? '— ' : ''}${locale.value === 'zh' ? region.nameZh : region.nameEn}`
}))))
const regionName = computed(() => regionOptions.value.find(item => item.code === profile.value?.regionCode)?.label.replace('— ', '') || t('profile.notSet'))
const accountDisplay = computed(() => contactCompletion.value?.email || profile.value?.email || maskPhone(contactCompletion.value?.phone || profile.value?.phone) || '—')
const selectedRegionName = computed(() => regionOptions.value.find(item => item.code === form.regionCode)?.label.replace('— ', '') || t('profile.notSet'))
const filteredRegions = computed(() => {
  const query = regionSearch.value.trim().toLocaleLowerCase()
  if (!query) return regions.value
  return regions.value.flatMap(country => {
    const countryMatches = [country.code, country.nameZh, country.nameEn].some(value => value.toLocaleLowerCase().includes(query))
    const matchingChildren = (country.children || []).filter(child => [child.code, child.nameZh, child.nameEn].some(value => value.toLocaleLowerCase().includes(query)))
    return countryMatches || matchingChildren.length ? [{ ...country, children: countryMatches ? country.children : matchingChildren }] : []
  })
})
const avatarName = computed(() => (editing.value ? form.nickname : profile.value?.nickname || '').trim())
const initials = computed(() => avatarName.value ? avatarName.value.slice(0, 1).toLocaleUpperCase() : '✦')
const hasAvatar = computed(() => Boolean((editing.value ? form.avatarUrl : profile.value?.avatarUrl) && !avatarLoadFailed.value))
const regionLabel = (region: RegionNode) => locale.value === 'zh' ? region.nameZh : region.nameEn
const countryExpanded = (code: string) => Boolean(regionSearch.value.trim()) || expandedCountries.value.includes(code)
const toggleCountry = (code: string) => { expandedCountries.value = expandedCountries.value.includes(code) ? expandedCountries.value.filter(item => item !== code) : [...expandedCountries.value, code] }
const selectRegion = (code: string) => { form.regionCode = code; regionPickerOpen.value = false; regionSearch.value = '' }

const syncForm = () => {
  if (!profile.value) return
  Object.assign(form, {
    nickname: profile.value.nickname || '', gender: profile.value.gender || 'UNDISCLOSED', avatarObjectKey: profile.value.avatarObjectKey || '', avatarUrl: profile.value.avatarUrl || '',
    birthDate: profile.value.birthDate || '', bio: profile.value.bio || '', regionCode: profile.value.regionCode || '',
    tagIds: profile.value.tags.map(tag => tag.id), privacyAnonymous: profile.value.privacyAnonymous
  })
  const parent = regions.value.find(country => country.children?.some(child => child.code === profile.value?.regionCode))
  if (parent && !expandedCountries.value.includes(parent.code)) expandedCountries.value.push(parent.code)
}
const startEditing = () => { syncForm(); avatarLoadFailed.value = false; feedback.value = ''; error.value = ''; editing.value = true }
const cancelEditing = () => { syncForm(); editing.value = false; regionPickerOpen.value = false; error.value = '' }
const toggleTag = (id: number) => { form.tagIds = form.tagIds.includes(id) ? form.tagIds.filter(item => item !== id) : [...form.tagIds, id] }
const handleAvatar = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { error.value = t('profile.avatarError'); return }
  avatarUploading.value = true; error.value = ''
  try { const uploaded = await api.uploadAvatar(file); form.avatarObjectKey = uploaded.objectKey; form.avatarUrl = uploaded.url; avatarLoadFailed.value = false } catch (cause) { error.value = cause instanceof Error ? cause.message : t('profile.loadError') } finally { avatarUploading.value = false }
}
const saveProfile = async () => {
  saving.value = true; error.value = ''; feedback.value = ''
  try {
    await api.updateProfile({ nickname: form.nickname || null, gender: form.gender, avatarObjectKey: form.avatarObjectKey || null, birthDate: form.birthDate || null, bio: form.bio || null, regionCode: form.regionCode || null })
    await Promise.all([api.updateTags(form.tagIds), api.updatePrivacy(form.privacyAnonymous)])
    profile.value = await api.getProfile(); avatarLoadFailed.value = false; userName.value = profile.value.nickname || userName.value; userAvatarUrl.value = profile.value.avatarUrl || ''
    editing.value = false; feedback.value = t('profile.saved')
  } catch (cause) { error.value = cause instanceof Error ? cause.message : t('profile.loadError') } finally { saving.value = false }
}

const handleContactState = (state: AccountCompletion) => {
  contactCompletion.value = state
}

const scrollToContactVerification = async () => {
  eligibilityDialogOpen.value = false
  await nextTick()
  document.getElementById('contact-verification')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleCompanionAction = async () => {
  companionEligibilityError.value = ''
  if (companionApplication.value) {
    await navigateTo('/companion/application')
    return
  }
  checkingCompanionEligibility.value = true
  try {
    const state = await companionApi.loadAccountCompletion()
    contactCompletion.value = state
    if (state.companionApplicationAllowed) await navigateTo('/companion/apply')
    else eligibilityDialogOpen.value = true
  } catch (cause) {
    companionEligibilityError.value = cause instanceof Error ? cause.message : 'Unable to check account contacts'
  } finally {
    checkingCompanionEligibility.value = false
  }
}

onMounted(async () => {
  if (!authenticated.value) return navigateTo('/auth')
  try {
    const [current, availableTags, regionTree] = await Promise.all([api.getProfile(), api.getTags(), api.getRegions()])
    profile.value = current; userAvatarUrl.value = current.avatarUrl || ''; userName.value = current.nickname || userName.value; tags.value = availableTags; regions.value = regionTree; syncForm()
    try { await companionApi.loadMyApplication() } catch { /* The application API is deployed separately from the profile API. */ }
  } catch (cause) { error.value = cause instanceof Error ? cause.message : t('profile.loadError') } finally { loading.value = false }
  if (route.query.complete === 'contact' || route.hash === '#contact-verification') await scrollToContactVerification()
})

const walletAction = (action: 'topup' | 'withdraw') => { notice.value = t(action === 'topup' ? 'profile.topupNotice' : 'profile.withdrawNotice') }
const games = [{ name: 'League of Legends', short: 'LOL', hours: '42.5h', rank: 'Emerald II', color: '#c9a566' }, { name: 'VALORANT', short: 'VAL', hours: '26h', rank: 'Platinum I', color: '#d88f9d' }, { name: 'Counter-Strike 2', short: 'CS2', hours: '18.5h', rank: 'Gold Nova', color: '#80b3c4' }]
const achievements = [{ icon: '✦', title: 'First constellation', note: 'Your first session together', unlocked: true }, { icon: '♢', title: 'Kindred signal', note: 'Affinity level 3 reached', unlocked: true }, { icon: '✧', title: 'Gifted light', note: 'Sent 12 keepsakes', unlocked: true }, { icon: '☾', title: 'Night archive', note: 'Complete 10 sessions', unlocked: false }]
const orders = [{ id: '#MK-24108', date: 'Aug 19, 2026', game: 'League of Legends', person: 'Mika Sol', role: 'Companion', duration: '2h 30m', amount: '$40.00', status: 'Complete' }, { id: '#MK-23991', date: 'Aug 14, 2026', game: 'Counter-Strike 2', person: 'Noah Ryn', role: 'Companion', duration: '1h 45m', amount: '$35.00', status: 'Complete' }, { id: '#MK-23876', date: 'Aug 08, 2026', game: 'VALORANT', person: 'Ari Vale', role: 'Boss', duration: '3h 00m', amount: '$54.00', status: 'Complete' }]
</script>

<template>
  <div v-if="authenticated" class="profile-page section-wrap">
    <section class="profile-overview" aria-labelledby="profile-title">
      <div v-if="loading" class="profile-loading">{{ t('profile.loading') }}</div>
      <template v-else-if="profile">
        <div class="profile-overview-head">
          <div class="profile-overview-identity">
            <div class="profile-avatar" :class="{ 'fallback-mark': initials === '✦' }"><img v-if="hasAvatar" :src="profile.avatarUrl || ''" alt="" @error="avatarLoadFailed = true"><span v-else>{{ initials }}</span></div>
            <div><p class="eyebrow"><span />{{ t('profile.eyebrow') }}</p><h1 id="profile-title">{{ t('profile.greeting') }}, {{ profile.nickname || userName || 'Stargazer' }}.</h1><p>{{ profile.bio || t('profile.subtitle') }}</p></div>
          </div>
          <div class="profile-overview-actions">
            <button v-if="!editing" class="button button-ghost profile-edit-button" @click="startEditing">{{ t('profile.edit') }} <span>↗</span></button>
            <div class="profile-level"><span>{{ t('profile.membership') }}</span><strong>LV. 03</strong><small>6,840 / 10,000 glow</small></div>
          </div>
        </div>
        <form v-if="editing" class="profile-editor" @submit.prevent="saveProfile">
          <div class="profile-avatar-panel">
            <div class="profile-avatar large" :class="{ 'fallback-mark': initials === '✦' }"><img v-if="hasAvatar" :src="form.avatarUrl" alt="" @error="avatarLoadFailed = true"><span v-else>{{ initials }}</span></div>
            <label class="avatar-upload"><input type="file" accept="image/*" @change="handleAvatar"><span>{{ avatarUploading ? t('profile.uploading') : t('profile.changeAvatar') }}</span></label>
            <small>{{ t('profile.avatarHint') }}</small>
          </div>
          <div class="profile-fields">
            <label><span>{{ t('profile.nickname') }}</span><input v-model.trim="form.nickname" maxlength="40"></label>
            <label><span>{{ t('profile.gender') }}</span><select v-model="form.gender"><option value="UNDISCLOSED">{{ t('profile.genderUndisclosed') }}</option><option value="FEMALE">{{ t('profile.genderFemale') }}</option><option value="MALE">{{ t('profile.genderMale') }}</option></select></label>
            <label><span>{{ t('profile.birthDate') }}</span><input v-model="form.birthDate" type="date"></label>
            <div class="region-field"><span>{{ t('profile.region') }}</span><div class="region-picker" :class="{ open: regionPickerOpen }"><button type="button" class="region-picker-trigger" :aria-expanded="regionPickerOpen" @click="regionPickerOpen = !regionPickerOpen"><span>{{ selectedRegionName }}</span><i>⌄</i></button><div v-if="regionPickerOpen" class="region-picker-popover"><div class="region-search"><span aria-hidden="true">⌕</span><input v-model="regionSearch" type="search" :placeholder="t('profile.regionSearch')" autofocus @keydown.esc="regionPickerOpen = false"></div><div class="region-tree"><button type="button" class="region-clear" :class="{ selected: !form.regionCode }" @click="selectRegion('')"><span>○</span>{{ t('profile.notSet') }}</button><div v-for="country in filteredRegions" :key="country.code" class="region-country"><div class="region-country-row"><button type="button" class="region-expand" :aria-label="t('profile.regionToggle')" @click="toggleCountry(country.code)">{{ countryExpanded(country.code) ? '−' : '+' }}</button><button type="button" class="region-option country-option" :class="{ selected: form.regionCode === country.code }" @click="selectRegion(country.code)"><span>{{ regionLabel(country) }}</span><small>{{ country.code }}</small></button></div><div v-if="countryExpanded(country.code)" class="region-children"><button v-for="child in country.children" :key="child.code" type="button" class="region-option" :class="{ selected: form.regionCode === child.code }" @click="selectRegion(child.code)"><span>{{ regionLabel(child) }}</span><small>{{ child.code }}</small></button></div></div><p v-if="!filteredRegions.length" class="region-empty">{{ t('profile.regionEmpty') }}</p></div></div></div></div>
            <label class="profile-field-wide"><span>{{ t('profile.bio') }}</span><textarea v-model="form.bio" maxlength="240" rows="3" :placeholder="t('profile.bioPlaceholder')" /><small>{{ form.bio.length }} / 240</small></label>
            <fieldset class="profile-field-wide"><legend>{{ t('profile.tags') }}</legend><div class="profile-tags"><button v-for="tag in tags" :key="tag.id" type="button" :class="{ selected: form.tagIds.includes(tag.id) }" @click="toggleTag(tag.id)">{{ tag.label }}</button></div></fieldset>
            <label class="privacy-toggle profile-field-wide"><input v-model="form.privacyAnonymous" type="checkbox"><i /><span><strong>{{ t('profile.anonymous') }}</strong><small>{{ t('profile.anonymousHint') }}</small></span></label>
            <div class="profile-form-actions profile-field-wide"><button type="button" class="button button-ghost" @click="cancelEditing">{{ t('profile.cancel') }}</button><button class="button button-primary" :disabled="saving || avatarUploading">{{ saving ? t('profile.saving') : t('profile.save') }} <span>→</span></button></div>
          </div>
        </form>
        <div v-else class="profile-overview-details">
          <div class="profile-tags"><span v-for="tag in profile.tags" :key="tag.id">{{ tag.label }}</span><span v-if="!profile.tags.length">{{ t('profile.noTags') }}</span></div>
          <dl><div><dt>{{ t('profile.account') }}</dt><dd>{{ accountDisplay }}</dd></div><div><dt>{{ t('profile.region') }}</dt><dd>{{ regionName }}</dd></div><div><dt>{{ t('profile.birthDate') }}</dt><dd>{{ profile.birthDate || t('profile.notSet') }}</dd></div><div><dt>{{ t('profile.rankingPrivacy') }}</dt><dd>{{ profile.privacyAnonymous ? t('profile.anonymousOn') : t('profile.anonymousOff') }}</dd></div></dl>
        </div>
      </template>
      <p v-if="feedback" class="profile-feedback success" role="status">{{ feedback }}</p><p v-if="error" class="profile-feedback error" role="alert">{{ error }}</p>
    </section>

    <section class="profile-section companion-identity-card">
      <div class="companion-identity-copy">
        <p class="eyebrow"><span />{{ companionCopy.eyebrow }}</p>
        <h2>{{ companionCopy.title }}</h2>
        <p>{{ companionCopy.body }}</p>
        <div class="companion-identity-actions">
          <button type="button" class="button button-primary" :disabled="checkingCompanionEligibility" @click="handleCompanionAction">{{ companionApplication ? companionCopy.view : checkingCompanionEligibility ? companionCopy.checking : companionCopy.apply }} <span>→</span></button>
          <button type="button" class="button button-ghost" @click="scrollToContactVerification">{{ companionCopy.security }}</button>
        </div>
        <p v-if="companionEligibilityError" class="companion-feedback error" role="alert">{{ companionEligibilityError }}</p>
      </div>
      <div class="companion-identity-orbit" :class="companionApplication?.status.toLowerCase() || 'member'" aria-hidden="true">
        <i /><span>{{ companionApplication ? companionStatus : 'MEMBER' }}</span><small>{{ companionApplication?.id || 'COMPANION PATH' }}</small>
      </div>
    </section>

    <section id="contact-verification" class="profile-section profile-contact-section" aria-labelledby="contact-verification-title">
      <div class="profile-section-heading contact-section-heading">
        <div><p class="eyebrow"><span />{{ companionCopy.contactEyebrow }}</p><h2 id="contact-verification-title">{{ companionCopy.contactTitle }}</h2><p>{{ companionCopy.contactBody }}</p></div>
        <span class="contact-readiness" :class="{ ready: contactCompletion?.companionApplicationAllowed }"><i>{{ contactCompletion?.companionApplicationAllowed ? '✓' : '!' }}</i>{{ contactCompletion?.companionApplicationAllowed ? companionCopy.contactReady : companionCopy.contactPending }}</span>
      </div>
      <ContactVerificationPanel @state="handleContactState" />
    </section>

    <section class="profile-section"><div class="profile-section-heading"><div><p class="eyebrow"><span />{{ t('profile.gamesEyebrow') }}</p><h2>{{ t('profile.games') }}</h2></div><span>{{ t('profile.totalTime') }} <b>87h</b></span></div><div class="game-grid"><article v-for="game in games" :key="game.name" class="game-card" :style="{ '--game-accent': game.color }"><span class="game-short">{{ game.short }}</span><div><h3>{{ game.name }}</h3><p>{{ game.rank }}</p></div><strong>{{ game.hours }}</strong></article></div></section>
    <section class="profile-section wallet-section"><div class="wallet-card"><div><p class="eyebrow"><span />{{ t('profile.walletEyebrow') }}</p><h2>{{ t('profile.wallet') }}</h2><small>{{ t('profile.available') }}</small><strong class="wallet-balance">$128.50</strong></div><div class="wallet-actions"><button class="button button-primary" @click="walletAction('topup')">{{ t('profile.topup') }} <span>→</span></button><button class="button button-ghost" @click="walletAction('withdraw')">{{ t('profile.withdraw') }} <span>→</span></button></div></div><p v-if="notice" class="wallet-notice" role="status">{{ notice }}</p></section>
    <section class="profile-section achievement-layout"><div><p class="eyebrow"><span />{{ t('profile.achievementsEyebrow') }}</p><h2>{{ t('profile.achievements') }}</h2><p class="profile-muted">{{ t('profile.achievementsBody') }}</p><div class="intimacy-meter"><div><span>{{ t('profile.intimacy') }}</span><strong>1,680 / 2,000</strong></div><i><b /></i><small>{{ t('profile.intimacyNext') }}</small></div></div><div class="achievement-grid"><article v-for="item in achievements" :key="item.title" class="profile-achievement" :class="{ locked: !item.unlocked }"><span>{{ item.icon }}</span><div><strong>{{ item.title }}</strong><small>{{ item.note }}</small></div></article></div></section>
    <section class="profile-section orders-section"><div class="profile-section-heading"><div><p class="eyebrow"><span />{{ t('profile.ordersEyebrow') }}</p><h2>{{ t('profile.orders') }}</h2></div><span>{{ t('profile.ordersHint') }}</span></div><div class="orders-table"><div class="order-row order-head"><span>{{ t('profile.order') }}</span><span>{{ t('profile.session') }}</span><span>{{ t('profile.duration') }}</span><span>{{ t('profile.total') }}</span><span>{{ t('profile.status') }}</span></div><article v-for="order in orders" :key="order.id" class="order-row"><div><strong>{{ order.id }}</strong><small>{{ order.date }}</small></div><div><strong>{{ order.game }}</strong><small>{{ order.role }} · {{ order.person }}</small></div><span>{{ order.duration }}</span><strong>{{ order.amount }}</strong><em>{{ order.status }}</em></article></div></section>

    <div v-if="eligibilityDialogOpen" class="eligibility-dialog-backdrop" role="presentation" @click.self="eligibilityDialogOpen = false" @keydown.esc="eligibilityDialogOpen = false">
      <section class="eligibility-dialog" role="dialog" aria-modal="true" aria-labelledby="eligibility-dialog-title">
        <button type="button" class="eligibility-dialog-close" :aria-label="companionCopy.close" @click="eligibilityDialogOpen = false">×</button>
        <div class="eligibility-dialog-mark" aria-hidden="true"><i>!</i><span>✦</span></div>
        <p class="eyebrow"><span />ACCOUNT SIGNAL REQUIRED</p>
        <h2 id="eligibility-dialog-title">{{ companionCopy.incompleteTitle }}</h2>
        <p>{{ companionCopy.incompleteBody }}</p>
        <div class="eligibility-dialog-actions"><button type="button" class="button button-ghost" @click="eligibilityDialogOpen = false">{{ companionCopy.later }}</button><button type="button" class="button button-primary" autofocus @click="scrollToContactVerification">{{ companionCopy.complete }} <span>→</span></button></div>
      </section>
    </div>
  </div>
</template>
