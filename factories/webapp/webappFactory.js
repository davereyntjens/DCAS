const express = require('express')
const cors = require('cors')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session)
const flash = require('express-flash')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const helmet = require('helmet')
const {
  MAKE_REQUEST,
  MAKE_SESSION,
  CHANGE_SESSION_IP,
  FILE_UPLOAD,
  ACTIVATE_SESSION,
  max_active_sessions_per_ip
} = require('../DOSGuardFactory.js')
const encode = require('html-entities').encode
const { doActionMiddleware } = require('../HttpActions')

// port, sessionSecret
async function webappFactory (services, config) {
  const { express, store, dosGuard } = services
  const { allowed_origins } = config

  // add some security
  // https://www.thesmartscanner.com/blog/how-to-secure-your-nodejs-express-javascript-application-part-2

  const app = express()
  app.set('view engine', 'ejs')

  // app.use(helmet())
  app.use(async (req, res, next) => {
    // prevent dos attacks
    await dosGuard.throttle(MAKE_REQUEST, { ip: req.ip })
    next()
  })

  // log all requests
  app.use((req, res, next) => {
    console.log(req.method, req.path)
    next()
  })

  // Note: mongoDB might be a better choice for sessions
  // because of its TTL feature
  const mysqlSessionStore = new MySQLStore({
    // Whether to automatically check for and clear expired sessions
    // How frequently expired sessions will be cleared; milliseconds
    // The maximum age of a valid session; milliseconds
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000, // 15 minutes
    expiration: 24 * 60 * 60 * 1000 // 24 hours
  }, store.mysql)

  // add session management via cookies - must come before routes and most other_old middlewares!
  app.use(session({
    store: mysqlSessionStore,
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: false, // only save session if something is stored (not for anonymous users)
    cookie: { secure: false } // must be false for http connections
  }))

  app.use(async (req, res, next) => {
    if (req.originalUrl.includes('webhook')) {
      // webhook requests should not make sessions...
      // stripe calls to webhook from checkout session - via tunnel: nginx.apptalk.org
      next()
      return
    }
    if (!req.session.dos) {
      // allow dynamic hostnames ...
      const host = req.get('host')
      const protocol = req.protocol
      const basePath = `${protocol}://${host}`
      if (!allowed_origins.includes(basePath) && false) {
        throw new Error(`Origin ${basePath} is not allowed`)
      }
      // dos protection
      req.session.dos = {}
      req.session.dos.ip = req.ip
      req.session.basePath = basePath
      await dosGuard.throttle(MAKE_SESSION, { ip: req.ip })
    }
    if (req.session.dos.ip != req.ip) {
      await dosGuard.throttle(CHANGE_SESSION_IP, { session: req.session })
      req.session.dos.ip = req.ip
    }
    const sessionsKey = `sessions:${req.ip}`
    const active_sessions = await services.store.volatileLocalKeyValueStore.get(sessionsKey) || []
    if (!active_sessions.includes(req.session.id)) {
      await dosGuard.throttle(ACTIVATE_SESSION, { ip: req.ip })
      active_sessions.push(req.session.id)
      if (active_sessions.length > max_active_sessions_per_ip) {
        active_sessions.shift()
      }
      await services.store.volatileLocalKeyValueStore.set(sessionsKey, active_sessions, 15 * 60 * 1000)
    }
    next()
  })

  app.use(flash())
  if (config.allow_cors) {
    // allow cross-origin requests
    // todo: make this more secure
    app.use(cors())
  }

  // Parse both JSON and urlencoded bodies (other_old form of encoding post data)
  app.use(express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf
    }
  }))
  app.use(express.urlencoded({ extended: true }))

  app.getAllRegisteredPaths = () => {
    function getPaths (layer) {
      if (layer.route) {
        return {
          path: layer.route.path,
          methods: Object.getOwnPropertyNames(layer.route.methods)
        }
      } else if (layer.name === 'router' && layer.handle.stack) {
        return layer.handle.stack.map(getPaths).flat()
      }
    }

    const routes = app._router.stack.map(getPaths).flat().filter((x) => x)
    const paths = {}
    for (const route of routes) {
      if (paths[route.path]) {
        paths[route.path] = paths[route.path].concat(route.methods)
      } else {
        paths[route.path] = route.methods
      }
    }

    return paths
  }

  app.getConfiguredPaths = () => {
    const getPaths = (obj) => {
      return Object.getOwnPropertyNames(obj).map((key) => {
        if (obj[key] instanceof Object) { return getPaths(obj[key]) }
        return [obj[key]]
      }).flat()
    }
    const paths = getPaths(services.paths)
    return paths
  }

  function doPathValidityCheck () {
    const registeredPaths = app.getAllRegisteredPaths()
    const configuredPaths = app.getConfiguredPaths()
    for (const path of configuredPaths) {
      if (!registeredPaths[path]) {
        console.error(`Path ${path} is configured but not registered!`)
      }
    }
  }

  // add a start function
  app.start = async () => {
    // all registered paths
    doPathValidityCheck()

    // add an error handler
    app.use((err, req, res, next) => {
      console.error(err.stack)
      // res.status(500).send('Something broke!')
      // send literal html
      res.status(500).send(`
       <html>
         <body>
           <h1>Something broke!</h1>
           <pre>${encode(err.stack)}</pre>
         </body>
       </html>
    `)
    })
    app.listen(config.port, () => console.log(`Example app listening on port ${config.port}!`))
  }

  app.stop = async () => {
    store.mysql.end()
    app.close()
  }

  const { middlewares } = services
  app.use(middlewares.fileuploadMiddleware)
  app.use(doActionMiddleware)

  services.app = app
}

module.exports = webappFactory
