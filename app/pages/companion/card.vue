<script setup lang="ts">
const { authenticated, userAvatarUrl, userName } = useDemoAuth()
const { locale } = useMystikos()
const showcaseApi = useCompanionShowcaseApi()
const profileApi = useProfileApi()

const loading = ref(true)
const saving = ref(false)
const submitting = ref(false)
const saved = ref(false)
const confirmSubmitOpen = ref(false)
const editingLocked = ref(false)
const baselineSnapshot = ref('')
const instantReorderEnabled = ref(false)
const dragging = ref<{ type: 'photos' | 'videos' | 'audios'; index: number } | null>(null)
const error = ref('')
const availableTags = ref<{ id: number; label: string }[]>([])
type CardPhoto = { name: string; dataUrl: string; objectKey: string }
type CardVideo = { name: string; size: string; url: string; objectKey: string }
type CardAudio = { name: string; size: string; url: string; objectKey: string }
const form = reactive({ displayName: '', tagline: '', bio: '', tagIds: [] as number[], availability: '今晚可点单', coverName: '', coverDataUrl: '', coverObjectKey: '', photos: [] as CardPhoto[], videos: [] as CardVideo[], audios: [] as CardAudio[] })
const activePhoto = ref(0)
let photoTimer: ReturnType<typeof setInterval> | undefined
const snapshot = () => JSON.stringify({
  displayName: form.displayName, tagline: form.tagline, bio: form.bio, tagIds: [...form.tagIds].sort(),
  availability: form.availability, coverObjectKey: form.coverObjectKey,
  photos: form.photos.map(item => item.objectKey), videos: form.videos.map(item => item.objectKey),
  audios: form.audios.map(item => item.objectKey)
})
const isDirty = computed(() => !editingLocked.value && snapshot() !== baselineSnapshot.value)
const startDrag = (type: 'photos' | 'videos' | 'audios', index: number, event: DragEvent) => {
  dragging.value = { type, index }
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
const dropMedia = async (type: 'photos' | 'videos' | 'audios', targetIndex: number) => {
  if (!dragging.value || dragging.value.type !== type || dragging.value.index === targetIndex) return
  const list = form[type] as Array<CardPhoto | CardVideo | CardAudio>
  const [item] = list.splice(dragging.value.index, 1)
  if (item) list.splice(targetIndex, 0, item)
  dragging.value = null
  if (instantReorderEnabled.value) {
    try {
      await showcaseApi.reorderMedia({ photoObjectKeys: form.photos.map(item => item.objectKey), videoObjectKeys: form.videos.map(item => item.objectKey), audioObjectKeys: form.audios.map(item => item.objectKey) })
      baselineSnapshot.value = snapshot()
      saved.value = true
    } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Unable to save media order' }
  }
}

const copy = computed(() => locale.value === 'zh' ? {
  eyebrow: '陪玩名片编辑器', title: '让别人先认识你再决定与你并肩', intro: '这里编辑的是审核通过后公开展示的在线名片，不会修改你的账号资料。', preview: '实时预览', publicView: '公开视角', edit: '编辑名片', basic: '基础资料', media: '展示素材', bio: '个人简介', save: '保存草稿', saving: '保存中…', saved: '草稿已保存在当前设备', back: '返回个人资料', verified: '认证陪玩', games: '擅长游戏', max: '最多选择 4 项', denied: '只有陪玩审核通过的用户可以编辑名片。'
} : {
  eyebrow: 'Companion card editor', title: 'Let people meet you before they queue with you.', intro: 'This public card is separate from your account profile and is available after approval.', preview: 'Live preview', publicView: 'Public view', edit: 'Edit card', basic: 'Essentials', media: 'Showcase media', bio: 'About you', save: 'Save draft', saving: 'Saving…', saved: 'Draft saved on this device', back: 'Back to profile', verified: 'Verified companion', games: 'Games', max: 'Choose up to 4', denied: 'Only approved companions can edit a card.'
})

const selectedTags = computed(() => availableTags.value.filter(tag => form.tagIds.includes(tag.id)))
const initial = computed(() => (form.displayName || userName.value || 'M').slice(0, 1).toLocaleUpperCase())
const toggleTag = (id: number) => {
  if (form.tagIds.includes(id)) form.tagIds = form.tagIds.filter(item => item !== id)
  else if (form.tagIds.length < 4) form.tagIds.push(id)
}
const pickAudios = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  const valid = files.filter(file => file.type.startsWith('audio/') && file.size <= 10 * 1024 * 1024).slice(0, Math.max(0, 3 - form.audios.length))
  try {
    const uploaded = await Promise.all(valid.map(async file => ({ file, result: await showcaseApi.upload(file) })))
    form.audios.push(...uploaded.map(({ file, result }) => ({ name: file.name, size: formatFileSize(file.size), url: result.url, objectKey: result.objectKey })))
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Upload failed' }
  if (valid.length !== files.length) error.value = locale.value === 'zh' ? '语音最多上传 3 段，每段不能超过 10 MB。' : 'Up to 3 audio clips are allowed, each under 10 MB.'
  else error.value = ''
  input.value = ''
}
const formatFileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
const pickVideos = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  const available = Math.max(0, 5 - form.videos.length)
  const valid = files.filter(file => file.type === 'video/mp4' && file.size <= 50 * 1024 * 1024).slice(0, available)
  try {
    const uploaded = await Promise.all(valid.map(async file => ({ file, result: await showcaseApi.upload(file) })))
    form.videos.push(...uploaded.map(({ file, result }) => ({ name: file.name, size: formatFileSize(file.size), url: result.url, objectKey: result.objectKey })))
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Upload failed' }
  if (valid.length !== files.length) error.value = locale.value === 'zh' ? '精彩操作最多上传 5 段，每段需为不超过 50 MB 的 MP4。' : 'Up to 5 MP4 clips are allowed, each under 50 MB.'
  else error.value = ''
  input.value = ''
}
const removeVideo = (index: number) => { form.videos.splice(index, 1) }
const removeAudio = (index: number) => { form.audios.splice(index, 1) }
const startPhotoTimer = () => {
  if (photoTimer) clearInterval(photoTimer)
  photoTimer = setInterval(() => {
    if (form.photos.length > 1) activePhoto.value = (activePhoto.value + 1) % form.photos.length
  }, 4200)
}
const selectPhoto = (index: number) => { activePhoto.value = index; startPhotoTimer() }
const stepPhoto = (direction: number) => {
  if (!form.photos.length) return
  activePhoto.value = (activePhoto.value + direction + form.photos.length) % form.photos.length
  startPhotoTimer()
}
const removePhoto = (index: number) => {
  form.photos.splice(index, 1)
  activePhoto.value = Math.min(activePhoto.value, Math.max(0, form.photos.length - 1))
}
const pickPhotos = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  const valid = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024).slice(0, Math.max(0, 8 - form.photos.length))
  if (valid.length !== files.length) error.value = locale.value === 'zh' ? '每张照片需小于 5 MB，最多上传 8 张。' : 'Each photo must be under 5 MB; up to 8 photos are allowed.'
  const additions = await Promise.all(valid.map(async file => {
    const uploaded = await showcaseApi.upload(file)
    return { name: file.name, dataUrl: uploaded.url, objectKey: uploaded.objectKey }
  }))
  form.photos.push(...additions)
  if (additions.length) { activePhoto.value = form.photos.length - additions.length; error.value = ''; startPhotoTimer() }
  input.value = ''
}
const pickCover = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
    error.value = locale.value === 'zh' ? '背景图片需要是 JPG、PNG 或 WebP，且不能超过 8 MB。' : 'The cover must be a JPG, PNG, or WebP under 8 MB.'
    input.value = ''
    return
  }
  try {
    const uploaded = await showcaseApi.upload(file)
    form.coverName = file.name
    form.coverDataUrl = uploaded.url
    form.coverObjectKey = uploaded.objectKey
    error.value = ''
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Upload failed' }
  input.value = ''
}
const removeCover = () => {
  form.coverName = ''
  form.coverDataUrl = ''
  form.coverObjectKey = ''
}
const saveDraft = async () => {
  saving.value = true; saved.value = false
  try {
    await showcaseApi.saveDraft({ bio: form.bio, tagline: form.tagline, availability: form.availability, tagIds: form.tagIds, coverObjectKey: form.coverObjectKey || null, photoObjectKeys: form.photos.map(photo => photo.objectKey), videoObjectKeys: form.videos.map(video => video.objectKey), audioObjectKeys: form.audios.map(audio => audio.objectKey) })
    localStorage.setItem('mystikos-companion-card-draft', JSON.stringify({ ...form, coverDataUrl: form.coverDataUrl }))
    baselineSnapshot.value = snapshot()
    saved.value = true
    return true
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Unable to save draft'; return false } finally { saving.value = false }
}
const submitForReview = async () => {
  confirmSubmitOpen.value = false
  submitting.value = true
  try {
    if (!await saveDraft()) return
    await showcaseApi.submit()
    saved.value = true
    editingLocked.value = true
    baselineSnapshot.value = snapshot()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Unable to submit showcase' } finally { submitting.value = false }
}

onMounted(async () => {
  if (!authenticated.value) return navigateTo('/auth')
  try {
    const [profile, tags, draft] = await Promise.all([profileApi.getProfile(), profileApi.getTags(), showcaseApi.getMine()])
    if (!profile.roles?.includes('COMPANION')) { error.value = copy.value.denied; return }
    availableTags.value = tags
    Object.assign(form, { displayName: profile.nickname || userName.value, bio: profile.bio || '', tagIds: profile.tags.slice(0, 4).map(tag => tag.id) })
    if (draft) Object.assign(form, {
      tagline: draft.tagline || '', bio: draft.bio || '', availability: draft.availability || form.availability,
      coverName: draft.coverUrl ? 'cover-image' : '', coverDataUrl: draft.coverUrl || '', coverObjectKey: draft.coverObjectKey || '',
      tagIds: draft.tags.map(tag => tag.id),
      photos: draft.photoUrls.map((url, index) => ({ name: `photo-${index + 1}`, dataUrl: url, objectKey: draft.photoObjectKeys[index] })),
      videos: draft.videoUrls.map((url, index) => ({ name: `highlight-${index + 1}.mp4`, size: '', url, objectKey: draft.videoObjectKeys[index] })),
      audios: draft.audioUrls.map((url, index) => ({ name: `voice-${index + 1}`, size: '', url, objectKey: draft.audioObjectKeys[index] }))
    })
    editingLocked.value = draft?.status === 'PENDING_REVIEW'
    instantReorderEnabled.value = Boolean(draft?.published && draft.status === 'APPROVED')
    baselineSnapshot.value = snapshot()
    startPhotoTimer()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : copy.value.denied } finally { loading.value = false }
})
onBeforeUnmount(() => { if (photoTimer) clearInterval(photoTimer) })
</script>

<template>
  <div class="card-editor-page section-wrap">
    <NuxtLink to="/profile" class="companion-back">← {{ copy.back }}</NuxtLink>
    <div v-if="loading" class="companion-loading">Loading…</div>
    <section v-else-if="error" class="card-access-denied"><span>✦</span><h1>{{ error }}</h1><NuxtLink to="/profile" class="button button-primary">{{ copy.back }}</NuxtLink></section>
    <template v-else>
      <header class="card-editor-head"><div><p class="eyebrow"><span />{{ copy.eyebrow }}</p><h1>{{ copy.title }}</h1></div><p>{{ copy.intro }}</p></header>
      <div class="card-editor-actions"><span>{{ editingLocked ? (locale === 'zh' ? '已提交审核，审核完成前不可继续编辑' : 'Submitted for review; editing is locked') : (saved ? copy.saved : '') }}</span><button class="button button-ghost" :disabled="saving || submitting || !isDirty" @click="saveDraft">{{ saving ? copy.saving : copy.save }}</button><button class="button button-primary" :disabled="saving || submitting || !isDirty" @click="confirmSubmitOpen = true">{{ submitting ? (locale === 'zh' ? '提交中…' : 'Submitting…') : (locale === 'zh' ? '提交审核' : 'Submit for review') }} <b>→</b></button></div>
      <main class="card-editor-workspace">
        <aside class="card-preview-column">
          <p class="card-panel-label"><span>{{ copy.preview }}</span><span>{{ copy.publicView }}</span></p>
          <div class="editor-public-layout">
            <div class="editor-preview-primary">
              <article class="live-companion-card"><div class="live-card-cover" :class="{ 'has-cover-image': form.coverDataUrl }" :style="form.coverDataUrl ? { backgroundImage: `linear-gradient(180deg, rgba(12, 12, 31, .08), rgba(12, 12, 31, .42)), url(${form.coverDataUrl})` } : undefined"><div class="live-card-avatar"><img v-if="userAvatarUrl" :src="userAvatarUrl" alt=""><span v-else>{{ initial }}</span></div><em>{{ form.availability }}</em></div><div class="live-card-body"><div class="live-card-name"><div><h2>{{ form.displayName || 'Stargazer' }}</h2><p>{{ form.tagline || '默契沟通 · 稳定发挥' }}</p></div><small>✦ {{ copy.verified }}</small></div><div class="live-card-tags"><span v-for="tag in selectedTags" :key="tag.id">{{ tag.label }}</span></div><p class="live-card-bio">{{ form.bio || '介绍你的游戏风格、擅长位置和相处方式。' }}</p><section v-if="form.audios.length" class="editor-public-voices embedded"><p>♫ {{ locale === 'zh' ? '语音片段' : 'Voice notes' }}</p><article v-for="(audio, index) in form.audios" :key="`${audio.name}-${index}`"><span>{{ String(index + 1).padStart(2, '0') }} · {{ audio.name }}</span><audio :src="audio.url" controls preload="none" /></article></section></div></article>
            </div>
            <div class="editor-preview-secondary">
              <div v-if="form.photos.length" class="editor-public-gallery"><img :src="form.photos[activePhoto]?.dataUrl" :alt="form.photos[activePhoto]?.name"><button v-if="form.photos.length > 1" class="previous" type="button" @click="stepPhoto(-1)">←</button><button v-if="form.photos.length > 1" class="next" type="button" @click="stepPhoto(1)">→</button><div v-if="form.photos.length > 1"><button v-for="(_, index) in form.photos" :key="index" type="button" :class="{ active: activePhoto === index }" @click="selectPhoto(index)" /></div></div>
              <section v-if="form.videos.length" class="editor-preview-videos"><p>▶ {{ locale === 'zh' ? '精彩操作' : 'Highlights' }}</p><div><article v-for="(video, index) in form.videos" :key="`${video.name}-${index}`"><video :src="video.url" preload="metadata" muted playsinline /><span>{{ String(index + 1).padStart(2, '0') }} · {{ video.name }}</span></article></div></section>
            </div>
          </div>
        </aside>
        <div class="card-form-column" :class="{ 'is-editing-locked': editingLocked }" :inert="editingLocked"><p class="card-panel-label"><span>{{ copy.edit }}</span><span>{{ form.bio.length }}/300</span></p>
          <section class="card-edit-section"><header><i>01</i><div><h2>{{ copy.basic }}</h2><p>展示名称、标签与可点单状态</p></div></header><div class="card-fields"><label><span>展示名称</span><input v-model.trim="form.displayName" maxlength="24"></label><label><span>一句话标签</span><input v-model.trim="form.tagline" maxlength="42"></label><label><span>在线状态</span><select v-model="form.availability"><option>今晚可点单</option><option>周末可点单</option><option>暂不接单</option></select></label><fieldset><legend>{{ copy.games }} <small>{{ copy.max }}</small></legend><div class="card-tag-picker"><button v-for="tag in availableTags" :key="tag.id" type="button" :class="{ selected: form.tagIds.includes(tag.id) }" @click="toggleTag(tag.id)">{{ tag.label }}</button></div></fieldset></div></section>
          <section class="card-edit-section"><header><i>02</i><div><h2>{{ copy.media }}</h2><p>背景图片、多张个人照片、精彩视频与语音片段 · 拖动素材可调整展示顺序</p></div></header><div class="card-upload-grid"><label class="card-cover-upload"><span>名片背景</span><small>{{ form.coverName ? '点击重新选择即可替换' : '横向 JPG / PNG / WebP · 8 MB' }}</small><input type="file" accept="image/jpeg,image/png,image/webp" @change="pickCover"></label><div v-if="form.coverDataUrl" class="card-cover-manager"><article><img :src="form.coverDataUrl" :alt="form.coverName"><span><strong>{{ form.coverName }}</strong><small>当前名片背景 · 重新上传会直接替换</small></span><button type="button" :aria-label="`删除 ${form.coverName}`" @click="removeCover">×</button></article></div><label><span>个人照片</span><small>已选 {{ form.photos.length }}/8 张 · 第一张作为列表封面</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple @change="pickPhotos"></label><div v-if="form.photos.length" class="card-photo-manager sortable-media"><article v-for="(photo, index) in form.photos" :key="photo.objectKey" draggable="true" @dragstart="startDrag('photos', index, $event)" @dragover.prevent @drop.prevent="dropMedia('photos', index)"><img :src="photo.dataUrl" :alt="photo.name"><span>{{ index + 1 }}</span><button type="button" :aria-label="`删除 ${photo.name}`" @click="removePhoto(index)">×</button></article></div><label><span>精彩操作</span><small>已选 {{ form.videos.length }}/5 段 · MP4，每段 50 MB</small><input type="file" accept="video/mp4" multiple @change="pickVideos"></label><div v-if="form.videos.length" class="card-video-manager card-video-preview-manager sortable-media"><article v-for="(video, index) in form.videos" :key="video.objectKey" draggable="true" @dragstart="startDrag('videos', index, $event)" @dragover.prevent @drop.prevent="dropMedia('videos', index)"><video :src="video.url" controls preload="metadata" playsinline /><span><strong>{{ String(index + 1).padStart(2, '0') }} · {{ video.name }}</strong><small>{{ video.size || '已上传' }} · 拖动排序</small></span><button type="button" :aria-label="`删除 ${video.name}`" @click="removeVideo(index)">×</button></article></div><label><span>语音片段</span><small>已选 {{ form.audios.length }}/3 段 · MP3 / M4A，每段 10 MB</small><input type="file" accept="audio/*" multiple @change="pickAudios"></label><div v-if="form.audios.length" class="card-video-manager card-audio-manager sortable-media"><article v-for="(audio, index) in form.audios" :key="audio.objectKey" draggable="true" @dragstart="startDrag('audios', index, $event)" @dragover.prevent @drop.prevent="dropMedia('audios', index)"><i>↕</i><span><strong>{{ String(index + 1).padStart(2, '0') }} · {{ audio.name }}</strong><small>{{ audio.size || '已上传' }} · 拖动排序</small><audio :src="audio.url" controls preload="none" /></span><button type="button" :aria-label="`删除 ${audio.name}`" @click="removeAudio(index)">×</button></article></div></div></section>
          <section class="card-edit-section"><header><i>03</i><div><h2>{{ copy.bio }}</h2><p>你的风格、能力和相处方式</p></div></header><label class="card-bio-field"><textarea v-model="form.bio" maxlength="300" rows="7" placeholder="介绍一下你自己…" /><small>{{ form.bio.length }}/300</small></label></section>
        </div>
      </main>
    </template>
    <Teleport to="body"><div v-if="confirmSubmitOpen" class="submit-confirm-backdrop" role="dialog" aria-modal="true" @click.self="confirmSubmitOpen = false"><section class="submit-confirm-dialog"><span>✦</span><h2>{{ locale === 'zh' ? '确认提交陪玩名片？' : 'Submit this companion card?' }}</h2><p>{{ locale === 'zh' ? '提交后将进入审核状态，在审核完成前你无法再次编辑当前名片。' : 'After submission, this card will be locked until the review is complete.' }}</p><div><button type="button" class="button button-ghost" @click="confirmSubmitOpen = false">{{ locale === 'zh' ? '继续编辑' : 'Keep editing' }}</button><button type="button" class="button button-primary" @click="submitForReview">{{ locale === 'zh' ? '确认提交' : 'Confirm submission' }}</button></div></section></div></Teleport>
  </div>
</template>

<style scoped>
.card-audio-manager audio { width: min(360px, 100%); height: 32px; margin-top: 8px; }
.card-audio-manager article > span { min-width: 0; flex: 1; }
.card-cover-manager article { position: relative; display: grid; grid-template-columns: 140px minmax(0, 1fr) 32px; align-items: center; gap: 14px; padding: 10px; border: 1px solid var(--line); border-radius: 12px; }
.card-cover-manager img { width: 140px; height: 76px; border-radius: 8px; object-fit: cover; }
.card-cover-manager span { display: grid; min-width: 0; gap: 5px; }
.card-cover-manager strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-cover-manager small { color: var(--muted); }
.card-cover-manager button { border: 0; background: transparent; color: var(--ink); font-size: 18px; }
.card-video-preview-manager article { display: grid; grid-template-columns: 190px minmax(0, 1fr) 32px; align-items: center; }
.card-video-preview-manager video { width: 190px; aspect-ratio: 16 / 9; border-radius: 9px; background: #080816; object-fit: contain; }
.card-video-preview-manager article > span { min-width: 0; }
@media (max-width: 640px) { .card-video-preview-manager article { grid-template-columns: 1fr 32px; } .card-video-preview-manager video { grid-column: 1 / -1; width: 100%; } }
.editor-public-layout { display:grid; gap:12px; }
.editor-preview-primary,.editor-preview-secondary { display:grid; align-content:start; gap:12px; }
.editor-public-layout .live-companion-card { min-height:520px; }
.editor-public-gallery { position:relative; overflow:hidden; height:245px; border:1px solid var(--line); border-radius:18px; background:var(--card); }.editor-public-gallery>img { width:100%; height:100%; object-fit:cover; }.editor-public-gallery>button { position:absolute; z-index:2; top:50%; width:34px; height:34px; border:1px solid rgba(255,255,255,.3); border-radius:50%; background:rgba(10,10,28,.68); color:white; }.editor-public-gallery>.previous { left:10px; }.editor-public-gallery>.next { right:10px; }.editor-public-gallery>div { position:absolute; right:0; bottom:10px; left:0; display:flex; justify-content:center; gap:5px; }.editor-public-gallery>div button { width:6px; height:6px; padding:0; border:0; border-radius:50%; background:rgba(255,255,255,.55); }.editor-public-gallery>div button.active { width:18px; border-radius:4px; background:white; }
.editor-public-voices { display:grid; gap:7px; padding:13px; border:1px solid var(--line); border-radius:16px; background:var(--card); }.editor-public-voices>p { margin:0; color:var(--muted); font-size:10px; }.editor-public-voices article { display:grid; gap:7px; padding:9px; border:1px solid var(--line); border-radius:10px; background:var(--paper); }.editor-public-voices span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:9px; }.editor-public-voices audio { width:100%; height:31px; }
.editor-public-voices.embedded { margin-top:16px; padding:13px 0 0; border:0; border-top:1px solid var(--line); border-radius:0; background:transparent; }
.editor-preview-videos { display:grid; gap:8px; padding:12px; border:1px solid var(--line); border-radius:16px; background:var(--card); }.editor-preview-videos>p { margin:0; color:var(--muted); font-size:10px; }.editor-preview-videos>div { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px; }.editor-preview-videos article { overflow:hidden; border:1px solid var(--line); border-radius:9px; background:var(--paper); }.editor-preview-videos video { display:block; width:100%; aspect-ratio:16/9; background:#080816; object-fit:cover; }.editor-preview-videos span { display:block; overflow:hidden; padding:7px; text-overflow:ellipsis; white-space:nowrap; font-size:8px; }
@media (min-width:1350px) { .card-editor-workspace { grid-template-columns:minmax(640px,.95fr) minmax(560px,1.05fr); }.editor-public-layout { grid-template-columns:minmax(300px,.9fr) minmax(0,1.1fr); align-items:start; } }
.card-form-column.is-editing-locked { opacity:.56; filter:saturate(.7); }
.sortable-media article { cursor:grab; }.sortable-media article:active { cursor:grabbing; }.sortable-media article:hover { border-color:var(--lav-deep); }
.submit-confirm-backdrop { position:fixed; z-index:1100; inset:0; display:grid; place-items:center; padding:24px; background:rgba(5,5,17,.82); backdrop-filter:blur(12px); }.submit-confirm-dialog { width:min(460px,100%); display:grid; justify-items:center; gap:14px; padding:34px; border:1px solid var(--line); border-radius:22px; background:var(--card); box-shadow:0 30px 90px rgba(0,0,0,.45); text-align:center; }.submit-confirm-dialog>span { color:var(--gold); font-size:28px; }.submit-confirm-dialog h2 { margin:0; font:600 30px 'Playfair Display',serif; }.submit-confirm-dialog p { margin:0; color:var(--muted); font-size:12px; line-height:1.7; }.submit-confirm-dialog>div { display:flex; gap:10px; margin-top:8px; }
</style>
