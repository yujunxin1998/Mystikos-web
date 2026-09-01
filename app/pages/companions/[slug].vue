<script setup lang="ts">
import { publicCompanions } from '~/data/companions'

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
const person = ref<DetailPerson | null>(null)
const companionId = ref<number | null>(null)
const loading = ref(true)
const error = ref('')
const gallery = ref<{ name: string; dataUrl: string }[]>([])

const bookingStart = ref('')
const bookingDurationHours = ref(1)
const bookingWorking = ref(false)
const bookingError = ref('')
const bookingFeedback = ref('')

const minStartValue = computed(() => {
  const soonest = new Date(Date.now() + 15 * 60_000)
  soonest.setSeconds(0, 0)
  return soonest.toISOString().slice(0, 16)
})
const requireBookingLogin = async () => {
  if (authenticated.value) return true
  await navigateTo(`/auth?redirect=${encodeURIComponent(route.fullPath)}`)
  return false
}
const addToBookingCart = async () => {
  if (!companionId.value || !bookingStart.value) { bookingError.value = '请选择预约开始时间'; return }
  if (!(await requireBookingLogin())) return
  bookingWorking.value = true; bookingError.value = ''; bookingFeedback.value = ''
  try {
    await bookingApi.addBookingCartLine(companionId.value, new Date(bookingStart.value).toISOString(), bookingDurationHours.value)
    bookingFeedback.value = locale.value === 'zh' ? '已加入预约购物车' : 'Added to booking cart'
  } catch (cause) { bookingError.value = cause instanceof Error ? cause.message : '加入预约购物车失败' }
  finally { bookingWorking.value = false }
}
const bookNow = async () => {
  if (!companionId.value || !bookingStart.value) { bookingError.value = '请选择预约开始时间'; return }
  if (!(await requireBookingLogin())) return
  bookingWorking.value = true; bookingError.value = ''
  try {
    const bookingId = await bookingApi.createBooking(companionId.value, new Date(bookingStart.value).toISOString(), bookingDurationHours.value)
    await navigateTo(`/bookings/${bookingId}`)
  } catch (cause) { bookingError.value = cause instanceof Error ? cause.message : '创建预约失败'; bookingWorking.value = false }
}
const showcaseVideos = ref<{ name: string; size: string; url: string }[]>([])
const showcaseAudios = ref<{ name: string; url: string }[]>([])
const activeVideo = ref<{ name: string; url: string } | null>(null)
const imageExpanded = ref(false)
const activePhoto = ref(0)
let galleryTimer: ReturnType<typeof setInterval> | undefined

useHead(() => ({ title: person.value ? `${person.value.name} · Mystikos Companion` : 'Mystikos Companion' }))
const stepPhoto = (direction: number) => {
  if (!gallery.value.length) return
  activePhoto.value = (activePhoto.value + direction + gallery.value.length) % gallery.value.length
}
const openVideo = (video: { name: string; url: string }) => { activeVideo.value = video; document.body.style.overflow = 'hidden' }
const closeVideo = () => { activeVideo.value = null; document.body.style.overflow = '' }
const openImage = () => { imageExpanded.value = true; document.body.style.overflow = 'hidden' }
const closeImage = () => { imageExpanded.value = false; document.body.style.overflow = '' }
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
  loadDetail()
  window.addEventListener('keydown', onKeydown)
  galleryTimer = setInterval(() => { if (gallery.value.length > 1) stepPhoto(1) }, 4200)
})
onBeforeUnmount(() => { if (galleryTimer) clearInterval(galleryTimer); window.removeEventListener('keydown', onKeydown); document.body.style.overflow = '' })
</script>

<template>
  <main class="public-companion-profile">
    <div class="section-wrap"><NuxtLink to="/companions" class="public-profile-back">← {{ t('public.back') }}</NuxtLink></div>
    <div v-if="loading" class="public-profile-state section-wrap">{{ t('directory.loading') }}</div>
    <div v-else-if="error" class="public-profile-state section-wrap"><strong>{{ error }}</strong><NuxtLink to="/companions" class="button button-primary">{{ t('public.back') }}</NuxtLink></div>
    <template v-else-if="person">
      <section class="public-card-layout section-wrap"><div class="public-card-primary"><article class="live-companion-card public-card-shell"><div class="live-card-cover" :class="{ 'has-cover-image': person.coverUrl }" :style="person.coverUrl ? { backgroundImage: `linear-gradient(180deg, rgba(12,12,31,.08), rgba(12,12,31,.46)), url(${person.coverUrl})` } : undefined"><div class="live-card-avatar"><img v-if="person.avatarUrl" :src="person.avatarUrl" :alt="person.name"><span v-else>{{ person.name.charAt(0).toUpperCase() }}</span></div><em>{{ person.availability }}</em></div><div class="live-card-body"><div class="live-card-name"><div><h2>{{ person.name }}</h2><p>{{ person.tagline }}</p></div><small>✦ {{ t('public.verified') }}</small></div><div class="live-card-tags"><span v-for="tag in person.tags" :key="tag">{{ tag }}</span></div><p class="live-card-bio">{{ person.bio }}</p><section v-if="showcaseAudios.length" class="public-card-voices embedded"><p>♫ {{ t('public.voice') }}</p><article v-for="(audio, index) in showcaseAudios" :key="`audio-${index}`"><div><small>{{ String(index + 1).padStart(2, '0') }}</small><strong>{{ audio.name }}</strong></div><audio :src="audio.url" controls preload="none" /></article></section><div v-if="companionId" class="booking-widget">
        <p class="eyebrow"><span />BOOK BY THE HOUR</p>
        <div class="booking-widget-row">
          <label>开始时间<input v-model="bookingStart" type="datetime-local" :min="minStartValue"></label>
          <label>时长（小时）<div class="quantity-stepper"><button type="button" :disabled="bookingDurationHours <= 1" @click="bookingDurationHours = Math.round((bookingDurationHours - 1) * 10) / 10">−</button><span>{{ bookingDurationHours }}</span><button type="button" :disabled="bookingDurationHours >= 24" @click="bookingDurationHours = Math.round((bookingDurationHours + 1) * 10) / 10">+</button></div></label>
        </div>
        <p v-if="bookingError" class="commerce-alert" role="alert">{{ bookingError }}</p>
        <p v-if="bookingFeedback" class="booking-feedback">{{ bookingFeedback }}</p>
        <div class="booking-widget-actions">
          <button class="button" type="button" :disabled="bookingWorking" @click="addToBookingCart">加入预约车</button>
          <button class="button button-primary public-profile-cta" type="button" :disabled="bookingWorking" @click="bookNow">{{ bookingWorking ? '处理中…' : '立即预约' }} <span>→</span></button>
        </div>
      </div></div></article></div><div class="public-card-secondary"><div v-if="gallery.length" class="public-card-gallery"><button type="button" class="public-gallery-expand" :aria-label="t('public.photoAlt', { name: person.name, count: activePhoto + 1 })" @click="openImage"><img :src="gallery[activePhoto]?.dataUrl" :alt="t('public.photoAlt', { name: person.name, count: activePhoto + 1 })"><span>⛶</span></button><template v-if="gallery.length > 1"><button class="previous" type="button" :aria-label="t('public.previousPhoto')" @click="stepPhoto(-1)">←</button><button class="next" type="button" :aria-label="t('public.nextPhoto')" @click="stepPhoto(1)">→</button><div class="public-gallery-dots"><button v-for="(_, index) in gallery" :key="index" type="button" :class="{ active: index === activePhoto }" @click="activePhoto = index" /></div></template></div><section v-if="showcaseVideos.length" class="public-inline-videos"><p class="eyebrow"><span />{{ t('public.highlights') }}</p><div class="public-video-grid"><button v-for="(video, index) in showcaseVideos" :key="`video-${index}`" type="button" class="public-video-tile" @click="openVideo(video)"><video :src="video.url" preload="metadata" muted playsinline /><span class="public-video-play">▶</span><div><small>{{ t('public.highlight') }} {{ String(index + 1).padStart(2, '0') }}</small><strong>{{ video.name }}</strong></div></button></div></section></div></section>
    </template>
    <Teleport to="body"><div v-if="activeVideo" class="public-video-modal" role="dialog" aria-modal="true" :aria-label="activeVideo.name" @click.self="closeVideo"><button type="button" class="public-video-close" :aria-label="locale === 'zh' ? '关闭视频' : 'Close video'" @click="closeVideo">×</button><div class="public-video-modal-card"><video :key="activeVideo.url" :src="activeVideo.url" controls autoplay playsinline /><strong>{{ activeVideo.name }}</strong></div></div></Teleport>
    <Teleport to="body"><div v-if="imageExpanded" class="public-video-modal" role="dialog" aria-modal="true" @click.self="closeImage"><button type="button" class="public-video-close" @click="closeImage">×</button><div class="public-image-modal"><img :src="gallery[activePhoto]?.dataUrl" :alt="person?.name || ''"><button v-if="gallery.length > 1" class="previous" type="button" @click="stepPhoto(-1)">←</button><button v-if="gallery.length > 1" class="next" type="button" @click="stepPhoto(1)">→</button></div></div></Teleport>
  </main>
</template>

<style scoped>
.booking-widget { display: grid; gap: 12px; margin-top: 6px; padding-top: 16px; border-top: 1px solid var(--line); }
.booking-widget-row { display: flex; gap: 16px; flex-wrap: wrap; }
.booking-widget-row label { display: grid; gap: 6px; font-size: 12px; color: var(--muted); }
.booking-widget-row input[type="datetime-local"] { padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--ink); }
.quantity-stepper { display: flex; align-items: center; gap: 12px; }
.quantity-stepper button { width: 28px; height: 28px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--ink); cursor: pointer; }
.booking-widget-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.booking-feedback { color: var(--gold); font-size: 12px; }
.public-profile-state { min-height: 55vh; display: grid; place-content: center; justify-items: center; gap: 20px; color: var(--muted); }
.public-card-layout { display: grid; grid-template-columns: minmax(340px,.85fr) minmax(0,1.15fr); align-items: start; gap: 24px; padding-top: 42px; padding-bottom: 62px; }
.public-card-shell { min-height: 520px; }
.public-card-primary { display: grid; align-content: start; gap: 14px; }
.public-card-secondary { display:grid; align-content:start; gap:16px; }
.public-inline-videos { padding:14px; border:1px solid var(--line); border-radius:18px; background:var(--card); }.public-inline-videos>.eyebrow { margin:0; }.public-inline-videos .public-video-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; margin-top:12px; }.public-inline-videos .public-video-tile>div { padding:8px 9px 10px; }.public-inline-videos .public-video-play { width:32px; height:32px; top:calc(50% - 25px); }
.public-card-gallery { position: relative; overflow: hidden; height: 390px; border: 1px solid var(--line); border-radius: 22px; background: var(--card); }
.public-gallery-expand { position:absolute!important; inset:0; top:0!important; width:100%!important; height:100%!important; padding:0; border:0!important; border-radius:0!important; background:transparent!important; }.public-gallery-expand img { width:100%; height:100%; object-fit:cover; }.public-gallery-expand span { position:absolute; top:14px; right:14px; display:grid; width:36px; height:36px; place-items:center; border-radius:50%; background:rgba(10,10,28,.68); color:white; }
.public-card-gallery > button { position: absolute; z-index: 2; top: 50%; width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.35); border-radius: 50%; background: rgba(10,10,28,.68); color: white; }
.public-card-gallery > .previous { left: 16px; }.public-card-gallery > .next { right: 16px; }
.public-card-gallery .public-gallery-dots { position: absolute; z-index: 2; right: 0; bottom: 16px; left: 0; display: flex; justify-content: center; gap: 7px; }
.public-card-gallery .public-gallery-dots button { width: 7px; height: 7px; padding: 0; border: 0; border-radius: 50%; background: rgba(255,255,255,.5); }.public-card-gallery .public-gallery-dots button.active { width: 22px; border-radius: 5px; background: white; }
.public-profile-video,.public-profile-audio { overflow: hidden; border: 1px solid var(--line); border-radius: 20px; background: var(--card); }
.public-profile-video video { display: block; width: 100%; aspect-ratio: 16 / 9; background: #080816; object-fit: contain; }
.public-profile-video div,.public-profile-audio div { display: grid; gap: 5px; padding: 16px 18px; }
.public-profile-video small,.public-profile-audio small { color: var(--muted); }
.public-profile-video strong,.public-profile-audio strong { font: 600 18px 'Playfair Display', serif; }
.public-profile-audio { padding-bottom: 18px; }
.public-profile-audio audio { width: calc(100% - 36px); margin: 0 18px; }
.public-card-voices { display: grid; gap: 8px; padding: 16px; border: 1px solid var(--line); border-radius: 18px; background: var(--card); }
.public-card-voices .eyebrow { margin: 0 0 4px; }
.public-card-voices article { display: grid; grid-template-columns:minmax(110px,.45fr) minmax(190px,1fr); align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:var(--paper); }
.public-card-voices article div { display:grid; gap:3px; min-width:0; }.public-card-voices article small { color:var(--gold); }.public-card-voices article strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; }.public-card-voices audio { width:100%; height:34px; }
.public-card-voices.embedded { margin:18px 0; padding:14px 0 0; border:0; border-top:1px solid var(--line); border-radius:0; background:transparent; }.public-card-voices.embedded>p { margin:0 0 2px; color:var(--muted); font-size:10px; }.public-card-voices.embedded article { padding:8px 10px; }
.public-video-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:22px; }
.public-video-tile { position:relative; overflow:hidden; padding:0; border:1px solid var(--line); border-radius:16px; background:var(--card); color:var(--ink); text-align:left; transition:.2s; }.public-video-tile:hover { transform:translateY(-3px); border-color:var(--lav-deep); }.public-video-tile video { display:block; width:100%; aspect-ratio:16/9; background:#05050d; object-fit:cover; pointer-events:none; }.public-video-tile>div { display:grid; gap:4px; padding:11px 13px 13px; }.public-video-tile small { color:var(--muted); font-size:8px; }.public-video-tile strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:600 13px 'Playfair Display',serif; }.public-video-play { position:absolute; top:calc(50% - 31px); left:50%; display:grid; width:38px; height:38px; place-items:center; border-radius:50%; background:rgba(13,10,34,.78); color:white; font-size:11px; transform:translate(-50%,-50%); backdrop-filter:blur(7px); }
.public-video-modal { position:fixed; z-index:1000; inset:0; display:grid; place-items:center; padding:28px; background:rgba(5,5,16,.88); backdrop-filter:blur(14px); }.public-video-modal-card { width:min(1050px,92vw); overflow:hidden; border:1px solid rgba(255,255,255,.2); border-radius:20px; background:#0b0b18; box-shadow:0 30px 90px rgba(0,0,0,.6); }.public-video-modal-card video { display:block; width:100%; max-height:78vh; background:#000; }.public-video-modal-card strong { display:block; padding:14px 18px; color:white; }.public-video-close { position:fixed; z-index:2; top:24px; right:28px; width:44px; height:44px; border:1px solid rgba(255,255,255,.28); border-radius:50%; background:rgba(10,10,24,.72); color:white; font-size:27px; }
.public-image-modal { position:relative; display:grid; place-items:center; width:min(1180px,92vw); height:min(86vh,850px); }.public-image-modal img { max-width:100%; max-height:100%; border-radius:18px; object-fit:contain; box-shadow:0 28px 80px rgba(0,0,0,.55); }.public-image-modal button { position:absolute; top:50%; width:48px; height:48px; border:1px solid rgba(255,255,255,.3); border-radius:50%; background:rgba(10,10,24,.72); color:white; }.public-image-modal .previous { left:10px; }.public-image-modal .next { right:10px; }
@media (max-width: 1100px) { .public-video-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
@media (max-width: 960px) { .public-card-layout { grid-template-columns: 1fr; } .public-card-gallery { height:420px; } .public-video-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width: 620px) { .public-video-grid,.public-inline-videos .public-video-grid { grid-template-columns:1fr 1fr; gap:8px; }.public-card-gallery { height:330px; }.public-card-voices article { grid-template-columns:1fr; }.public-video-modal { padding:12px; }.public-video-modal-card { width:100%; } }
</style>
