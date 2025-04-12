/**
 * PM2 Ecosystem Configuration
 * This file defines the application process management for different environments
 */

module.exports = {
  apps: [
    {
      name: 'thiqax-api',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2/error.log',
      out_file: 'logs/pm2/out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'thiqax-worker',
      script: 'src/workers/index.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development'
      },
      env_staging: {
        NODE_ENV: 'staging'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2/worker-error.log',
      out_file: 'logs/pm2/worker-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'thiqax-scheduler',
      script: 'src/scheduler.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      cron_restart: '0 */12 * * *', // Restart every 12 hours
      env: {
        NODE_ENV: 'development'
      },
      env_staging: {
        NODE_ENV: 'staging'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2/scheduler-error.log',
      out_file: 'logs/pm2/scheduler-out.log',
      merge_logs: true,
      time: true
    }
  ],

  deploy: {
    staging: {
      user: 'deployer',
      host: 'staging.thiqax.com',
      ref: 'origin/develop',
      repo: 'git@github.com:Mutawai/ThiQaX.git',
      path: '/var/www/thiqax-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && NODE_ENV=staging npm run migrate:up && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
      env: {
        NODE_ENV: 'staging'
      }
    },
    production: {
      user: 'deployer',
      host: 'thiqax.com',
      ref: 'origin/main',
      repo: 'git@github.com:Mutawai/ThiQaX.git',
      path: '/var/www/thiqax-production',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && NODE_ENV=production npm run migrate:up && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
