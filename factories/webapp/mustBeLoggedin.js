const assert = require('assert')

async function mustBeLoggedInFactory(services, config) {
  const { paths } = services
  const { login: loginPath  } = paths.auth
  assert(loginPath, 'The path "login" must be configured to use the mustBeLoggedIn middlewares')

  const mustBeLoggedIn = async (req, res, next) => {
    // the user must be logged in work with stripe sessions ...
    if (!req.user) {
      req.session.returnTo = req.originalUrl
      res.redirect(loginPath)
    } else {
      next()
    }
  }

  services.middlewares = services.middlewares || {}
  services.middlewares.mustBeLoggedIn = mustBeLoggedIn
}

module.exports = mustBeLoggedInFactory