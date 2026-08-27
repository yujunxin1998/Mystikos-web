module.exports = {
  apps: [
    {
      name: 'mystikos-web',
      script: '.output/server/index.mjs',
      cwd: '/srv/mystikos-web',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3000,
        NUXT_MYSTIKOS_API_BASE: 'http://116.62.218.227:8099',
        NUXT_PUBLIC_PASSWORD_ENCRYPTION_ENABLED: 'true'
      },
      max_memory_restart: '500M',
      time: true,
      autorestart: true
    }
  ]
}
