// import LeakyBucket from 'leaky-bucket';

// require = require("@std/esm")(module, { cjs: true });
// const { LeakyBucket } = require('leaky-bucket')

const MAKE_REQUEST = 'make_request'
const MAKE_LOGIN_REQUEST = 'make_login_request'
const MAKE_SESSION = 'make_session'
const CHANGE_SESSION_IP = 'change_ip'
const FILE_UPLOAD = 'file_upload'
const ACTIVATE_SESSION= 'activate_session'
const max_active_sessions_per_ip = 5

async function DOSGuardFactory (services, config) {
  const LeakyBucket = (await import('leaky-bucket')).default

  const buckets = new Map()
  const maxNumberOfBuckets = 1000

  async function throttleBuckets(key, config) {
    if (!config) {
      throw new Error('Invalid operation')
    }
    if (!buckets.has(key)) {
      if (buckets.size > maxNumberOfBuckets) {
        throw new Error('Too many buckets')
      }
      const bucket = await new LeakyBucket({
        ...config,
        idleTimeout: config.idleTimeout || 5 * 60 * 1000
      })
      buckets.set(key, bucket)
      bucket.on('idleTimeout', () => {
        buckets.delete(key)
        bucket.end()
      })
    }
    return buckets.get(key)
  }

  const rateLimits = {
    ip_with_or_without_session: {
      make_request: { capacity: 220, interval: 60 },
      make_session: { capacity: 10,  interval: 60 * 60 },
      activate_session: { capacity: 10, interval: 60 * 60 }, // there can only be max_active_sessions_per_ip per ip
      file_upload:  { capacity: 100, interval: 60 * 60 }
    },
    session_with_anonymous_user: {
      // when moving around with a phone, its ip changes ... so the ip address of a session changes
      change_ip: { capacity: 2, interval: 60 * 5 },
      make_request: { capacity: 60, interval: 60 },
      make_login_request: { capacity: 5, interval: 60 * 5 },
      file_upload: { capacity: 15, interval: 60 * 60 }
    },
    session_with_authenticated_user: {
      change_ip: { capacity: 10, interval: 60 * 20 },
      make_request: { capacity: 120, interval: 60 },
      file_upload: { capacity: 30, interval: 60 * 60 }
    }
  }

  services.dosGuard = {
    throttle: async (operation, { ip, session, user }) => {
      if (ip && !session) { // must be called before session is created
        await throttleBuckets(`${operation}:${ip}`, rateLimits.ip_with_or_without_session[operation])
      }
      if (session) { // must be called after session is created and user loaded
        if (user) {
          await throttleBuckets(`${operation}:${session.ip}`, rateLimits.session_with_authenticated_user[operation])
        } else {
          await throttleBuckets(`${operation}:${session.id}`, rateLimits.session_with_anonymous_user[operation])
        }
      }
    }
  }
}

module.exports = {
  MAKE_REQUEST,
  MAKE_LOGIN_REQUEST,
  MAKE_SESSION,
  CHANGE_SESSION_IP,
  ACTIVATE_SESSION,
  FILE_UPLOAD,
  max_active_sessions_per_ip,
  dosGuardFactory: DOSGuardFactory
}