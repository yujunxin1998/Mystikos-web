import securityConfig from './config/security.config'
import { MYSTIKOS_API_BASE } from './config/backend.config.mjs'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-23',
  devtools: { enabled: true },
  css: ['~/assets/css/fonts.css', '~/assets/css/main.css', '~/assets/css/auth.css', '~/assets/css/companion.css', '~/assets/css/companion-card.css', '~/assets/css/companion-cover.css', '~/assets/css/companion-public.css', '~/assets/css/companion-carousel.css', '~/assets/css/companion-public-carousel.css', '~/assets/css/companion-video-list.css', '~/assets/css/companion-public-video-list.css'],
  runtimeConfig: {
    // Override with NUXT_MYSTIKOS_API_BASE in deployment environments.
    // Server-only: the browser still calls the same-origin /api/auth-proxy route.
    mystikosApiBase: MYSTIKOS_API_BASE,
    public: {
      // 默认值定义在 config/security.config.ts，部署时可直接编辑该文件或通过环境变量覆盖。
      passwordEncryptionEnabled: securityConfig.passwordEncryptionEnabled
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
