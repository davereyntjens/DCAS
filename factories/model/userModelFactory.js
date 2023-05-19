const _ = require('lodash')

async function UserModelFactory (services, config) {
  const { store } = services

  if(!store) throw new Error('store is required')

  await store.mysql.queryAsync(`
        CREATE TABLE IF NOT EXISTS users (
            id INT NOT NULL AUTO_INCREMENT, 
            googleId VARCHAR(255)   NULL,
            linkedinId VARCHAR(255) NULL,
            githubId VARCHAR(255)   NULL,
            email VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL,
            data     json         NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  `)

  async function save() {
    // todo: on concurrent update, merge the json data ...
    const id = this.id
    const data = _.omit(this, ['id', 'googleId', 'email', 'name']) // todo: put save on the prototype
    await store.mysql.queryAsync('UPDATE users SET data = ? WHERE id = ?', [JSON.stringify(data), id])
  }

  const findById = async (id) => {
    const rows = await store.mysql.queryAsync('SELECT * FROM users WHERE id = ?', [id])
    if (rows.length === 0) throw new Error('User not found')
    if (rows.length > 1) throw new Error('Multiple users found')
    const userData = {
      ..._.pick(rows[0], ['id', 'googleId', 'email', 'name']),
      ...JSON.parse(rows[0].data || '{}') // add the data from the json column
    }
    return Object.assign(Object.create({ save }), userData)
  }

  const createOrRetrieveUser = async (user) => {
    const { googleId, name, email } = user
    const query = 'SELECT * FROM users WHERE email = ?'
    let res = await store.mysql.queryAsync(query, [email])
    if (res.length === 0) {
      const insertQuery = 'INSERT INTO users (googleId, email, name) VALUES (?, ?, ?)'
      await store.mysql.queryAsync(insertQuery, [googleId, email, name])
      res = await store.mysql.queryAsync(query, [email])
    }
    return findById(res[0].id)
  }

  services.userModel = {
    findById,
    createOrRetrieveUser
  }
}

module.exports = UserModelFactory