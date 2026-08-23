<script setup lang="ts">
import type { CompanionApplicationStatus } from '~/composables/useCompanionApplication'

const { locale } = useMystikos()
const { authenticated } = useDemoAuth()
const companionApi = useCompanionApplication()
const loading = ref(true)
const error = ref('')

const copy = computed(() => locale.value === 'zh' ? {
  eyebrow: '我的陪玩申请', title: '申请已经进入公会的星轨。', body: '考核在线下进行；管理员更新状态后，你可以在这里看到最新结果。', back: '返回个人中心',
  empty: '还没有陪玩申请', emptyBody: '准备好之后，提交你的游戏类型和联系方式。', apply: '开始申请', submitted: '提交时间', updated: '最后更新', contact: '联系方式', games: '申请游戏', applicant: '申请人', region: '地区', intro: '申请介绍', assessor: '考核人', result: '考核结果', opinion: '审核意见', pendingResult: '考核完成后将在这里更新。',
  status: { PENDING: '申请中', ASSESSING: '考核中', APPROVED: '审核通过', REJECTED: '审核未通过' }
} : {
  eyebrow: 'My companion application', title: 'Your application is moving through the guild.', body: 'Assessment happens offline. Return here whenever an administrator updates the review.', back: 'Back to profile',
  empty: 'No companion application yet', emptyBody: 'When you are ready, share your games and preferred contact.', apply: 'Start application', submitted: 'Submitted', updated: 'Last updated', contact: 'Contact', games: 'Games', applicant: 'Applicant', region: 'Region', intro: 'Introduction', assessor: 'Assessor', result: 'Assessment result', opinion: 'Review note', pendingResult: 'The result will appear here after the offline assessment.',
  status: { PENDING: 'Application sent', ASSESSING: 'Assessment', APPROVED: 'Approved', REJECTED: 'Not approved' }
})

const application = computed(() => companionApi.application.value)
const statusLabel = computed(() => application.value ? copy.value.status[application.value.status] : '')
const maskedContact = computed(() => {
  const value = application.value?.contactValue || ''
  if (application.value?.contactType === 'EMAIL') {
    const [name = '', domain] = value.split('@')
    return domain ? `${name.slice(0, 2)}***@${domain}` : value
  }
  return value.length > 7 ? `${value.slice(0, 4)}••••${value.slice(-4)}` : value
})
const railSteps = computed(() => {
  const app = application.value
  if (!app) return []
  const finalLabel = app.status === 'REJECTED' ? copy.value.status.REJECTED : copy.value.status.APPROVED
  return [copy.value.status.PENDING, copy.value.status.ASSESSING, finalLabel]
})
const railIndex = computed(() => {
  const status: CompanionApplicationStatus | undefined = application.value?.status
  return status === 'PENDING' ? 0 : status === 'ASSESSING' ? 1 : 2
})
const formatDate = (value: string) => new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

onMounted(async () => {
  if (!authenticated.value) return navigateTo('/auth')
  try { await companionApi.loadMyApplication() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Unable to load application' } finally { loading.value = false }
})
</script>

<template>
  <div class="companion-page section-wrap">
    <NuxtLink to="/profile" class="companion-back">← {{ copy.back }}</NuxtLink>
    <header class="companion-hero compact"><div><p class="eyebrow"><span />{{ copy.eyebrow }}</p><h1>{{ copy.title }}</h1><p>{{ copy.body }}</p></div><div v-if="application" class="application-status-stamp" :class="application.status.toLowerCase()"><small>{{ application.id }}</small><strong>{{ statusLabel }}</strong></div></header>

    <div v-if="loading" class="companion-loading">Loading application…</div>
    <section v-else-if="!application" class="application-empty"><div class="empty-orbit"><span>✦</span></div><p class="eyebrow"><span />{{ copy.eyebrow }}</p><h2>{{ copy.empty }}</h2><p>{{ copy.emptyBody }}</p><NuxtLink to="/companion/apply" class="button button-primary">{{ copy.apply }} →</NuxtLink></section>

    <template v-else>
      <ol class="status-rail">
        <li v-for="(step, index) in railSteps" :key="step" :class="{ active: index === railIndex, complete: index < railIndex, rejected: index === 2 && application.status === 'REJECTED' }"><i>{{ index < railIndex ? '✓' : index + 1 }}</i><span>{{ step }}</span></li>
      </ol>

      <section class="application-dossier">
        <div class="dossier-main">
          <div class="dossier-heading"><p class="eyebrow"><span />APPLICATION DOSSIER</p><h2>{{ application.applicantName }}</h2><p>{{ application.introduction }}</p></div>
          <dl class="dossier-meta"><div><dt>{{ copy.region }}</dt><dd>{{ application.regionCode || '—' }}</dd></div><div><dt>{{ copy.contact }}</dt><dd>{{ maskedContact }}</dd></div><div><dt>{{ copy.submitted }}</dt><dd>{{ formatDate(application.submittedAt) }}</dd></div><div><dt>{{ copy.updated }}</dt><dd>{{ formatDate(application.updatedAt) }}</dd></div></dl>
          <div class="dossier-games"><span>{{ copy.games }}</span><div><i v-for="tag in application.gameTags" :key="tag.id">{{ tag.label }}</i></div></div>
        </div>
        <aside class="assessment-panel">
          <p class="eyebrow"><span />OFFLINE ASSESSMENT</p>
          <div><small>{{ copy.assessor }}</small><strong>{{ application.assessor?.name || '—' }}</strong></div>
          <div><small>{{ copy.result }}</small><strong>{{ application.assessmentResult || copy.pendingResult }}</strong></div>
          <div v-if="application.reviewOpinion"><small>{{ copy.opinion }}</small><p>{{ application.reviewOpinion }}</p></div>
        </aside>
      </section>
    </template>
    <p v-if="error" class="companion-feedback error" role="alert">{{ error }}</p>
  </div>
</template>
