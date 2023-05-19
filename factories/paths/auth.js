const registerPaths = (paths) => {
  paths.auth = { view : {}, data : {}, action : {}, redirects : {}, webhook : {} }

  paths.auth.login= '/auth/google'
  paths.auth.logout= '/auth/logout'
  paths.auth.redirects.callback= '/auth/google/callback'
  paths.auth.redirects.defaultRedirectAfterLogin= '/'
}

module.exports = registerPaths