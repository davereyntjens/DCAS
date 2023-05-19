const mysqlFactory = require('./mysqlFactory')
const Keyv = require('@keyvhq/core')
const KeyvMySQL = require('@keyvhq/mysql')

const storeFactory = async (services, config) => {
  services.store = {
    mysql: await mysqlFactory(config.mysql),
    persistentKeyValueStore: new Keyv({ store: new KeyvMySQL(`mysql://${config.mysql.user}:${config.mysql.password}@${config.mysql.host}:${config.mysql.port || 3306}/${config.mysql.database}`)}),
    volatileLocalKeyValueStore: new Keyv()
  }

  process.on('SIGINT', async function() {
    try {
      await services.store.mysql.end()
    } catch (e) {
      console.error(e)
      return process.exit(-1)
    }
    process.exit(0)
  })
}

module.exports = storeFactory