export default defineNuxtConfig({
  compatibilityDate: '2026-08-23',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css', '~/assets/css/companion.css'],
  runtimeConfig: {
    // Override with NUXT_MYSTIKOS_API_BASE in deployment environments.
    // Required. Configure with NUXT_MYSTIKOS_API_BASE; do not bake deployment addresses into the bundle.
    mystikosApiBase: ''
  },
  app: {
    head: {
      title: 'Mystikos — A guild for the games you remember',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#111229' },
        { name: 'description', content: 'Mystikos is a premium guild companion and collectible experience.' }
      ],
      link: [{ rel: 'preconnect', href: 'https://images.unsplash.com' }]
    }
  }
})
