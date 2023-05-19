async function registerPaths(paths) {
  paths.symbols = { view : {}, data : {}, action : {}, redirects : {}, webhook : {} }
  paths.cart = { view : {}, data : {}, action : {}, redirects : {}, webhook : {} }

  paths.symbols.view.index= '/:symbol'
  paths.symbols.data = '/data/:symbol'
  paths.symbols.action.add= '/add/:symbol'
  paths.symbols.action.remove= '/remove/:symbol'
}

module.exports = registerPaths