export default defineNuxtConfig({
  compatibilityDate: '2026-08-23',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Override with NUXT_MYSTIKOS_API_BASE in deployment environments.
    mystikosApiBase: 'http://116.62.218.227:8099',
      public: {
        // Configure Discord OAuth using these variables in deployment environments.
        discordClientId: '',
        discordRedirectUri: '',
        // Optional full authorization URL. When set, it overrides the generated URL.
        discordAuthorizeUrl: ''
      }
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
