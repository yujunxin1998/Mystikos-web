<script setup lang="ts">
const { t } = useMystikos()
const { authenticated, userName } = useDemoAuth()
const notice = ref('')

const walletAction = (action: 'topup' | 'withdraw') => {
  notice.value = t(action === 'topup' ? 'profile.topupNotice' : 'profile.withdrawNotice')
}

onMounted(() => {
  if (!authenticated.value) navigateTo('/auth')
})

const games = [
  { name: 'League of Legends', short: 'LOL', hours: '42.5h', rank: 'Emerald II', color: '#c9a566' },
  { name: 'VALORANT', short: 'VAL', hours: '26h', rank: 'Platinum I', color: '#d88f9d' },
  { name: 'Counter-Strike 2', short: 'CS2', hours: '18.5h', rank: 'Gold Nova', color: '#80b3c4' }
]
const achievements = [
  { icon: '✦', title: 'First constellation', note: 'Your first session together', unlocked: true },
  { icon: '♡', title: 'Kindred signal', note: 'Affinity level 3 reached', unlocked: true },
  { icon: '✿', title: 'Gifted light', note: 'Sent 12 keepsakes', unlocked: true },
  { icon: '☾', title: 'Night archive', note: 'Complete 10 sessions', unlocked: false }
]
const orders = [
  { id: '#MK-24108', date: 'Aug 19, 2026', game: 'League of Legends', person: 'Mika Sol', role: 'Companion', duration: '2h 30m', amount: '$40.00', status: 'Complete' },
  { id: '#MK-23991', date: 'Aug 14, 2026', game: 'Counter-Strike 2', person: 'Noah Ryn', role: 'Companion', duration: '1h 45m', amount: '$35.00', status: 'Complete' },
  { id: '#MK-23876', date: 'Aug 08, 2026', game: 'VALORANT', person: 'Ari Vale', role: 'Boss', duration: '3h 00m', amount: '$54.00', status: 'Complete' }
]
</script>

<template>
  <div v-if="authenticated" class="profile-page section-wrap">
    <header class="profile-hero"><div><p class="eyebrow"><span />{{ t('profile.eyebrow') }}</p><h1>{{ t('profile.greeting') }}, {{ userName || 'Stargazer' }}.</h1><p>{{ t('profile.subtitle') }}</p></div><div class="profile-level"><span>{{ t('profile.membership') }}</span><strong>LV. 03</strong><small>6,840 / 10,000 glow</small></div></header>

    <section class="profile-section"><div class="profile-section-heading"><div><p class="eyebrow"><span />{{ t('profile.gamesEyebrow') }}</p><h2>{{ t('profile.games') }}</h2></div><span>{{ t('profile.totalTime') }} <b>87h</b></span></div><div class="game-grid"><article v-for="game in games" :key="game.name" class="game-card" :style="{ '--game-accent': game.color }"><span class="game-short">{{ game.short }}</span><div><h3>{{ game.name }}</h3><p>{{ game.rank }}</p></div><strong>{{ game.hours }}</strong></article></div></section>

    <section class="profile-section wallet-section"><div class="wallet-card"><div><p class="eyebrow"><span />{{ t('profile.walletEyebrow') }}</p><h2>{{ t('profile.wallet') }}</h2><small>{{ t('profile.available') }}</small><strong class="wallet-balance">$128.50</strong></div><div class="wallet-actions"><button class="button button-primary" @click="walletAction('topup')">{{ t('profile.topup') }} <span>→</span></button><button class="button button-ghost" @click="walletAction('withdraw')">{{ t('profile.withdraw') }} <span>→</span></button></div></div><p v-if="notice" class="wallet-notice" role="status">{{ notice }}</p></section>

    <section class="profile-section achievement-layout"><div><p class="eyebrow"><span />{{ t('profile.achievementsEyebrow') }}</p><h2>{{ t('profile.achievements') }}</h2><p class="profile-muted">{{ t('profile.achievementsBody') }}</p><div class="intimacy-meter"><div><span>{{ t('profile.intimacy') }}</span><strong>1,680 / 2,000</strong></div><i><b /></i><small>{{ t('profile.intimacyNext') }}</small></div></div><div class="achievement-grid"><article v-for="item in achievements" :key="item.title" class="profile-achievement" :class="{ locked: !item.unlocked }"><span>{{ item.icon }}</span><div><strong>{{ item.title }}</strong><small>{{ item.note }}</small></div></article></div></section>

    <section class="profile-section orders-section"><div class="profile-section-heading"><div><p class="eyebrow"><span />{{ t('profile.ordersEyebrow') }}</p><h2>{{ t('profile.orders') }}</h2></div><span>{{ t('profile.ordersHint') }}</span></div><div class="orders-table"><div class="order-row order-head"><span>{{ t('profile.order') }}</span><span>{{ t('profile.session') }}</span><span>{{ t('profile.duration') }}</span><span>{{ t('profile.total') }}</span><span>{{ t('profile.status') }}</span></div><article v-for="order in orders" :key="order.id" class="order-row"><div><strong>{{ order.id }}</strong><small>{{ order.date }}</small></div><div><strong>{{ order.game }}</strong><small>{{ order.role }} · {{ order.person }}</small></div><span>{{ order.duration }}</span><strong>{{ order.amount }}</strong><em>{{ order.status }}</em></article></div></section>
  </div>
</template>
