module.exports = {
  apps: [{
    name: 'dapa-run',
    script: 'npx',
    args: 'next dev -p 3000',
    env: {
      HOSTNAME: '::',
      PORT: 3000,
    },
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
  }]
}
