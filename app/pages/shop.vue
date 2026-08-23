<script setup lang="ts">
const { t, products, wishlist, toggleWishlist } = useMystikos()
const category = ref('all')
const selected = ref<typeof products[number] | null>(null)
const categories = computed(() => [
  { id: 'all', label: t('shop.all') }, { id: 'fragrance', label: t('shop.fragrance') },
  { id: 'accessories', label: t('shop.accessories') }, { id: 'apparel', label: t('shop.apparel') },
  { id: 'stationery', label: t('shop.stationery') }
])
const filteredProducts = computed(() => category.value === 'all' ? products : products.filter(product => product.category === category.value))
const isSaved = (id: string) => wishlist.value.includes(id)
</script>

<template>
  <section class="shop-hero section-wrap">
    <div><p class="eyebrow"><span />{{ t('shop.eyebrow') }}</p><h1>{{ t('shop.title') }}</h1><p>{{ t('shop.body') }}</p></div>
    <div class="shop-hero-orbit"><i /><i /><span>✦</span><div class="shop-hero-object">⌁</div></div>
  </section>

  <section class="shop-content section-wrap">
    <div class="shop-toolbar"><p>{{ t('shop.filter') }}</p><div class="category-list" role="tablist"><button v-for="item in categories" :key="item.id" :class="{ active: category === item.id }" :aria-selected="category === item.id" role="tab" @click="category = item.id">{{ item.label }}</button></div></div>
    <div v-if="filteredProducts.length" class="product-grid"><article v-for="product in filteredProducts" :key="product.id" class="product-card"><button class="product-image-button" :aria-label="`${t('shop.details')}: ${product.name}`" @click="selected = product"><img :src="product.image" :alt="product.name" loading="lazy"><span class="product-zoom">↗</span></button><div class="product-info"><div><small>{{ t('shop.recommended') }} {{ product.companion }}</small><h2>{{ product.name }}</h2><strong>{{ product.price }}</strong></div><button class="wishlist-button" :class="{ saved: isSaved(product.id) }" :aria-label="isSaved(product.id) ? t('modal.remove') : t('shop.wishlist')" @click="toggleWishlist(product.id)">♡</button></div></article></div>
    <p v-else class="empty-state">{{ t('shop.empty') }}</p>
    <p id="wishlist" class="shop-note">✦ {{ t('shop.note') }} <span v-if="wishlist.length">{{ wishlist.length }} {{ t('shop.saved').toLowerCase() }}.</span></p>
  </section>

  <Teleport to="body"><Transition name="fade"><div v-if="selected" class="product-modal-backdrop" role="presentation" @click.self="selected = null"><section class="product-modal" role="dialog" aria-modal="true" :aria-label="selected.name"><button class="modal-close" :aria-label="t('modal.close')" @click="selected = null">×</button><img :src="selected.image" :alt="selected.name"><div><p class="eyebrow"><span />{{ t('shop.recommended') }} {{ selected.companion }}</p><h2>{{ selected.name }}</h2><strong>{{ selected.price }}</strong><p>{{ selected.description }}</p><button class="button button-primary" @click="toggleWishlist(selected.id)">{{ isSaved(selected.id) ? t('modal.remove') : t('shop.wishlist') }} <span>♡</span></button></div></section></div></Transition></Teleport>
</template>
