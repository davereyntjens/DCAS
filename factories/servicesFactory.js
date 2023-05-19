const storeFactory = require('./store/storeFactory')
const { dosGuardFactory } = require('./DOSGuardFactory.js')
const middlewareFactory = require('./webapp/middlewareFactory')
const userModelFactory = require('./model/userModelFactory')
const passportFactory = require('./passportFactory')
const webappFactory = require('./webapp/webappFactory')
const emailFactory = require('./emailFactory')
const pathsFactory = require('./paths/pathsFactory')
const viewFactory = require('./viewFactory')
const express = require('express')

async function servicesFactory (config) {
	
  const services = { config, express }

  await pathsFactory(services, config.paths)
  await viewFactory(services, config.views)
  await middlewareFactory(services, config.webapp)

  await storeFactory(services, config.store)
  await dosGuardFactory(services, config.dosGuard)
  await webappFactory(services, config.webapp)

  await userModelFactory(services, config.userModel)
  await emailFactory(services, config.email)

  return services
}

module.exports = servicesFactory