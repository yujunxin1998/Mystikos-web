import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const contrastRatio = (foreground, background) => {
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/.{2}/g).map(channel => Number.parseInt(channel, 16) / 255)
    const linear = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  }
  const first = luminance(foreground)
  const second = luminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

test('陪玩目录的筛选工具栏可换行，吸顶偏移为视口顶部', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-public.css', import.meta.url), 'utf8')

  assert.match(css, /\.directory-toolbar\s*\{[^}]*top:0/)
  assert.doesNotMatch(css, /\.directory-toolbar\s*\{[^}]*top:82px/)
  assert.match(css, /\.directory-filters\s*\{[^}]*flex-wrap:wrap/)
  assert.match(css, /\.directory-search span\{[^}]*top:50%/)
  assert.match(css, /\.directory-search input\{[^}]*line-height:1\.25|\.directory-search input\{[^}]*\/1\.25/)
})

test('陪玩卡片使用按用户区分的视觉强调色', async () => {
  const source = await readFile(new URL('../app/pages/companions/index.vue', import.meta.url), 'utf8')

  assert.match(source, /--companion-accent.*companionAccent\(person\.userId\)/)
})

test('陪玩清单第一期按设计使用场景 Hero、会所竖卡与今晚推荐预览', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')
  const source = await readFile(new URL('../app/pages/companions/index.vue', import.meta.url), 'utf8')
  const config = await readFile(new URL('../nuxt.config.ts', import.meta.url), 'utf8')

  assert.match(config, /companion-club\.css/)
  assert.match(source, /class="companion-directory club-skin"/)
  assert.match(source, /directory-spotlight/)
  assert.match(source, /preview\.badge/)
  assert.match(source, /directory-hero-scenery/)
  assert.match(source, /directory-search-icon/)
  assert.match(source, /tagIcon\(tag\.label\)/)
  assert.match(source, /directory-media/)
  assert.match(source, /directory-card-link/)
  assert.doesNotMatch(source, /directory-mini-avatar/)
  assert.doesNotMatch(source, /class="directory-portrait"/)
  assert.match(css, /\.companion-directory\.club-skin\s+\.directory-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3/)
  assert.match(css, /\.directory-grid\s+\.directory-card-link\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*3/)
  assert.match(css, /\.directory-grid\s+\.directory-media\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0/)
  assert.match(css, /\.directory-grid\s+\.directory-card-actions\s*\{[^}]*display:\s*none/)
  assert.match(css, /\.companion-directory\.club-skin\s+\.directory-card-link\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(css, /\.companion-directory\.club-skin\s+\.directory-hero\s*\{[^}]*min-height:\s*390px/)
  assert.match(css, /\.companion-directory\.club-skin\s*>\s*\.directory-hero\s*\{[^}]*width:\s*100%/)
  assert.match(css, /\.companion-directory\.club-skin\s+\.directory-hero\s*\{[^}]*border-radius:\s*0;/)
  assert.match(css, /\.companion-directory\.club-skin\s*\{[^}]*padding:\s*0 0 100px/)
  assert.match(css, /\.companion-directory\.club-skin\s+\.directory-toolbar\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(css, /\.companion-directory\.club-skin\s+\.directory-search button\s*\{[^}]*border-radius:\s*50%/)
  assert.match(css, /\.directory-card\.is-feature\s+\.directory-media\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0/)
  assert.match(css, /\.directory-card\.is-compact\s+\.directory-card-link\s*\{[^}]*grid-template-columns:\s*118px\s+minmax\(0,\s*1fr\)/)
  assert.match(css, /\.directory-spotlight/)
  assert.match(source, /directory-skeleton/)
  assert.match(source, /directory-grid-loading/)
  assert.match(source, /v-for="item in 6"/)
  assert.doesNotMatch(source, /v-if="loading" class="directory-empty"/)
  assert.match(css, /\.directory-skeleton-media\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*3/)
  assert.match(css, /@keyframes club-directory-shimmer/)
})

test('陪玩详情按设计使用身份档案、主相册和点单台三栏', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')
  const source = await readFile(new URL('../app/pages/companions/[slug].vue', import.meta.url), 'utf8')

  assert.match(source, /club-identity-cover/)
  assert.match(source, /club-gallery-caption/)
  assert.match(source, /club-gallery-step/)
  assert.match(source, /club-book-heading/)
  assert.match(source, /club-book-status/)
  assert.match(css, /\.club-detail-grid\s*\{[^}]*grid-template-columns:\s*minmax\(250px,\s*0\.82fr\)\s*minmax\(390px,\s*1\.38fr\)\s*minmax\(320px,\s*1\.08fr\)/)
  assert.match(css, /\.club-gallery-main\s*\{[^}]*min-height:\s*390px/)
  assert.match(css, /\.public-companion-profile\.club-skin\s+\.section-wrap\s*\{[^}]*width:\s*min\(1280px/)
})

test('陪玩清单和详情为浅色主题提供独立可读配色', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')

  assert.match(css, /\.site-shell\[data-theme="light"\]\s+\.club-skin\s*\{[^}]*--club-bg:\s*#f4f0e9/)
  assert.match(css, /\.site-shell\[data-theme="light"\]\s+\.companion-directory\.club-skin\s*\{/)
  assert.match(css, /\.site-shell\[data-theme="light"\]\s+\.public-companion-profile\.club-skin\s*\{/)
  assert.match(css, /data-theme="light"[^}]+\.club-panel\s*\{[^}]*background:/)
  assert.match(css, /data-theme="light"[^}]+\.club-book input[^}]+\{[^}]*color-scheme:\s*light/)
  assert.match(css, /data-theme="light"[^}]+\.directory-card\.is-compact[^}]+h3\s*\{[^}]*color:\s*var\(--club-ink\)/)
  assert.match(css, /\.directory-hero h1\s*\{[^}]*color:\s*var\(--club-on-media\)/)
  assert.match(css, /\.directory-search input\s*\{[^}]*color:\s*var\(--club-on-media\)/)
  assert.match(css, /\.directory-search input::placeholder\s*\{[^}]*rgba\(244,\s*242,\s*255,\s*0\.5\)/)
  assert.match(css, /data-theme="light"[^}]+\.directory-card\.is-compact\s+\.directory-media\s*\{[^}]*#ece7fb/)
  assert.match(css, /data-theme="light"[^}]+\.directory-card\.is-compact\s+\.directory-favorite\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255/)
})

test('浅色陪玩模块完整区分页面表面、控件表面和媒体前景色', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')

  assert.match(css, /--club-surface-page:\s*#0d0e24/)
  assert.match(css, /--club-surface-panel:\s*#151630/)
  assert.match(css, /--club-on-media:\s*#fff/)
  assert.match(css, /--club-control-surface:\s*rgba\(8,\s*9,\s*28,\s*0\.7[02]\)/)
  assert.match(css, /data-theme="light"[^}]+--club-surface-page:\s*#f4f0e9/)
  assert.match(css, /data-theme="light"[^}]+--club-control-surface:\s*#faf7fc/)
  assert.match(css, /data-theme="light"[^}]+\.directory-filters button\s*\{[^}]*background:/)
  assert.match(css, /data-theme="light"[^}]+\.directory-pagination button\s*\{[^}]*box-shadow:/)
  assert.match(css, /data-theme="light"[^}]+\.public-profile-state\s*\{[^}]*color:\s*var\(--club-muted\)/)
})

test('陪玩模块的键盘与触屏交互不依赖悬浮状态', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')

  assert.match(css, /\.directory-search input:focus-visible/)
  assert.match(css, /\.directory-filters button:focus-visible/)
  assert.match(css, /\.directory-favorite:focus-visible/)
  assert.match(css, /\.directory-pagination button:focus-visible/)
  assert.match(css, /\.club-gallery-step:focus-visible/)
  assert.match(css, /\.club-duration button:focus-visible/)
  assert.match(css, /@media\s*\(hover:\s*none\)/)
})

test('陪玩详情不在应用主内容区内嵌套第二个 main landmark', async () => {
  const source = await readFile(new URL('../app/pages/companions/[slug].vue', import.meta.url), 'utf8')

  assert.match(source, /<div class="public-companion-profile club-skin">/)
  assert.doesNotMatch(source, /<main class="public-companion-profile club-skin">/)
})

test('浅色详情的相册文案仍使用媒体专用前景色', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')
  const source = await readFile(new URL('../app/pages/companions/[slug].vue', import.meta.url), 'utf8')

  assert.match(css, /\.club-gallery-caption strong\s*\{[^}]*color:\s*var\(--club-on-media\)/)
  assert.match(css, /\.club-gallery-placeholder\s*\{[^}]*color:\s*var\(--club-on-media\)/)
  assert.match(source, /class="club-gallery-placeholder"/)
})

test('媒体控件在浅色主题中仍保持可读的深色叠层', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')
  const surface = css.match(/--club-on-media-surface:\s*(#[0-9a-f]{6})/i)?.[1]
  const foreground = css.match(/--club-on-media:\s*(#[0-9a-f]{3,6})/i)?.[1]
  const accent = css.match(/--club-on-media-accent:\s*(#[0-9a-f]{6})/i)?.[1]

  assert.ok(surface)
  assert.ok(foreground)
  assert.ok(accent)
  assert.ok(contrastRatio(foreground.length === 4 ? '#ffffff' : foreground, surface) >= 4.5)
  assert.ok(contrastRatio(accent, surface) >= 4.5)
  assert.match(css, /\.directory-status-chip\s*\{[^}]*background:\s*var\(--club-on-media-surface\)/)
  assert.match(css, /\.directory-favorite\s*\{[^}]*background:\s*var\(--club-on-media-surface\)/)
  assert.match(css, /\.directory-favorite:hover\s*\{[^}]*color:\s*var\(--club-on-media-accent\)/)
  assert.match(css, /\.directory-favorite\.saved\s*\{[^}]*color:\s*var\(--club-on-media-accent\)/)
})

test('浅色主题的金色小字在页面和卡片表面达到 WCAG AA 对比度', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')
  const lightTheme = css.match(/\.site-shell\[data-theme="light"\]\s+\.club-skin\s*\{[^}]*\}/)?.[0] || ''
  const gold = lightTheme.match(/--club-gold:\s*(#[0-9a-f]{6})/i)?.[1]

  assert.ok(gold)
  assert.ok(contrastRatio(gold, '#f4f0e9') >= 4.5)
  assert.ok(contrastRatio(gold, '#fffdf9') >= 4.5)
})

test('详情页为全部照片和视频提供直接入口', async () => {
  const source = await readFile(new URL('../app/pages/companions/[slug].vue', import.meta.url), 'utf8')
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /gallery\.slice\(0,\s*4\)/)
  assert.doesNotMatch(source, /showcaseVideos\.slice\(0,\s*2\)/)
  assert.match(source, /class="public-video-grid club-video-strip"/)
  assert.match(css, /\.club-gallery-thumbs\s*\{[^}]*overflow-x:\s*auto/)
  assert.match(css, /\.club-video-strip\s*\{[^}]*overflow-x:\s*auto/)
})

test('目录筛选栏位于 Hero 裁剪区外并保持吸顶', async () => {
  const source = await readFile(new URL('../app/pages/companions/index.vue', import.meta.url), 'utf8')
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')

  assert.match(source, /<\/header>\s*<section class="directory-toolbar"/)
  assert.match(css, /\.directory-toolbar\s*\{[^}]*position:\s*sticky[^}]*top:\s*0/)
  assert.match(css, /\.site-shell:has\([^)]*\.companion-directory\.club-skin[^)]*\)\s*\{[^}]*overflow-x:\s*clip/)
})

test('详情主区域和媒体弹层使用明确语义与完整焦点状态', async () => {
  const source = await readFile(new URL('../app/pages/companions/[slug].vue', import.meta.url), 'utf8')
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')

  assert.match(source, /<section class="club-panel club-identity"\s+aria-labelledby="club-profile-name">/)
  assert.match(source, /<section class="club-panel club-book"\s+aria-labelledby="club-book-title">/)
  assert.match(source, /id="club-profile-name"/)
  assert.match(source, /id="club-book-title"/)
  assert.match(source, /v-if="imageExpanded"[^>]+aria-label=/)
  assert.match(source, /ref="imageCloseButton"/)
  assert.match(css, /\.directory-card-link:focus-visible/)
  assert.match(css, /\.club-book input:focus-visible/)
  assert.match(css, /\.public-video-close:focus-visible/)
  assert.match(css, /\.directory-card-link:focus-visible,\s*\n\.public-companion-profile\.club-skin \.public-gallery-expand:focus-visible\s*\{[^}]*outline-offset:\s*-[0-9]+px/)
})
