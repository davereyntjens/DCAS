const appFactory = require('./appFactory')

async function main () {
  console.log(new Date(), 'Starting')
  const app = await appFactory()
  console.log('Starting app...')
  await app.start()
}

main()