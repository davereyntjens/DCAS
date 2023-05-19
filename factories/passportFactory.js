const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const { Router } = require('express')
const _ = require('lodash')
const { MAKE_LOGIN_REQUEST } = require('./DOSGuardFactory.js')

const passportRouterFactory = async (services, config) => {

  googleAuthConfig = config["google.auth"]

  const { userModel, dosGuard, paths } = services
  const { login, logout, redirects } = paths.auth
  const { callback, defaultRedirectAfterCallback } = redirects

  if(!userModel) throw new Error('userModel is required')

  // this data gets stored in the cookie
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  // data is taken from the cookie, then used to lookup the user
  passport.deserializeUser((id, done) => {
    // can have skip a field when serializing?
    // todo ... autosave!!
    userModel.findById(id).then((user) => {
      done(null, user)
    }).catch((err) => {
      done(err)
    })
  })

  passport.use(new GoogleStrategy({
    // enable service: Google+ API in your google project
    clientID: googleAuthConfig.clientID,
    clientSecret: googleAuthConfig.clientSecret,
    callbackURL: googleAuthConfig.callbackURL
  },
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile)
    const user = {
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value
    }
    userModel.createOrRetrieveUser(user).then((user) => {
      cb(null, user)
    })
  }
  ))

  // paths factory ...
  const router = Router()

  // STEP 1: This starts the oauth process - passport redirects to google oauth page
  router.get(login, async (req, res, next) => {
    await dosGuard.throttle(MAKE_LOGIN_REQUEST, { session: req.session })
    req.session.returnTo = req.session.returnTo || req.query.returnTo
    next()
  }, passport.authenticate('google', { scope: ['profile', 'email'] }))

  // STEP 2: This is the callback url that google redirects to after successful login
  // A code is passed to this url, which is used to get the access token
  // passport.authenticate('google') is a middlewares that
  router.get(callback,
    passport.authenticate('google', {
      failureRedirect: '/',
      keepSessionInfo: true // when logging in (or out), the session is rotated - this copies the data inside
    }), (req, res) => {
      // redirect to the page the user was on before logging in ... or home
      const redirectTo = req.session.returnTo || defaultRedirectAfterCallback || '/'
      res.redirect(redirectTo)
    })

  router.get(logout, async (req, res) => {
    req.logout((err) => {
      res.redirect('/')
    })
  })

  // passport installs itself on the app
  services.app.use(passport.initialize())
  services.app.use(passport.session())
  services.app.use(router)
  services.passport = {
    router,
    passport
  }
}

module.exports = passportRouterFactory
