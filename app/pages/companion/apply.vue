<script setup lang="ts">
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import type { ProfileTag, RegionNode, UserProfile } from '~/composables/useProfileApi'

const { locale } = useMystikos()
const { authenticated } = useDemoAuth()
const profileApi = useProfileApi()
const companionApi = useCompanionApplication()
const profile = ref<UserProfile | null>(null)
const tags = ref<ProfileTag[]>([])
const regions = ref<RegionNode[]>([])
const loading = ref(true)
const saving = ref(false)
const accepted = ref(false)
const error = ref('')
const phoneCountry = ref<CountryCode>('CN')
const form = reactive({ applicantName: '', gameNickname: '', regionCode: '', introduction: '', tagIds: [] as number[], contactType: 'PHONE' as 'PHONE' | 'EMAIL', contactValue: '' })

const copy = computed(() => locale.value === 'zh' ? {
  eyebrow: '申请成为陪玩', title: '把你擅长的游戏变成别人的好时光', body: '提交一份简洁的公会档案。考核在线下完成，页面只记录申请与审核状态。',
  back: '返回个人中心', blockedTitle: '账号资料还没有准备好', blockedBody: '请先完成邮箱或手机号其中一项认证。', complete: '完善账号资料',
  basics: '申请人资料', name: '申请人姓名或称呼', namePlaceholder: '管理员联系你时使用的称呼', gameNickname: '游戏昵称', gameNicknamePlaceholder: '填写考核时使用的游戏昵称', region: '所在国家或地区', intro: '自我介绍', introPlaceholder: '介绍你的游戏经验、沟通方式和擅长营造的游戏氛围…',
  games: '选择游戏类型', gamesHint: '至少选择一个，由全局游戏 Tag 目录提供。', contact: '首选联系方式', phone: '手机号', email: '邮箱', emailPlaceholder: 'contact@example.com', phonePlaceholder: '请输入本地手机号',
  agreement: '我确认以上信息真实有效，并同意管理员为审核与线下考核目的联系我。', submit: '提交陪玩申请', submitting: '正在提交…',
  required: '请完整填写申请资料并至少选择一个游戏类型。', invalidPhone: '请输入有效的国际手机号。', invalidEmail: '请输入有效的邮箱地址。', existing: '你已经提交过申请，正在前往申请详情。'
} : {
  eyebrow: 'Become a companion', title: 'Turn the games you know into someone else’s good night.', body: 'Share a concise guild dossier. Assessment happens offline; this page only records the application and review status.',
  back: 'Back to profile', blockedTitle: 'Your account is not ready yet', blockedBody: 'Verify either an email address or a mobile number first.', complete: 'Complete account details',
  basics: 'Applicant details', name: 'Name or preferred name', namePlaceholder: 'How administrators should address you', gameNickname: 'Game nickname', gameNicknamePlaceholder: 'Nickname used during the assessment', region: 'Country or region', intro: 'About your play style', introPlaceholder: 'Describe your experience, communication style, and the kind of game atmosphere you create…',
  games: 'Choose game types', gamesHint: 'Choose at least one from the global game tag catalogue.', contact: 'Preferred contact', phone: 'Mobile', email: 'Email', emailPlaceholder: 'contact@example.com', phonePlaceholder: 'Local mobile number',
  agreement: 'I confirm this information is accurate and consent to being contacted for review and offline assessment.', submit: 'Send application', submitting: 'Sending…',
  required: 'Complete the application and choose at least one game type.', invalidPhone: 'Enter a valid international phone number.', invalidEmail: 'Enter a valid email address.', existing: 'You already have an application. Opening its details.'
})

const regionOptions = computed(() => regions.value.flatMap(country => [country, ...(country.children || [])]).map(region => ({ code: region.code, label: locale.value === 'zh' ? region.nameZh : region.nameEn })))
const currentStep = computed(() => !companionApi.accountCompletion.value?.companionApplicationAllowed ? 1 : form.tagIds.length && form.introduction.trim().length >= 40 ? 3 : 2)
const toggleTag = (id: number) => { form.tagIds = form.tagIds.includes(id) ? form.tagIds.filter(item => item !== id) : [...form.tagIds, id] }

const submit = async () => {
  error.value = ''
  if (!form.applicantName.trim() || !form.gameNickname.trim() || !form.regionCode || form.introduction.trim().length < 40 || !form.tagIds.length || !accepted.value) { error.value = copy.value.required; return }
  let contactValue = form.contactValue.trim()
  let contactCountryCode = ''
  if (form.contactType === 'PHONE') {
    const parsed = parsePhoneNumberFromString(contactValue, phoneCountry.value)
    if (!parsed?.isValid()) { error.value = copy.value.invalidPhone; return }
    contactValue = parsed.nationalNumber
    contactCountryCode = `+${parsed.countryCallingCode}`
  } else {
    contactValue = contactValue.toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(contactValue)) { error.value = copy.value.invalidEmail; return }
  }
  saving.value = true
  try {
    await companionApi.submitApplication({
      ...form,
      applicantName: form.applicantName.trim(),
      gameNickname: form.gameNickname.trim(),
      introduction: form.introduction.trim(),
      contactValue,
      phoneCountry: contactCountryCode,
      gender: profile.value?.gender || null,
      birthDate: profile.value?.birthDate || null
    })
    await navigateTo('/companion/application')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : copy.value.required
  } finally { saving.value = false }
}

onMounted(async () => {
  if (!authenticated.value) return navigateTo('/auth')
  try {
    const [currentProfile, availableTags, regionTree, existing] = await Promise.all([profileApi.getProfile(), profileApi.getTags(), profileApi.getRegions(), companionApi.loadMyApplication()])
    if (existing) { await navigateTo('/companion/application'); return }
    profile.value = currentProfile; tags.value = availableTags; regions.value = regionTree
    const readiness = await companionApi.loadAccountCompletion()
    form.applicantName = currentProfile.nickname || ''
    form.gameNickname = currentProfile.nickname || ''
    form.regionCode = currentProfile.regionCode || ''
    if (readiness.phone) { form.contactType = 'PHONE'; form.contactValue = readiness.phone }
    else if (readiness.email) { form.contactType = 'EMAIL'; form.contactValue = readiness.email }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to prepare the application'
  } finally { loading.value = false }
})
</script>

<template>
  <div class="companion-page section-wrap">
    <NuxtLink to="/profile" class="companion-back">← {{ copy.back }}</NuxtLink>
    <header class="companion-hero">
      <div><p class="eyebrow"><span />{{ copy.eyebrow }}</p><h1>{{ copy.title }}</h1><p>{{ copy.body }}</p></div>
      <div class="companion-moon-mark" aria-hidden="true"><span>☾</span><i /></div>
    </header>
    <CompanionJourney :current="currentStep" />

    <div v-if="loading" class="companion-loading">Loading application…</div>
    <section v-else-if="!companionApi.accountCompletion.value?.companionApplicationAllowed" class="application-blocked">
      <span>!</span><div><h2>{{ copy.blockedTitle }}</h2><p>{{ copy.blockedBody }}</p></div><NuxtLink to="/profile?complete=contact#contact-verification" class="button button-primary">{{ copy.complete }} →</NuxtLink>
    </section>

    <form v-else class="application-form" @submit.prevent="submit">
      <section class="application-section">
        <div class="application-section-title"><span>01</span><div><h2>{{ copy.basics }}</h2><p>{{ copy.body }}</p></div></div>
        <div class="companion-fields">
          <label class="companion-field"><span>{{ copy.name }}</span><input v-model.trim="form.applicantName" maxlength="60" :placeholder="copy.namePlaceholder"></label>
          <label class="companion-field"><span>{{ copy.gameNickname }}</span><input v-model.trim="form.gameNickname" maxlength="64" :placeholder="copy.gameNicknamePlaceholder"></label>
          <label class="companion-field"><span>{{ copy.region }}</span><select v-model="form.regionCode"><option value="" disabled>—</option><option v-for="region in regionOptions" :key="region.code" :value="region.code">{{ region.label }}</option></select></label>
          <label class="companion-field companion-field-wide"><span>{{ copy.intro }}</span><textarea v-model="form.introduction" rows="6" minlength="40" maxlength="500" :placeholder="copy.introPlaceholder" /><small>{{ form.introduction.length }} / 500 · min 40</small></label>
        </div>
      </section>

      <section class="application-section">
        <div class="application-section-title"><span>02</span><div><h2>{{ copy.games }}</h2><p>{{ copy.gamesHint }}</p></div></div>
        <fieldset class="game-tag-picker"><legend class="sr-only">{{ copy.games }}</legend><button v-for="tag in tags" :key="tag.id" type="button" :class="{ selected: form.tagIds.includes(tag.id) }" @click="toggleTag(tag.id)"><i>{{ form.tagIds.includes(tag.id) ? '✓' : '+' }}</i>{{ tag.label }}</button></fieldset>
      </section>

      <section class="application-section">
        <div class="application-section-title"><span>03</span><div><h2>{{ copy.contact }}</h2><p>{{ locale === 'zh' ? '该联系方式只保存在本次申请中。' : 'This contact is stored with this application only.' }}</p></div></div>
        <div class="contact-choice"><button type="button" :class="{ selected: form.contactType === 'PHONE' }" @click="form.contactType = 'PHONE'; form.contactValue = ''">{{ copy.phone }}</button><button type="button" :class="{ selected: form.contactType === 'EMAIL' }" @click="form.contactType = 'EMAIL'; form.contactValue = ''">{{ copy.email }}</button></div>
        <InternationalPhoneField v-if="form.contactType === 'PHONE'" v-model="form.contactValue" v-model:country="phoneCountry" :label="copy.phone" :placeholder="copy.phonePlaceholder" />
        <label v-else class="companion-field companion-field-wide"><span>{{ copy.email }}</span><input v-model.trim="form.contactValue" type="email" autocomplete="email" :placeholder="copy.emailPlaceholder"></label>
      </section>

      <label class="application-agreement"><input v-model="accepted" type="checkbox"><i /> <span>{{ copy.agreement }}</span></label>
      <p v-if="error" class="companion-feedback error" role="alert">{{ error }}</p>
      <div class="application-submit"><p>{{ locale === 'zh' ? '提交后进入“申请中”，资料仅可由管理员调整。' : 'After sending, the application becomes read-only and enters review.' }}</p><button class="button button-primary" :disabled="saving">{{ saving ? copy.submitting : copy.submit }} →</button></div>
    </form>
  </div>
</template>
