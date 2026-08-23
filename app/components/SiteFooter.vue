<script setup lang="ts">
const { t } = useMystikos()
</script>

<template>
  <footer class="site-footer">
    <div class="footer-brand"><BrandLogo /><p>{{ t('footer.tagline') }}</p><div class="footer-social"><a href="https://discord.com" target="_blank" rel="noreferrer">Discord</a><a href="mailto:guild@mystikos.demo">Email</a></div></div>
    <div class="footer-links">
      <div><strong>{{ t('footer.guild') }}</strong><NuxtLink to="/#companions">{{ t('footer.companions') }}</NuxtLink><NuxtLink to="/#ranking">{{ t('footer.ranking') }}</NuxtLink><NuxtLink to="/#membership">{{ t('footer.membership') }}</NuxtLink></div>
      <div><strong>{{ t('footer.shop') }}</strong><NuxtLink to="/shop">{{ t('footer.fragrance') }}</NuxtLink><NuxtLink to="/shop">{{ t('footer.accessories') }}</NuxtLink><NuxtLink to="/shop">{{ t('footer.apparel') }}</NuxtLink></div>
      <div><strong>{{ t('footer.contact') }}</strong><a href="mailto:guild@mystikos.demo">guild@mystikos.demo</a><span>{{ t('footer.hours') }}</span></div>
    </div>
    <div class="footer-bottom"><p>© 2026 Mystikos</p><p>{{ t('footer.legal') }}</p><div><a href="#">{{ t('footer.privacy') }}</a><a href="#">{{ t('footer.terms') }}</a></div></div>
  </footer>
</template>
