<script setup lang="ts">
import { publicCompanions } from '~/data/companions'
import { bookingScheduleIssue, bookingScheduleSummary, defaultBookingSchedule, listBookingDates, suggestBookingTimes } from '~/utils/booking-schedule.mjs'
import { formatPlaybackTime, nextVoicePlaybackAction, playbackProgress, shouldHandleVoiceMediaEvent, transitionVoicePlayback } from '~/utils/voice-player.mjs'

type VoicePlaybackState = 'idle' | 'loading' | 'playing' | 'error'

type DetailPerson = {
  name: string
  avatarUrl: string | null
  coverUrl: string | null
  tagline: string
  bio: string
  availability: string
  tags: string[]
}

const route = useRoute()
const { t, locale } = useMystikos()
const { getPublished } = useCompanionShowcaseApi()
const { authenticated } = useDemoAuth()
const bookingApi = useBookingApi()
const { refresh: refreshBookingCart, openDrawer: openBookingCartDrawer } = useBookingCart()
const person = ref<DetailPerson | null>(null)
const companionId = ref<number | null>(null)
const loading = ref(true)
const error = ref('')
const gallery = ref<{ name: string; dataUrl: string }[]>([])
const bookingAction = ref<'order' | 'cart' | null>(null)
const bookingError = ref('')
const bookingNotice = ref('')
const durationHours = ref(1)
const bookingDate = ref('')
const bookingTime = ref('')
const showcaseVideos = ref<{ name: string; size: string; url: string }[]>([])
const showcaseAudios = ref<{ name: string; url: string }[]>([])
const activeVideo = ref<{ name: string; url: string } | null>(null)
const activeAudio = ref<number | null>(null)
const voiceAudioRefs = shallowRef<(HTMLAudioElement | null)[]>([])
const voiceDurations = ref<number[]>([])
const voicePositions = ref<number[]>([])
const voiceStates = ref<VoicePlaybackState[]>([])
const imageExpanded = ref(false)
const activePhoto = ref(0)
const videoCloseButton = ref<HTMLButtonElement | null>(null)
const imageCloseButton = ref<HTMLButtonElement | null>(null)
let modalReturnFocus: HTMLElement | null = null
let galleryTimer: ReturnType<typeof setInterval> | undefined
let voiceRequestToken = 0
const voiceReloadTimers = new Map<number, ReturnType<typeof setTimeout>>()
const voiceReloading = new Set<number>()
const voiceWaveform = [8, 14, 10, 19, 25, 16, 30, 21, 12, 26, 34, 19, 28, 16, 23, 32, 18, 27, 13, 22, 30, 17, 25, 11, 20, 28, 15, 23, 9, 18]

const bookingDates = computed(() => listBookingDates())
const bookingTimes = computed(() => suggestBookingTimes(bookingDate.value))
const selectedBooking = computed(() => bookingScheduleSummary(bookingDate.value, bookingTime.value, durationHours.value))
const bookingDateLabel = (dateValue: string) => new Date(`${dateValue}T12:00:00`).toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', weekday: 'short' })
const bookingRelativeDay = (index: number) => t(index === 0 ? 'public.bookToday' : index === 1 ? 'public.bookTomorrow' : 'public.bookDayAfter')
const durationEndLabel = (hours: number) => {
  const summary = bookingScheduleSummary(bookingDate.value, bookingTime.value, hours)
  if (!summary) return t('public.bookChooseTime')
  return `${summary.crossesDay ? `${t('public.bookNextDay')} ` : ''}${summary.endTime}`
}
const selectBookingDate = (dateValue: string) => {
  bookingDate.value = dateValue
  bookingTime.value = suggestBookingTimes(dateValue)[0] || ''
  bookingError.value = ''
  bookingNotice.value = ''
}
const selectBookingTime = (timeValue: string) => {
  bookingTime.value = timeValue
  bookingError.value = ''
  bookingNotice.value = ''
}
const requireBookingLogin = async () => {
  if (authenticated.value) return true
  await navigateTo(`/auth?redirect=${encodeURIComponent(route.fullPath)}`)
  return false
}
const submitBooking = async (mode: 'order' | 'cart') => {
  if (!companionId.value) return
  const issue = bookingScheduleIssue(bookingDate.value, bookingTime.value)
  if (issue) {
    bookingError.value = t(issue === 'missing' ? 'public.bookMissing' : issue === 'too-soon' ? 'public.bookTooSoon' : 'public.bookInvalid')
    return
  }
  if (!(await requireBookingLogin())) return
  const summary = selectedBooking.value
  if (!summary) return
  bookingAction.value = mode
  bookingError.value = ''
  bookingNotice.value = ''
  try {
    if (mode === 'cart') {
      await bookingApi.addBookingCartLine(companionId.value, summary.start.toISOString(), durationHours.value)
      bookingNotice.value = t('public.bookAdded')
      try {
        await refreshBookingCart()
        openBookingCartDrawer()
      } catch { /* 点单已成功加入，刷新侧栏失败时保留页面内成功提示，避免用户重复添加。 */ }
    } else {
      const bookingId = await bookingApi.createBooking(companionId.value, summary.start.toISOString(), durationHours.value)
      await navigateTo(`/bookings/${bookingId}`)
    }
  } catch (cause) {
    bookingError.value = cause instanceof Error ? cause.message : '创建点单失败'
  } finally { bookingAction.value = null }
}
useHead(() => ({ title: person.value ? `${person.value.name} · Mystikos Companion` : 'Mystikos Companion' }))
const stepPhoto = (direction: number) => {
  if (!gallery.value.length) return
  activePhoto.value = (activePhoto.value + direction + gallery.value.length) % gallery.value.length
}
const rememberModalFocus = () => {
  modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
}
const restoreModalFocus = () => {
  const target = modalReturnFocus
  modalReturnFocus = null
  nextTick(() => target?.focus())
}
const openVideo = (video: { name: string; url: string }) => {
  rememberModalFocus()
  activeVideo.value = video
  document.body.style.overflow = 'hidden'
  nextTick(() => videoCloseButton.value?.focus())
}
const closeVideo = () => {
  if (!activeVideo.value) return
  activeVideo.value = null
  document.body.style.overflow = ''
  restoreModalFocus()
}
const openImage = () => {
  rememberModalFocus()
  imageExpanded.value = true
  document.body.style.overflow = 'hidden'
  nextTick(() => imageCloseButton.value?.focus())
}
const closeImage = () => {
  if (!imageExpanded.value) return
  imageExpanded.value = false
  document.body.style.overflow = ''
  restoreModalFocus()
}
const bindVoiceAudio = (element: unknown, index: number) => {
  voiceAudioRefs.value[index] = element instanceof HTMLAudioElement ? element : null
}
const updateVoiceDuration = (index: number, event: Event) => {
  const audio = event.currentTarget as HTMLAudioElement
  voiceDurations.value[index] = Number.isFinite(audio.duration) ? audio.duration : 0
}
const updateVoicePosition = (index: number, event: Event) => {
  const audio = event.currentTarget as HTMLAudioElement
  voicePositions.value[index] = audio.currentTime
}
const voiceState = (index: number): VoicePlaybackState => voiceStates.value[index] || 'idle'
const setVoiceState = (index: number, event: 'request' | 'playing' | 'waiting' | 'failure' | 'pause' | 'ended') => {
  voiceStates.value[index] = transitionVoicePlayback(voiceState(index), event) as VoicePlaybackState
}
const reloadVoice = (index: number, audio: HTMLAudioElement) => {
  const existingTimer = voiceReloadTimers.get(index)
  if (existingTimer) clearTimeout(existingTimer)
  voiceReloading.add(index)
  audio.load()
  voiceReloadTimers.set(index, setTimeout(() => {
    voiceReloading.delete(index)
    voiceReloadTimers.delete(index)
  }, 250))
}
const toggleVoice = (index: number) => {
  const audio = voiceAudioRefs.value[index]
  if (!audio) return
  const state = voiceState(index)
  const action = nextVoicePlaybackAction(activeAudio.value, index, state === 'playing' || state === 'loading')
  if (action.command === 'pause') {
    voiceRequestToken += 1
    setVoiceState(index, 'pause')
    audio.pause()
    activeAudio.value = null
    return
  }
  const requestToken = ++voiceRequestToken
  voiceAudioRefs.value.forEach((item, itemIndex) => {
    if (item && itemIndex !== index) {
      setVoiceState(itemIndex, 'pause')
      item.pause()
    }
  })
  if (audio.ended) audio.currentTime = 0
  activeAudio.value = action.nextActiveIndex
  setVoiceState(index, 'request')
  if (state === 'error') {
    voiceDurations.value[index] = 0
    voicePositions.value[index] = 0
    reloadVoice(index, audio)
  }
  void audio.play()
    .then(() => {
      if (requestToken === voiceRequestToken && activeAudio.value === index && !audio.paused) setVoiceState(index, 'playing')
    })
    .catch(() => {
      if (requestToken !== voiceRequestToken || activeAudio.value !== index) return
      setVoiceState(index, 'failure')
      activeAudio.value = null
    })
}
const seekVoice = (index: number, event: Event) => {
  const audio = voiceAudioRefs.value[index]
  if (!audio) return
  const target = event.currentTarget as HTMLInputElement
  audio.currentTime = Number(target.value)
  voicePositions.value[index] = audio.currentTime
}
const handleVoicePause = (index: number, event: Event) => {
  const audio = event.currentTarget as HTMLAudioElement
  if (!shouldHandleVoiceMediaEvent({ activeIndex: activeAudio.value, eventIndex: index, event: 'pause', paused: audio.paused })) return
  if (audio.ended) {
    voicePositions.value[index] = 0
    setVoiceState(index, 'ended')
  } else if (voiceState(index) !== 'error') {
    setVoiceState(index, 'pause')
  }
  if (activeAudio.value === index) activeAudio.value = null
}
const handleVoicePlaying = (index: number) => {
  if (activeAudio.value !== index) return
  setVoiceState(index, 'playing')
}
const handleVoiceWaiting = (index: number) => {
  if (activeAudio.value !== index || voiceState(index) === 'error') return
  setVoiceState(index, 'waiting')
}
const failVoice = (index: number) => {
  voiceRequestToken += 1
  setVoiceState(index, 'failure')
  activeAudio.value = null
}
const handleVoiceError = (index: number, event: Event) => {
  const audio = event.currentTarget as HTMLAudioElement
  if (!shouldHandleVoiceMediaEvent({ activeIndex: activeAudio.value, eventIndex: index, event: 'error', hasMediaError: Boolean(audio.error) })) return
  failVoice(index)
}
const handleVoiceAbort = (index: number) => {
  if (!shouldHandleVoiceMediaEvent({ activeIndex: activeAudio.value, eventIndex: index, event: 'abort', reloading: voiceReloading.has(index) })) return
  failVoice(index)
}
const handleVoiceEnded = (index: number, event: Event) => {
  const audio = event.currentTarget as HTMLAudioElement
  if (!shouldHandleVoiceMediaEvent({ activeIndex: activeAudio.value, eventIndex: index, event: 'ended', ended: audio.ended })) return
  voicePositions.value[index] = 0
  setVoiceState(index, 'ended')
  if (activeAudio.value === index) activeAudio.value = null
}
const onKeydown = (event: KeyboardEvent) => { if (event.key === 'Escape') { closeVideo(); closeImage() } }
const loadDetail = async () => {
  const id = String(route.params.slug)
  try {
    if (/^\d+$/.test(id)) {
      companionId.value = Number(id)
      const detail = await getPublished(id)
      person.value = {
        name: detail.nickname,
        avatarUrl: detail.avatarUrl,
        coverUrl: detail.coverUrl,
        tagline: detail.tagline || '',
        bio: detail.bio || '',
        availability: detail.availability || '',
        tags: detail.tags.map(tag => tag.label)
      }
      gallery.value = detail.photoUrls.map((url, index) => ({ name: `${detail.nickname}-${index + 1}`, dataUrl: url }))
      if (!gallery.value.length && detail.coverUrl) gallery.value = [{ name: detail.nickname, dataUrl: detail.coverUrl }]
      showcaseVideos.value = detail.videoUrls.map((url, index) => ({ name: `${t('public.highlight')} ${String(index + 1).padStart(2, '0')}`, size: '', url }))
      showcaseAudios.value = detail.audioUrls.map((url, index) => ({ name: `${t('public.voice')} ${String(index + 1).padStart(2, '0')}`, url }))
    } else {
      const legacy = publicCompanions.find(item => item.slug === id)
      if (!legacy) throw new Error(locale.value === 'zh' ? '陪玩名片不存在或尚未发布' : 'Companion card not found or not published')
      person.value = { name: legacy.name, avatarUrl: null, coverUrl: null, tagline: locale.value === 'zh' ? legacy.tagline : legacy.taglineEn, bio: locale.value === 'zh' ? legacy.bio : legacy.bioEn, availability: locale.value === 'zh' ? legacy.status : legacy.statusEn, tags: locale.value === 'zh' ? legacy.games : legacy.gamesEn }
      const draft = JSON.parse(localStorage.getItem('mystikos-companion-card-draft') || '{}')
      if (legacy.slug === 'ari-vale') {
        if (Array.isArray(draft.photos)) gallery.value = draft.photos
        if (Array.isArray(draft.videos)) showcaseVideos.value = draft.videos.slice(0, 5)
        if (Array.isArray(draft.audios)) showcaseAudios.value = draft.audios.slice(0, 3)
      }
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : (locale.value === 'zh' ? '名片加载失败' : 'Unable to load card')
  } finally { loading.value = false }
}
onMounted(() => {
  const initialSchedule = defaultBookingSchedule()
  bookingDate.value = initialSchedule.date
  bookingTime.value = initialSchedule.time
  loadDetail()
  window.addEventListener('keydown', onKeydown)
  galleryTimer = setInterval(() => { if (gallery.value.length > 1) stepPhoto(1) }, 4200)
})
onBeforeUnmount(() => {
  if (galleryTimer) clearInterval(galleryTimer)
  voiceRequestToken += 1
  voiceReloadTimers.forEach(timer => clearTimeout(timer))
  voiceReloadTimers.clear()
  voiceReloading.clear()
  voiceAudioRefs.value.forEach(audio => audio?.pause())
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="public-companion-profile club-skin">
    <div class="section-wrap"><NuxtLink to="/companions" class="public-profile-back">← {{ t('public.back') }}</NuxtLink></div>
    <div v-if="loading" class="public-profile-state section-wrap">{{ t('directory.loading') }}</div>
    <div v-else-if="error" class="public-profile-state section-wrap"><strong>{{ error }}</strong><NuxtLink to="/companions" class="button button-primary">{{ t('public.back') }}</NuxtLink></div>
    <template v-else-if="person">
      <section class="club-detail-grid section-wrap">
        <section class="club-panel club-identity" aria-labelledby="club-profile-name">
          <div class="club-identity-cover">
            <img v-if="person.coverUrl" :src="person.coverUrl" :alt="person.name">
            <span v-else aria-hidden="true">✦</span>
          </div>
          <div class="club-avatar">
            <img v-if="person.avatarUrl" :src="person.avatarUrl" :alt="person.name">
            <span v-else>{{ person.name.charAt(0).toUpperCase() }}</span>
          </div>
          <h1 id="club-profile-name">{{ person.name }}</h1>
          <p class="tagline">{{ person.tagline || t('directory.noTagline') }}</p>
          <p class="club-verified">✦ {{ t('public.verified') }}</p>
          <div class="club-tags"><span v-for="tag in person.tags" :key="tag">{{ tag }}</span></div>
          <p class="club-identity-bio">{{ person.bio || t('directory.noTagline') }}</p>
          <p class="club-availability"><i />{{ person.availability || t('directory.available') }}</p>
        </section>

        <div class="club-panel club-gallery">
          <div v-if="gallery.length" class="club-gallery-main">
            <button type="button" class="public-gallery-expand" :aria-label="t('public.photoAlt', { name: person.name, count: activePhoto + 1 })" @click="openImage">
              <img :src="gallery[activePhoto]?.dataUrl" :alt="t('public.photoAlt', { name: person.name, count: activePhoto + 1 })">
            </button>
            <div class="club-gallery-caption">
              <strong>{{ person.name }}</strong>
              <span>{{ person.tagline || t('directory.noTagline') }}</span>
            </div>
            <button v-if="gallery.length > 1" type="button" class="club-gallery-step previous" :aria-label="t('public.previousPhoto')" @click="stepPhoto(-1)">←</button>
            <button v-if="gallery.length > 1" type="button" class="club-gallery-step next" :aria-label="t('public.nextPhoto')" @click="stepPhoto(1)">→</button>
          </div>
          <div v-else class="club-gallery-main" :style="person.coverUrl ? { backgroundImage: `url(${person.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined">
            <div v-if="!person.coverUrl" class="club-gallery-placeholder">{{ person.name.charAt(0) }}</div>
            <div class="club-gallery-caption">
              <strong>{{ person.name }}</strong>
              <span>{{ person.tagline || t('directory.noTagline') }}</span>
            </div>
          </div>
          <div v-if="gallery.length > 1" class="club-gallery-thumbs">
            <button v-for="(photo, index) in gallery" :key="photo.name" type="button" :class="{ active: index === activePhoto }" @click="activePhoto = index">
              <img :src="photo.dataUrl" :alt="photo.name">
            </button>
          </div>
        </div>

        <section class="club-panel club-book" aria-labelledby="club-book-title">
          <div class="club-book-heading">
            <span aria-hidden="true">♛</span>
            <h2 id="club-book-title">{{ t('public.bookTitle') }}</h2>
          </div>
          <p class="hint">{{ t('public.bookHint') }}</p>
          <p class="club-book-status"><i />{{ person.availability || t('directory.available') }}</p>
          <div v-if="companionId" class="club-book-flow">
            <section class="club-book-step" aria-labelledby="club-book-date-title">
              <div class="club-book-step-heading"><span>1</span><strong id="club-book-date-title">{{ t('public.bookChooseDate') }}</strong></div>
              <div class="club-book-days">
                <button v-for="(dateValue, index) in bookingDates" :key="dateValue" type="button" :class="{ active: bookingDate === dateValue }" :aria-pressed="bookingDate === dateValue" @click="selectBookingDate(dateValue)">
                  <strong>{{ bookingRelativeDay(index) }}</strong><span>{{ bookingDateLabel(dateValue) }}</span>
                </button>
              </div>
              <label class="club-book-custom-date"><span>{{ t('public.bookCustomDate') }}</span><input v-model="bookingDate" type="date" :min="bookingDates[0]" @change="selectBookingDate(bookingDate)"></label>
            </section>

            <section class="club-book-step" aria-labelledby="club-book-time-title">
              <div class="club-book-step-heading"><span>2</span><strong id="club-book-time-title">{{ t('public.bookChooseTime') }}</strong></div>
              <div v-if="bookingTimes.length" class="club-book-times">
                <button v-for="timeValue in bookingTimes" :key="timeValue" type="button" :class="{ active: bookingTime === timeValue }" :aria-pressed="bookingTime === timeValue" @click="selectBookingTime(timeValue)">{{ timeValue }}</button>
              </div>
              <p v-else class="club-book-no-times">{{ t('public.bookNoQuickTimes') }}</p>
              <label class="club-book-custom-time"><span>{{ t('public.bookCustomTime') }}</span><input v-model="bookingTime" type="time" step="1800" @change="bookingError = ''; bookingNotice = ''"></label>
            </section>

            <section class="club-book-step" aria-labelledby="club-book-duration-title">
              <div class="club-book-step-heading"><span>3</span><strong id="club-book-duration-title">{{ t('public.bookDuration') }}</strong></div>
              <div class="club-duration">
                <button v-for="hours in [1, 2, 3]" :key="hours" type="button" :class="{ active: durationHours === hours }" :aria-pressed="durationHours === hours" @click="durationHours = hours">
                  <strong>{{ t('public.bookHours', { hours }) }}</strong><span>{{ t('public.bookEndsAt', { time: durationEndLabel(hours) }) }}</span>
                </button>
              </div>
            </section>

            <div class="club-book-summary" aria-live="polite">
              <span class="club-book-summary-icon" aria-hidden="true">✦</span>
              <div>
                <small>{{ t('public.bookSummary') }}</small>
                <strong v-if="selectedBooking">{{ bookingDateLabel(selectedBooking.startDate) }} · {{ selectedBooking.startTime }}–{{ selectedBooking.crossesDay ? `${t('public.bookNextDay')} ` : '' }}{{ selectedBooking.endTime }}</strong>
                <strong v-else>{{ t('public.bookSummaryEmpty') }}</strong>
              </div>
              <b>{{ t('public.bookHours', { hours: durationHours }) }}</b>
            </div>
            <p class="club-book-policy"><span aria-hidden="true">◇</span>{{ t('public.bookPolicy') }}</p>
            <p v-if="bookingError" class="commerce-alert" role="alert">{{ bookingError }}</p>
            <p v-if="bookingNotice" class="commerce-alert is-success" role="status">{{ bookingNotice }}</p>
            <div class="club-book-actions">
              <button class="button button-primary" type="button" :disabled="Boolean(bookingAction)" @click="submitBooking('order')">{{ bookingAction === 'order' ? t('public.bookWorking') : t('public.bookCta') }} <span aria-hidden="true">→</span></button>
              <button class="button club-book-cart" type="button" :disabled="Boolean(bookingAction)" @click="submitBooking('cart')"><span aria-hidden="true">＋</span>{{ bookingAction === 'cart' ? t('public.bookCartWorking') : t('public.bookCart') }}</button>
            </div>
          </div>
          <p v-else class="hint">{{ t('public.bookLegacy') }}</p>
        </section>
      </section>

      <section class="club-lower section-wrap">
        <article class="club-panel">
          <h3><i aria-hidden="true">▣</i>{{ t('public.about') }}</h3>
          <p>{{ person.bio || t('directory.noTagline') }}</p>
        </article>
        <article class="club-panel">
          <h3><i aria-hidden="true">⌁</i>{{ t('public.voiceTitle') }}</h3>
          <div v-if="showcaseAudios.length" class="club-voice-list">
            <article
              v-for="(audio, index) in showcaseAudios"
              :key="`audio-${index}`"
              class="club-voice-player"
              :class="{
                'is-playing': voiceState(index) === 'playing',
                'is-loading': voiceState(index) === 'loading',
                'has-error': voiceState(index) === 'error'
              }"
            >
              <audio
                :ref="element => bindVoiceAudio(element, index)"
                :src="audio.url"
                preload="metadata"
                @durationchange="updateVoiceDuration(index, $event)"
                @loadedmetadata="updateVoiceDuration(index, $event)"
                @timeupdate="updateVoicePosition(index, $event)"
                @playing="handleVoicePlaying(index)"
                @waiting="handleVoiceWaiting(index)"
                @stalled="handleVoiceWaiting(index)"
                @pause="handleVoicePause(index, $event)"
                @ended="handleVoiceEnded(index, $event)"
                @error="handleVoiceError(index, $event)"
                @abort="handleVoiceAbort(index)"
              />
              <button
                type="button"
                class="club-voice-toggle"
                :aria-label="t(voiceState(index) === 'playing' ? 'public.pauseVoice' : voiceState(index) === 'loading' ? 'public.cancelVoice' : voiceState(index) === 'error' ? 'public.retryVoice' : 'public.playVoice', { name: audio.name })"
                :aria-pressed="voiceState(index) === 'playing'"
                @click="toggleVoice(index)"
              >
                <span class="club-voice-toggle-icon" :class="{ pause: voiceState(index) === 'playing', loading: voiceState(index) === 'loading' }" aria-hidden="true" />
              </button>
              <div class="club-voice-meta">
                <strong>{{ audio.name }}</strong>
                <span v-if="voiceState(index) === 'error'" class="is-error" role="status">{{ t('public.voicePlaybackFailed') }}</span>
                <span v-else>{{ formatPlaybackTime(voicePositions[index] || 0) }} / {{ formatPlaybackTime(voiceDurations[index] || 0) }}</span>
              </div>
              <div class="club-voice-wave" :style="{ '--voice-progress': `${playbackProgress(voicePositions[index] || 0, voiceDurations[index] || 0)}%` }">
                <div class="club-voice-bars" aria-hidden="true">
                  <i v-for="(height, barIndex) in voiceWaveform" :key="`base-${barIndex}`" :style="{ '--voice-height': `${height}px`, '--voice-delay': `${barIndex * -31}ms` }" />
                </div>
                <div class="club-voice-bars is-progress" aria-hidden="true">
                  <i v-for="(height, barIndex) in voiceWaveform" :key="`progress-${barIndex}`" :style="{ '--voice-height': `${height}px`, '--voice-delay': `${barIndex * -31}ms` }" />
                </div>
                <input
                  type="range"
                  min="0"
                  :max="voiceDurations[index] || 0"
                  step="0.1"
                  :value="voicePositions[index] || 0"
                  :disabled="!voiceDurations[index]"
                  :aria-label="t('public.seekVoice', { name: audio.name })"
                  :aria-valuetext="`${formatPlaybackTime(voicePositions[index] || 0)} / ${formatPlaybackTime(voiceDurations[index] || 0)}`"
                  @input="seekVoice(index, $event)"
                >
              </div>
              <span class="club-voice-speaker" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M5 9v6h4l5 4V5L9 9H5Zm11.5-.5a5 5 0 0 1 0 7M18.8 6a8 8 0 0 1 0 12" /></svg>
              </span>
            </article>
          </div>
          <p v-else>{{ t('public.voiceEmpty') }}</p>
          <div v-if="person.tags.length" class="club-tags" style="justify-content:flex-start;margin-top:12px">
            <span v-for="tag in person.tags" :key="`lower-${tag}`">{{ tag }}</span>
          </div>
        </article>
        <article class="club-panel">
          <h3><i aria-hidden="true">★</i>{{ t('public.highlightsTitle') }}</h3>
          <div v-if="showcaseVideos.length" class="public-video-grid club-video-strip">
            <button v-for="(video, index) in showcaseVideos" :key="`video-${index}`" type="button" class="public-video-tile" @click="openVideo(video)">
              <video :src="video.url" preload="metadata" muted playsinline />
              <span class="public-video-play">▶</span>
              <div><small>{{ t('public.highlight') }} {{ String(index + 1).padStart(2, '0') }}</small><strong>{{ video.name }}</strong></div>
            </button>
          </div>
          <template v-else>
            <p>{{ t('public.reviewsSoonBody') }}</p>
            <p class="soon">{{ t('preview.badge') }} · {{ t('public.reviewsSoon') }}</p>
          </template>
        </article>
      </section>
    </template>

    <Teleport to="body">
      <div v-if="activeVideo" class="public-video-modal" role="dialog" aria-modal="true" :aria-label="activeVideo.name" @click.self="closeVideo">
        <button ref="videoCloseButton" type="button" class="public-video-close" :aria-label="locale === 'zh' ? '关闭视频' : 'Close video'" @click="closeVideo">×</button>
        <div class="public-video-modal-card"><video :key="activeVideo.url" :src="activeVideo.url" controls autoplay playsinline /><strong>{{ activeVideo.name }}</strong></div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="imageExpanded" class="public-video-modal" role="dialog" aria-modal="true" :aria-label="t('public.photoAlt', { name: person?.name || '', count: activePhoto + 1 })" @click.self="closeImage">
        <button ref="imageCloseButton" type="button" class="public-video-close" :aria-label="locale === 'zh' ? '关闭图片' : 'Close image'" @click="closeImage">×</button>
        <div class="public-image-modal">
          <img :src="gallery[activePhoto]?.dataUrl" :alt="person?.name || ''">
          <button v-if="gallery.length > 1" class="previous" type="button" :aria-label="t('public.previousPhoto')" @click="stepPhoto(-1)">←</button>
          <button v-if="gallery.length > 1" class="next" type="button" :aria-label="t('public.nextPhoto')" @click="stepPhoto(1)">→</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.public-profile-state { min-height: 55vh; display: grid; place-content: center; justify-items: center; gap: 20px; color: var(--muted); }
.public-gallery-expand { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; background: transparent; cursor: zoom-in; }
.public-video-tile { position: relative; overflow: hidden; padding: 0; border: 1px solid var(--club-line, var(--line)); border-radius: 14px; background: #0a0b1c; color: inherit; text-align: left; }
.public-video-tile video { display: block; width: 100%; aspect-ratio: 16/9; object-fit: cover; pointer-events: none; }
.public-video-tile > div { display: grid; gap: 3px; padding: 10px 12px; }
.public-video-play { position: absolute; top: calc(50% - 28px); left: 50%; display: grid; width: 36px; height: 36px; place-items: center; border-radius: 50%; background: rgba(13, 10, 34, .78); color: white; transform: translate(-50%, -50%); }
.public-video-modal { position: fixed; z-index: 1000; inset: 0; display: grid; place-items: center; padding: 28px; background: rgba(5, 5, 16, .88); backdrop-filter: blur(14px); }
.public-video-modal-card { width: min(1050px, 92vw); overflow: hidden; border: 1px solid rgba(255, 255, 255, .2); border-radius: 20px; background: #0b0b18; }
.public-video-modal-card video { display: block; width: 100%; max-height: 78vh; background: #000; }
.public-video-modal-card strong { display: block; padding: 14px 18px; color: white; }
.public-video-close { position: fixed; z-index: 2; top: 24px; right: 28px; width: 44px; height: 44px; border: 1px solid rgba(255, 255, 255, .28); border-radius: 50%; background: rgba(10, 10, 24, .72); color: white; font-size: 27px; }
.public-image-modal { position: relative; display: grid; place-items: center; width: min(1180px, 92vw); height: min(86vh, 850px); }
.public-image-modal img { max-width: 100%; max-height: 100%; border-radius: 18px; object-fit: contain; }
.public-image-modal button { position: absolute; top: 50%; width: 48px; height: 48px; border: 1px solid rgba(255, 255, 255, .3); border-radius: 50%; background: rgba(10, 10, 24, .72); color: white; }
.public-image-modal .previous { left: 10px; }
.public-image-modal .next { right: 10px; }
.club-gallery-main { position: relative; }
</style>
