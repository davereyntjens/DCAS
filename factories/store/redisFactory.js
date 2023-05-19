const Redis = require("ioredis")

async function redisFactory (config, label) {
  let client = null
  try {
    client = new Redis({
      host: config.host,
      port: config.port
    })

    client.on("error",  err => {
      console.error(new Date(), "redis", label || 'generic', config, err)
    })

    client._pinger = setInterval(() => {
      if (client.status !== 'ready') {
        return
      }

      // rc.ping()
    }, 15000)

  } catch (err) {
    console.error('Failed to connect to redis')
    console.error('Did you start the redis docker-compose.yaml file?')
    console.error(err)
    throw err
  }

  return client
}

module.exports = redisFactory