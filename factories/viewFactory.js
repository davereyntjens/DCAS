const ejs = require('ejs')
const datefns = require('date-fns')
const formatter = {
  formatDate : (date) => datefns.format(date, 'yyyy-MM-dd'),
  formatNumber:  (number) => number.toFixed(2)
}

async function viewFactory(services, config) {
  const { app, paths } = services

  services.viewFactory = {
    createView: async (viewPath, testDatas) => {
      // test the view with test data
      try {
        for (const testData of testDatas) {
          const extendedData = {
            ...testData,
            paths,
            formatter
          }
          const html = await ejs.renderFile(viewPath, extendedData)
          console.log(html)
        }
      } catch (err) {
        throw err
      }

      // create the view
      return {
        render: async (req, res, data) => {
          // add some extra data to the data object ...
          const flashMessages = req.session.flashMessages || []
          req.session.flashMessages = []
          const extendedData = {
            ...data,
            user: req.user,
            session: req.session,
            currentUrl: req.url,
            paths,
            flashMessages,
            catalog: req.catalog,
            formatter
          }

          const html = await ejs.renderFile(viewPath, extendedData)
          res.send(html)
        }
      }
    }
  }
}

module.exports = viewFactory