const servicesFactory = require('./factories/servicesFactory')
const httpActions = require('./factories/httpActions')
const alphaAdvantageConfig = require('./config/alphaAdvantage.config.json')
const AlphaAdvantageFactory = require('./services/AlphaAdvantageFactory')
const { dollarCostAveragingCalc } = require('./services/dollarCostAveragingCalc')
const registerPaths = require('./paths')
const Symbols = require('./model/Symbols')

async function createViews (services) {
  const { viewFactory } = services

  const commonTestData = {
    flashMessages: [],
    currentUrl: '/',
    catalog: {
      products: []
    },
    symbols: [],
    credits: 15,
    outOfCredits: false
  }
  const commonTestDatas = [
    { session: null, user: null, ...commonTestData },
    { session: { cart: null } , user: { name: 'John Doe' }, ...commonTestData },
    { session: { cart: []   } , user: { name: 'John Doe' }, ...commonTestData }
  ]
  services.views = services.views || {}
  services.views.index = await viewFactory.createView('views/index.ejs', commonTestDatas)
}

async function appFactory () {
  const services = await servicesFactory({
    store: require('./config/store.config.json'),
    email: require('./config/email.config.json'),
    stripe: require('./config/stripe.config.json'),
    oauth: require('./config/oauth.config.json'),
    webapp: require('./config/webapp.config.json')
  })
  await createViews(services)
  const { redirect, json, render } = httpActions

  const bucket = 'default-bucket'
  const { app, paths, store, views } = services
  await registerPaths(paths)
  const express = services.express
  const appConfig = services.config.webapp

  const stockQuoteClient = await AlphaAdvantageFactory(alphaAdvantageConfig, store)

  if (process.env !== 'production') {
    app.set('etag', false)
    app.use((req, res, next) => {
      res.set('Cache-Control', 'no-store')
      next()
    })
  }

  app.set('views', __dirname + '/views')
  app.use(express.static(__dirname + '/public'))
  app.use((req, res, next) => {
    const flashMessages = req.flash('success')
    res.customRender = (view, data) => {
      res.render(view, {
        ...data,
        user: req.user,
        session: req.session,
        currentUrl: req.url,
        paths,
        flashMessages,
        basePath: appConfig.basePath
      })
    }
    next()
  })
  const router = express.Router()

  router.get('/api/autocomplete-values/symbols', async (req, res) => {
    const term = req.query.term
    const symbols = await stockQuoteClient.getAutocompleteSymbols(term)
    res.json(symbols)
  })

  router.get('/', async (req, res) => {
    res.redirect('/PTC?term=weekly&amount=30&currency=usd&start=2014-08-05&length=400')
  })

  async function save (session, user) {
    if (user) await user.save()
    if (session) await session.save()
  }

  router.get('/buycredits', async (req, res) => {
    const symbolsModel = getSymbols(req.session, req.user)
    symbolsModel.addCredits(15)
    await save(req.session, req.user)
    res.redirect('/')
  })

  async function addSymbol (session, user, symbol) {
    const symbols =  getSymbols(session, user)
    symbols.addSymbol(symbol)
    await save(session, user)
    return json({}, {
      flashMessages: [
        { type: 'success', message: `Added ${symbol} to your watchlist.` }
      ]
    })
  }

  async function removeSymbol (session, user, symbol) {
    const symbols =  getSymbols(session, user)
    symbols.removeSymbol(symbol)
    await save(session, user)
    return json({}, {
      flashMessages: [
        { type: 'success', message: `Removed ${symbol} from your watchlist.` }
      ]
    })
  }

  function getSymbols (session, user) {
    if (user) {
      return new Symbols(user.symbols = user.symbols || JSON.parse(JSON.stringify(session.symbols)))
    }
    else return new Symbols(session.symbols = session.symbols || { })
  }

  function parseInvestmentPlan(req) {
    const term = req.query.term
    const amount = +req.query.amount
    const currency = req.query.currency
    const start = req.query.start
    const length = +req.query.length
    return {
      term,
      amount,
      currency,
      start,
      length
    }
  }

  async function getIndex(session, user, symbol, investmentPlan, urlParams) {
    const { term, amount, currency, start, length } = investmentPlan
    if (!symbol || !term || !amount || !currency || !start || !length) {
      return redirect('/PTC?term=weekly&amount=30&currency=usd&start=2014-08-05&length=400')
    }
    const calculationKey = `dca:${symbol}-${term}-${amount}-${currency}-${start}-${length}`
    const symbolsModel = getSymbols(session, user)
    const outOfCredits = !symbolsModel.hasRemainingCredits()
    return render(services.views.index, {
      symbols: symbolsModel.getSymbols(),
      search: urlParams,
      credits: symbolsModel.getRemainingCredits(),
      outOfCredits
    })
  }

  function getGraphConfig(symbol, amount, stockData, dcaResult, housePrices) {
    const labels = [...stockData.map(d => d.date), ...housePrices.map(d => d.date)]
                   .sort((d1, d2) => new Date(d1) - new Date(d2))
    return {
      data: {
          labels: labels,
          datasets: [
          {
            label: symbol,
            data: stockData.map(d => {
              return {
                x: d.date,
                y: d.c
              }
            }),
            borderColor: 'red',
            fill: false
          },
          {
            label: 'portfolio Value',
            data: dcaResult.buyDates.map(d => {
              return {
                x: d.date,
                y: d.portfolioValue
              }
            }),
            borderColor: 'green',
            fill: false,
            yAxisID: 'y1'
          },
          {
            label: 'invested amount',
            data: dcaResult.noneInvestedValue.map(d => {
              return {
                x: d.date,
                y: d.portfolioValue
              }
            }),
            borderColor: 'blue',
            fill: false,
            yAxisID: 'y1'
          },
          {
              label: 'house price',
              data: housePrices.map(d => {
                return {
                  x: d.date,
                  y: d.price
                }
              }),
              borderColor: 'purple',
              fill: false
            }
        ]
      },
      description: {
        symbol,
          amount,
          startDate: dcaResult.startDate,
          endDate: dcaResult.endDate,
          totalStock: dcaResult.totalStock,
          nrOfBuys: dcaResult.nrOfBuys,
          totalCost: dcaResult.totalCost,
          portfolioValue: dcaResult.portfolioValue
      }
    }
  }

  async function getStockData(session, user, symbol, investmentPlan) {
    const { term, amount, currency, start, length } = investmentPlan
    if (!symbol || !term || !amount || !currency || !start || !length) {
      return redirect('/PTC?term=weekly&amount=30&currency=usd&start=2014-08-05&length=400')
    }
    const calculationKey = `dca:${symbol}-${term}-${amount}-${currency}-${start}-${length}`
    const symbolsModel = getSymbols(session, user)
    const outOfCredits = !symbolsModel.hasRemainingCredits()
    if (outOfCredits) {
      return json({  outOfCredits })
    }

    console.log('symbol', symbol)
    const stockData = await stockQuoteClient.getWeeklyData(symbol)
    const housePrices = await stockQuoteClient.getHousePrices('BEL')
    let filteredStockData = stockData.filter(d => new Date(d.date).getTime() >= new Date(start).getTime())
    filteredStockData = filteredStockData.slice(0, length)
    const dcaResult = dollarCostAveragingCalc(filteredStockData, amount)
    symbolsModel.addCalculationMade(calculationKey, dcaResult)
    await save(session, user)

    return json(getGraphConfig(symbol, amount, stockData, dcaResult, housePrices))
  }

  router.get(paths.symbols.view.index, async (req, res) => {
    const investmentPlan = parseInvestmentPlan(req)
    const urlParams = (req.query) ? new URLSearchParams(req.query).toString() : ''
    res.do(getIndex(req.session, req.user, req.params.symbol, investmentPlan, urlParams))
  })

  router.get('/data/:symbol', async (req, res) => {
    const investmentPlan = parseInvestmentPlan(req)
    res.do(getStockData(req.session, req.user, req.params.symbol, investmentPlan))
  })

  router.post(paths.symbols.action.add, async (req, res) => {
    res.do(addSymbol(req.session, req.user, req.params.symbol))
  })

  router.post(paths.symbols.action.remove, async (req, res) => {
    res.do(removeSymbol(req.session, req.user, req.params.symbol))
  })

  app.use(router)
  return app
}

module.exports = appFactory
