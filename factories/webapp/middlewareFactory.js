const mustBeLoggedInFactory = require('./mustBeLoggedin')
const fileUploadsFactory = require('./fileUploads')

async function middlewareFactory(services, config) {
  await mustBeLoggedInFactory(services, config)
  await fileUploadsFactory(services, config)
  // await addCartDataFactory(services, config) // added by stripe

  const { app, middlewares } = services
}

module.exports = middlewareFactory