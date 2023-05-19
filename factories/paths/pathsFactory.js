const authRegisterPaths = require('./auth')
const stripeRegisterPaths = require('./stripe')

async function pathsFactory(services, config) {
  services.paths = services.paths || {}
  services.paths.home = '/'
  authRegisterPaths(services.paths)
  stripeRegisterPaths(services.paths)
}

module.exports = pathsFactory