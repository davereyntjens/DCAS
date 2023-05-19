const Symbols = require('./Symbols')

class User {

  constructor(user) {
    user.symbols = user.symbols || {}
    this.symbols = new Symbols(user.symbols)
  }
}

module.exports = User