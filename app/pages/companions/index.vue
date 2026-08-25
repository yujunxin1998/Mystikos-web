<script setup lang="ts">
import type { ProfileTag } from '~/composables/useProfileApi'
import type { PublicShowcaseCard } from '~/composables/useCompanionShowcaseApi'
import { companionAccent } from '~/utils/companion-style.mjs'

const { t } = useMystikos()
const { getTags } = useProfileApi()
const { browsePublished } = useCompanionShowcaseApi()
const query = ref('')
const activeTagId = ref<number | null>(null)
const tags = ref<ProfileTag[]>([])
const companions = ref<PublicShowcaseCard[]>([])
const saved = ref<string[]>([])
const loading = ref(true)
const error = ref('')
const pageNum = ref(1)
const pageSize = 12
const total = ref(0)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
let searchTimer: ReturnType<typeof setTimeout> | undefined

const loadCompanions = async () => {
  loading.value = true
  error.value = ''
  try {
    const page = await browsePublished({ pageNum: pageNum.value, pageSize, tagId: activeTagId.value, keyword: query.value })
    companions.value = page.records || []
    total.value = page.total || 0
  } catch (cause) {
    companions.value = []
    total.value = 0
    error.value = cause instanceof Error ? cause.message : t('directory.loadError')
  } finally { loading.value = false }
}
const selectTag = (tagId: number | null) => { activeTagId.value = tagId; pageNum.value = 1; loadCompanions() }
const goPage = (page: number) => { pageNum.value = page; loadCompanions(); window.scrollTo({ top: 360, behavior: 'smooth' }) }
const toggleSaved = (userId: string) => {
  saved.value = saved.value.includes(userId) ? saved.value.filter(item => item !== userId) : [...saved.value, userId]
  localStorage.setItem('mystikos-saved-companions', JSON.stringify(saved.value))
}
watch(query, () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { pageNum.value = 1; loadCompanions() }, 350) })
onMounted(async () => {
  try { saved.value = JSON.parse(localStorage.getItem('mystikos-saved-companions') || '[]') } catch { saved.value = [] }
  const results = await Promise.allSettled([getTags(), loadCompanions()])
  if (results[0].status === 'fulfilled') tags.value = results[0].value
})
onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <main class="companion-directory section-wrap">
    <header class="directory-hero"><div><p class="eyebrow"><span />{{ t('directory.eyebrow') }}</p><h1>{{ t('directory.title') }}</h1></div><p><strong>{{ t('directory.open') }}</strong>{{ t('directory.intro') }}</p></header>
    <section class="directory-toolbar" :aria-label="t('directory.filterLabel')"><label class="directory-search"><span aria-hidden="true">⌕</span><input v-model="query" type="search" :placeholder="t('directory.search')"></label><div class="directory-filters"><button type="button" :class="{ active: activeTagId === null }" @click="selectTag(null)">{{ t('directory.all') }}</button><button v-for="tag in tags" :key="tag.id" type="button" :class="{ active: activeTagId === tag.id }" @click="selectTag(tag.id)">{{ tag.label }}</button></div></section>
    <section class="directory-results">
      <div class="directory-heading"><h2>{{ t('directory.heading') }}</h2><p>{{ t('directory.count', { count: total }) }}</p></div>
      <div class="directory-grid">
        <div v-if="loading" class="directory-empty"><strong>{{ t('directory.loading') }}</strong></div>
        <div v-else-if="error" class="directory-empty"><strong>{{ t('directory.loadError') }}</strong><span>{{ error }}</span><button type="button" class="button" @click="loadCompanions">{{ t('directory.retry') }}</button></div>
        <article v-for="person in companions" v-else :key="person.userId" class="directory-card" :style="{ '--companion-accent': companionAccent(person.userId) }">
          <button class="directory-favorite" :class="{ saved: saved.includes(person.userId) }" type="button" :aria-label="t(saved.includes(person.userId) ? 'directory.unsave' : 'directory.save', { name: person.nickname })" @click="toggleSaved(person.userId)">{{ saved.includes(person.userId) ? '♥' : '♡' }}</button>
          <NuxtLink :to="`/companions/${person.userId}`"><div class="directory-portrait"><img v-if="person.coverPhotoUrl || person.avatarUrl" :src="person.coverPhotoUrl || person.avatarUrl || ''" :alt="person.nickname"><span v-else>{{ person.nickname?.charAt(0).toUpperCase() || '?' }}</span><em><i />{{ person.availability || t('directory.available') }}</em></div><div class="directory-card-body"><div class="directory-person-title"><span class="directory-mini-avatar"><img v-if="person.avatarUrl" :src="person.avatarUrl" :alt="person.nickname"><b v-else>{{ person.nickname?.charAt(0).toUpperCase() || '?' }}</b></span><h3>{{ person.nickname }}</h3></div><p>{{ person.tagline || person.bio || t('directory.noTagline') }}</p><div class="directory-tags"><span v-for="tag in person.tags" :key="tag.id">{{ tag.label }}</span></div><footer><span>{{ t('directory.verified') }}</span><b>{{ t('directory.viewCard') }} →</b></footer></div></NuxtLink>
        </article>
        <div v-if="!loading && !error && !companions.length" class="directory-empty"><strong>{{ t('directory.empty') }}</strong><span>{{ t('directory.emptyHint') }}</span></div>
      </div>
      <nav v-if="!loading && !error && pageCount > 1" class="directory-pagination" :aria-label="t('directory.pagination')"><button type="button" :disabled="pageNum <= 1" @click="goPage(pageNum - 1)">{{ t('directory.previous') }}</button><span>{{ t('directory.page', { page: pageNum, pages: pageCount }) }}</span><button type="button" :disabled="pageNum >= pageCount" @click="goPage(pageNum + 1)">{{ t('directory.next') }}</button></nav>
    </section>
  </main>
</template>

<style scoped>
.directory-portrait > img { width: 100%; height: 100%; object-fit: cover; }
.directory-pagination { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 30px; }
.directory-pagination button { padding: 9px 16px; border: 1px solid var(--line); border-radius: 20px; background: var(--card); color: var(--ink); }
.directory-pagination button:disabled { cursor: not-allowed; opacity: .4; }
.directory-pagination span { color: var(--muted); font: 10px 'DM Mono', monospace; }
.directory-person-title { display:flex!important; align-items:center; justify-content:flex-start!important; gap:10px; }
.directory-mini-avatar { width:38px; height:38px; display:grid; flex:0 0 38px; place-items:center; overflow:hidden; border:1px solid var(--line); border-radius:50%; background:linear-gradient(145deg,var(--lav),var(--lav-deep)); color:var(--night); }
.directory-mini-avatar img { width:100%; height:100%; object-fit:cover; }
.directory-mini-avatar b { font:600 15px 'Playfair Display',serif; }
</style>
