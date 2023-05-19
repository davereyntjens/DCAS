/* eslint-env mocha */

'use strict'

const assert = require('assert')
const axios = require('axios')

describe('alphavantage getData', () => {
  it('alphavantage - get some stock data', async function () {
    // https://www.alphavantage.co/
    // https://marketstack.com/product => 30 years history (30 euro per month)

    const apiKey = 'CF84OB0M795UQIZ6'
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=PTC&apikey=${apiKey}`
    // get json data from url
    const res = await axios.get(url)
    const data1 = res.data['Weekly Time Series']
    const data2 = []
    for (let key in data1) {
      const val = data1[key]
      data2.push({
        c: +val['4. close'],
        date: key,
        time: new Date(key).getTime()
      })
    }
    data2.sort((a, b) => a.time - b.time)
    let totalCost = 0
    let buyAmountUsd = 20.0
    let totalStock = 0
    let lastClose = 0
    let buys = 0
    for (let i = 0; i < data2.length; i++) {
      // if (i % 30 !== 0) continue
      buys++
      totalStock += buyAmountUsd / data2[i].c
      totalCost += buyAmountUsd
      lastClose = data2[i].c
    }
    console.log("10 year - 20 USD monthly", buys, totalCost, totalStock * lastClose)
    console.log(res.data2)
  })

})
