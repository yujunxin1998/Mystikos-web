<script setup lang="ts">
const { t, companions, rankings } = useMystikos()
const activeBoard = ref<'companions' | 'bosses'>('companions')
const activeRanking = computed(() => rankings[activeBoard.value])
</script>

<template>
  <section class="hero section-wrap">
    <div class="hero-copy">
      <p class="eyebrow"><span />{{ t('hero.eyebrow') }}</p>
      <h1>{{ t('hero.title') }}</h1>
      <p class="hero-body">{{ t('hero.body') }}</p>
      <div class="hero-actions">
        <NuxtLink to="/companions" class="button button-primary">{{ t('hero.primary') }} <span>→</span></NuxtLink>
        <NuxtLink to="/shop" class="button button-ghost">{{ t('hero.secondary') }} <span>↗</span></NuxtLink>
      </div>
      <div class="hero-proof"><span class="orbital-stars"><i>✦</i><i>✧</i><i>✦</i></span><div><small>{{ t('social.label') }}</small><strong>{{ t('social.value') }}</strong></div></div>
    </div>
    <div class="hero-scene" aria-label="A celestial Mystikos scene">
      <div class="planet planet-one" /><div class="planet planet-two" /><div class="orbit orbit-one" /><div class="orbit orbit-two" />
      <div class="hero-portrait hero-portrait-back"><img src="https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=700&q=84" alt="Guild companion" /></div>
      <div class="hero-portrait hero-portrait-front"><img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=84" alt="Guild companion" /></div>
      <aside class="constellation-card"><div class="constellation-top"><span class="spark">✦</span><span class="live-dot" /> {{ t('hero.online') }}</div><h2>{{ t('hero.cardTitle') }}</h2><p>{{ t('hero.cardText') }}</p><div class="face-stack"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=70" alt="" /><img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=120&q=70" alt="" /><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" alt="" /></div></aside>
    </div>
  </section>

  <section id="companions" class="section-wrap companions-section">
    <div class="section-heading"><div><p class="eyebrow"><span />{{ t('companions.eyebrow') }}</p><h2>{{ t('companions.title') }}</h2></div><NuxtLink to="/companions" class="text-link">{{ t('companions.all') }} <span>↗</span></NuxtLink></div>
    <div class="companion-grid"><CompanionCard v-for="companion in companions" :key="companion.name" :companion="companion" /></div>
  </section>

  <section class="shop-teaser-band"><div class="section-wrap shop-teaser"><div class="teaser-images"><img src="https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=84" alt="Mystikos candle" /><img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=84" alt="Mystikos jewellery" /></div><div><p class="eyebrow"><span />{{ t('shop.eyebrow') }}</p><h2>{{ t('shop.title') }}</h2><p>{{ t('shop.body') }}</p><NuxtLink to="/shop" class="button button-primary">{{ t('shop.visit') }} <span>↗</span></NuxtLink></div></div></section>

  <section id="ranking" class="ranking-section preview-section"><div class="section-wrap ranking-layout">
    <div class="ranking-copy"><p class="eyebrow"><span />{{ t('ranking.eyebrow') }} <em class="preview-badge">{{ t('preview.badge') }}</em></p><h2>{{ t('ranking.title') }}</h2><p class="preview-note">{{ t('preview.note') }}</p><div class="ranking-privacy"><span>◌</span><div><strong>{{ t('ranking.private') }}</strong><p>{{ t('ranking.privateText') }}</p></div></div></div>
    <div class="ranking-panel"><div class="ranking-tabs" role="tablist"><button :class="{ active: activeBoard === 'companions' }" role="tab" :aria-selected="activeBoard === 'companions'" @click="activeBoard = 'companions'">{{ t('ranking.companions') }}</button><button :class="{ active: activeBoard === 'bosses' }" role="tab" :aria-selected="activeBoard === 'bosses'" @click="activeBoard = 'bosses'">{{ t('ranking.bosses') }}</button></div><ol class="ranking-list"><li v-for="entry in activeRanking" :key="entry.place"><span class="place">{{ entry.place }}</span><div class="ranking-name"><strong>{{ entry.name }}</strong><small>{{ entry.note }}</small></div><div class="rank-score"><strong>{{ entry.score }}</strong><small>{{ activeBoard === 'companions' ? t('ranking.score') : t('ranking.guardianScore') }}</small></div><span class="rank-change" :class="{ neutral: entry.change === '—' }">{{ entry.change }} <small v-if="entry.change !== '—'">{{ t('ranking.change') }}</small></span></li></ol></div>
  </div></section>

  <section id="membership" class="section-wrap membership-section preview-section"><div class="membership-copy"><p class="eyebrow"><span />{{ t('membership.eyebrow') }} <em class="preview-badge">{{ t('preview.badge') }}</em></p><h2>{{ t('membership.title') }}</h2><p>{{ t('membership.body') }}</p><p class="preview-note">{{ t('preview.note') }}</p></div><div class="membership-card"><div class="member-card-top"><span>{{ t('membership.current') }}</span><strong>LV. 03</strong></div><h3>Devoted friend</h3><div class="member-line"><span>¥5,000</span><i><b /></i><span>¥20,000</span></div><p><strong>68%</strong> {{ t('membership.progress') }}</p><div class="membership-perks"><span>{{ t('membership.perk1') }}</span><span>{{ t('membership.perk2') }}</span><span>{{ t('membership.perk3') }}</span></div></div></section>

  <section class="intimacy-section preview-section"><div class="section-wrap intimacy-layout"><div class="intimacy-art"><div class="heart-orbit" /><div class="heart-shape">♡</div><div class="tiny-star star-a">✦</div><div class="tiny-star star-b">✧</div></div><div class="intimacy-copy"><p class="eyebrow"><span />{{ t('intimacy.eyebrow') }} <em class="preview-badge">{{ t('preview.badge') }}</em></p><h2>{{ t('intimacy.title') }}</h2><p>{{ t('intimacy.body') }}</p><p class="preview-note">{{ t('preview.note') }}</p><div class="affinity-card"><div><small>{{ t('intimacy.stage') }}</small><strong>03 · 1,680</strong></div><div class="affinity-progress"><i /></div><p>{{ t('intimacy.next') }}</p></div><div class="achievement-row"><small>{{ t('intimacy.gifts') }}</small><span>✿</span><span>⌁</span><span>♔</span><span class="locked">✧</span></div></div></div></section>
</template>
