const mysql = require('mysql')
const { promisify } = require('util')
const Keyv = require('@keyvhq/core')
const KeyvMySQL = require('@keyvhq/mysql')


/*
  // with scheduled events, we can do a TTL on mysql sessions..
  CREATE EVENT delete_inactive_users ON SCHEDULE EVERY 1 DAY DO
  DELETE FROM users WHERE last_activity < DATE_SUB(NOW(), INTERVAL 30 DAY);
*/

/*
version: '3.3'
services:
  mysql:
    platform: linux/x86_64
    image: mysql:5.7.31
    container_name: default-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: 'db'
      # So you don't have to use root, but you can if you like
      MYSQL_USER: 'user'
      MYSQL_PASSWORD: 'user'
      # You can use whatever password you like
      # Password for root access
      MYSQL_ROOT_USERNAME: 'root'
      MYSQL_ROOT_PASSWORD: 'admin'
    ports:
      - '3306:3306'
    expose:
      - '3306'
 */

async function mysqlFactory (config) {
  let client = null
  try {
    client = mysql.createConnection({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password
    })
    client.connectAsync = promisify(client.connect)
    client.queryAsync = promisify(client.query)
    await client.connectAsync()
  } catch (err) {
    console.error('Failed to connect to mysql')
    console.error('Did you start the mysql docker-compose.yaml file?')
    console.error('Did you run:')
    console.error('ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'password\'')
    console.error(err)
  }

  return client
}

module.exports = mysqlFactory
