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
const showSpotlight = computed(() => !loading.value && !error.value && pageNum.value === 1 && !query.value.trim() && activeTagId.value === null && companions.value.length > 0)
const featured = computed(() => companions.value[0] || null)
const spotlightSide = computed(() => companions.value.slice(1, 3))
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
const goPage = (page: number) => { pageNum.value = page; loadCompanions(); window.scrollTo({ top: 280, behavior: 'smooth' }) }
const toggleSaved = (userId: string) => {
  saved.value = saved.value.includes(userId) ? saved.value.filter(item => item !== userId) : [...saved.value, userId]
  localStorage.setItem('mystikos-saved-companions', JSON.stringify(saved.value))
}
const coverOf = (person: PublicShowcaseCard) => person.coverPhotoUrl || person.avatarUrl || ''
const tagIcon = (label: string) => {
  const normalized = label.toLowerCase()
  if (normalized.includes('英雄联盟') || normalized.includes('league')) return 'L'
  if (normalized.includes('王者')) return '◈'
  if (normalized.includes('和平') || normalized.includes('pubg')) return '⌖'
  if (normalized.includes('原神') || normalized.includes('genshin')) return '✧'
  if (normalized.includes('cs')) return '⬡'
  return '◇'
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
  <div class="companion-directory club-skin">
    <header class="directory-hero">
      <div class="directory-hero-scenery" aria-hidden="true">
        <i class="hero-moon" />
        <i class="hero-city" />
        <i class="hero-sofa" />
        <i class="hero-cat">◆</i>
      </div>
      <div class="directory-hero-content">
        <p class="eyebrow"><span />{{ t('directory.eyebrow') }}</p>
        <h1>{{ t('directory.title') }}</h1>
        <p class="directory-hero-meta">
          <strong>{{ t('directory.count', { count: total }) }}</strong>
          <span>·</span> {{ t('directory.heroHint') }}
        </p>
      </div>

    </header>

    <section class="directory-toolbar" :aria-label="t('directory.filterLabel')">
      <label class="directory-search">
        <span class="directory-search-icon" aria-hidden="true">⌕</span>
        <input v-model="query" type="search" :placeholder="t('directory.search')" @keyup.enter="loadCompanions">
        <button type="button" :aria-label="t('directory.search')" @click="loadCompanions">→</button>
      </label>
      <div class="directory-filters">
        <button type="button" :class="{ active: activeTagId === null }" @click="selectTag(null)"><i aria-hidden="true">★</i>{{ t('directory.all') }}</button>
        <button v-for="tag in tags" :key="tag.id" type="button" :class="{ active: activeTagId === tag.id }" @click="selectTag(tag.id)"><i aria-hidden="true">{{ tagIcon(tag.label) }}</i>{{ tag.label }}</button>
      </div>
    </section>

    <section v-if="showSpotlight" class="directory-spotlight" aria-labelledby="directory-spotlight-title">
      <div class="directory-section-head">
        <h2 id="directory-spotlight-title"><i aria-hidden="true">♛</i>{{ t('directory.spotlight') }}</h2>
        <span class="directory-preview-badge">{{ t('preview.badge') }}</span>
      </div>
      <div class="directory-spotlight-grid">
        <article v-if="featured" class="directory-card is-feature" :style="{ '--companion-accent': companionAccent(featured.userId) }">
          <button class="directory-favorite" :class="{ saved: saved.includes(featured.userId) }" type="button" :aria-label="t(saved.includes(featured.userId) ? 'directory.unsave' : 'directory.save', { name: featured.nickname })" @click="toggleSaved(featured.userId)">{{ saved.includes(featured.userId) ? '♥' : '♡' }}</button>
          <NuxtLink class="directory-card-link" :to="`/companions/${featured.userId}`">
            <div class="directory-media" :class="{ 'has-media': Boolean(coverOf(featured)) }">
              <img v-if="coverOf(featured)" :src="coverOf(featured)" :alt="featured.nickname">
              <span v-else class="directory-portrait-mark" aria-hidden="true">{{ featured.nickname?.charAt(0).toUpperCase() || '?' }}</span>
              <em class="directory-status-chip"><i />{{ featured.availability || t('directory.available') }}</em>
            </div>
            <div class="directory-card-body">
              <h3>{{ featured.nickname }}</h3>
              <p>{{ featured.tagline || featured.bio || t('directory.noTagline') }}</p>
              <div v-if="featured.tags?.length" class="directory-tags">
                <span v-for="tag in featured.tags.slice(0, 4)" :key="tag.id">{{ tag.label }}</span>
              </div>
              <footer>
                <span>{{ t('directory.verified') }}</span>
                <b>{{ t('directory.orderNow') }} →</b>
              </footer>
              <div class="directory-card-actions" aria-hidden="true">
                <span>{{ t('directory.viewCard') }}</span>
                <strong>{{ t('directory.orderNow') }}</strong>
              </div>
            </div>
          </NuxtLink>
        </article>
        <div class="directory-spotlight-side">
          <article v-for="person in spotlightSide" :key="person.userId" class="directory-card is-compact" :style="{ '--companion-accent': companionAccent(person.userId) }">
            <button class="directory-favorite" :class="{ saved: saved.includes(person.userId) }" type="button" :aria-label="t(saved.includes(person.userId) ? 'directory.unsave' : 'directory.save', { name: person.nickname })" @click="toggleSaved(person.userId)">{{ saved.includes(person.userId) ? '♥' : '♡' }}</button>
            <NuxtLink class="directory-card-link" :to="`/companions/${person.userId}`">
              <div class="directory-media" :class="{ 'has-media': Boolean(coverOf(person)) }">
                <img v-if="coverOf(person)" :src="coverOf(person)" :alt="person.nickname">
                <span v-else class="directory-portrait-mark" aria-hidden="true">{{ person.nickname?.charAt(0).toUpperCase() || '?' }}</span>
              </div>
              <div class="directory-card-body">
                <h3>{{ person.nickname }}</h3>
                <p>{{ person.tagline || person.bio || t('directory.noTagline') }}</p>
                <div v-if="person.tags?.length" class="directory-tags">
                  <span v-for="tag in person.tags.slice(0, 2)" :key="tag.id">{{ tag.label }}</span>
                </div>
                <footer>
                  <span>{{ person.availability || t('directory.available') }}</span>
                  <b>{{ t('directory.viewCard') }} →</b>
                </footer>
              </div>
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <section class="directory-results">
      <div class="directory-heading">
        <h2>{{ t('directory.heading') }}</h2>
        <p>{{ t('directory.count', { count: total }) }}</p>
      </div>
      <div
        class="directory-grid"
        :class="{ 'directory-grid-loading': loading }"
        :aria-busy="loading || undefined"
        :aria-label="loading ? t('directory.loading') : undefined"
      >
        <template v-if="loading">
          <article v-for="item in 6" :key="`skeleton-${item}`" class="directory-card directory-skeleton" aria-hidden="true">
            <div class="directory-skeleton-media" />
            <div class="directory-skeleton-body">
              <span />
              <b />
              <i />
            </div>
          </article>
        </template>
        <div v-else-if="error" class="directory-empty is-error" role="alert">
          <span class="directory-empty-mark" aria-hidden="true">!</span>
          <strong>{{ t('directory.loadError') }}</strong>
          <span>{{ t('directory.retryHint') }}</span>
          <button type="button" class="button button-primary directory-empty-action" @click="loadCompanions">{{ t('directory.retry') }} <span aria-hidden="true">↻</span></button>
        </div>
        <template v-else-if="companions.length">
          <article v-for="person in companions" :key="person.userId" class="directory-card" :style="{ '--companion-accent': companionAccent(person.userId) }">
            <button class="directory-favorite" :class="{ saved: saved.includes(person.userId) }" type="button" :aria-label="t(saved.includes(person.userId) ? 'directory.unsave' : 'directory.save', { name: person.nickname })" @click="toggleSaved(person.userId)">{{ saved.includes(person.userId) ? '♥' : '♡' }}</button>
            <NuxtLink class="directory-card-link" :to="`/companions/${person.userId}`">
              <div class="directory-media" :class="{ 'has-media': Boolean(coverOf(person)) }">
                <img v-if="coverOf(person)" :src="coverOf(person)" :alt="person.nickname">
                <span v-else class="directory-portrait-mark" aria-hidden="true">{{ person.nickname?.charAt(0).toUpperCase() || '?' }}</span>
                <em class="directory-status-chip"><i />{{ person.availability || t('directory.available') }}</em>
              </div>
              <div class="directory-card-body">
                <h3>{{ person.nickname }}</h3>
                <p>{{ person.tagline || person.bio || t('directory.noTagline') }}</p>
                <div v-if="person.tags?.length" class="directory-tags">
                  <span v-for="tag in person.tags.slice(0, 3)" :key="tag.id">{{ tag.label }}</span>
                </div>
                <footer>
                  <span>{{ t('directory.verified') }}</span>
                  <b>{{ t('directory.viewCard') }} →</b>
                </footer>
                <div class="directory-card-actions" aria-hidden="true">
                  <span>{{ t('directory.viewCard') }}</span>
                  <strong>{{ t('directory.orderNow') }}</strong>
                </div>
              </div>
            </NuxtLink>
          </article>
        </template>
        <div v-else class="directory-empty">
          <span class="directory-empty-mark" aria-hidden="true">✧</span>
          <strong>{{ t('directory.empty') }}</strong>
          <span>{{ t('directory.emptyHint') }}</span>
        </div>
      </div>
      <nav v-if="!loading && !error && pageCount > 1" class="directory-pagination" :aria-label="t('directory.pagination')">
        <button type="button" :disabled="pageNum <= 1" @click="goPage(pageNum - 1)">{{ t('directory.previous') }}</button>
        <span>{{ t('directory.page', { page: pageNum, pages: pageCount }) }}</span>
        <button type="button" :disabled="pageNum >= pageCount" @click="goPage(pageNum + 1)">{{ t('directory.next') }}</button>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.directory-pagination { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 30px; }
.directory-pagination button { padding: 9px 16px; border-radius: 20px; cursor: pointer; }
.directory-pagination button:disabled { cursor: not-allowed; opacity: .4; }
</style>
