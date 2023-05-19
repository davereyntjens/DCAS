const registerPaths = (paths) => {
  paths.subscriptions = { view : {}, data : {}, action : {}, redirects : {}, webhook : {} }
  paths.cart = { view : {}, data : {}, action : {}, redirects : {}, webhook : {} }

  paths.subscriptions.view.index= '/auth/r/page/subscriptions'
  paths.subscriptions.view.manage= '/auth/r/page/subscriptions/manage'
  paths.subscriptions.view.pricing= '/r/page/subscriptions/pricing'
  paths.subscriptions.data.index= '/auth/r/data/subscriptions'
  paths.subscriptions.data.catalog= '/r/data/subscriptions/catalog.json'
  paths.subscriptions.data.pricing= '/r/data/subscriptions/pricing.json'
  paths.subscriptions.action.add= '/auth/action/subscriptions/:price_id'
  paths.subscriptions.redirects.success= '/auth/subscriptions/operations/checkout/success.callback'
  paths.subscriptions.redirects.failure= '/auth/subscriptions/operations/checkout/failure.callback'
  // paths.subscriptions.webhook.events= '/api/subscriptions/operations/checkout.callback'
  paths.subscriptions.webhook.events= '/checkout/stripe/webhook' // carefull ... webhooks must be registered in the stripe dashboard


  paths.cart.view.index= '/auth/r/page/cart'
  paths.cart.data.index= '/auth/r/data/cart'
  paths.cart.action.reduce= '/auth/action/cart/reduce/:price_id'
  paths.cart.action.remove= '/auth/action/cart/remove/:price_id'
  paths.cart.action.add= '/auth/action/cart/remove/:price_id'
  paths.cart.action.checkout= '/auth/action/cart/checkout'
}

module.exports = registerPaths