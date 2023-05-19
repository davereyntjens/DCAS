const axios = require('axios')

// alternative provider: https://eodhistoricaldata.com/financial-apis/stock-etfs-fundamental-data-feeds/

async function AlphaAdvantageFactory (config, store) {

  const getAutocompleteSymbols = async (term) => {
    // query to mysql client to get symbols
    const query = `SELECT symbolName FROM Symbols WHERE symbolName LIKE '${term}%' LIMIT 10`
    const res = await mysql.queryAsync(query)
    return res.map((row) => row.symbolName)
  }

  getHousePrices = async (country = 'BEL') => {
    const res = await store.mysql.queryAsync(`SELECT * FROM housing_prices WHERE LOCATION = '${country}'`)
    const mapped = res.map((row) => {
      return {
        time: new Date(`${row.TIME}-01-01T00:00:00.000Z`).getTime(),
        date: `${row.TIME}-01-01`,
        price: row.Value
      }
    })
    mapped.sort((a, b) => a.time - b.time)
    return mapped
  }

  const getInflationRate = async (country = 'us') => {
    if (country === 'us') {
      const url = `https://www.alphavantage.co/query?function=INFLATION&apikey=${apiKey}`
      if (!await keyv.get(url)) {
        const res = await axios.get(url)
        await keyv.set(url, res.data['INFLATION'])
      }
      return await keyv.get(url)
    }
    throw new Error('Country not supported')
  }


  return {
    getWeeklyData,
    getMonthlyData,
    getInflationRate,
    convertDataToSeries,
    getAutocompleteSymbols,
    getHousePrices
  }
}

module.exports = AlphaAdvantageFactory