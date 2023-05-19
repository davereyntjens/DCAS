
const redirect = (url, opt) => {
  opt = opt || {}
  opt.flashMessages = opt.flashMessages || []
  const flashMessages = opt.flashMessages.filter(f => f)
  return { redirect: url, flashMessages }
}

const json = (data, opt) => {
  opt = opt || {}
  opt.flashMessages = opt.flashMessages || []
  const flashMessages = opt.flashMessages.filter(f => f)
  return { json: data, flashMessages }
}
const render = (view, data, opt) => {
  opt = opt || {}
  opt.flashMessages = opt.flashMessages || []
  const flashMessages = opt.flashMessages.filter(f => f)
  return { render: { view, data }, flashMessages }
}

async function doAction(req, res, action) {
  if (action instanceof Promise) {
    action = await action
  }
  if (action.flashMessages) {
    req.session.flashMessages = (req.session.flashMessages || []).concat(action.flashMessages)
  }
  if (action.redirect) {
    res.redirect(action.redirect)
  } else if (action.json) {
    res.json(action.json)
  } else if (action.render) {
    if (typeof action.render.view === 'string') {
      res.render(action.render.view, action.render.data)
    } else {
      await action.render.view.render(req, res, action.render.data)
    }
  } else {
    throw new Error('Unknown action')
  }
}

const doActionMiddleware = (req, res, next) => {
  res.do = (action) => {
    doAction(req, res, action)
  }
  next()
}

module.exports = {
  redirect,
  json,
  render,
  doActionMiddleware
}