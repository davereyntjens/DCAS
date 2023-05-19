const dollarCostAveragingCalc = (stockQuotes, amount) => {
  let totalCost = 0
  let buyAmountUsd = amount
  let totalStock = 0
  let lastClose = 0
  let nrOfBuys = 0
  let buyDates = []
  let noneInvestedValue = []
  let startDate = stockQuotes.length > 0? new Date(stockQuotes[0].date): undefined
  let endDate = undefined
  for (let i = 0; i < stockQuotes.length; i++) {
    nrOfBuys++
    totalStock += buyAmountUsd / stockQuotes[i].c
    totalCost += buyAmountUsd
    lastClose = stockQuotes[i].c
    endDate = new Date(stockQuotes[i].date)
    buyDates.push({
      date: stockQuotes[i].date,
      portfolioValue: totalStock * lastClose
    })
    noneInvestedValue.push({
      date: stockQuotes[i].date,
      portfolioValue: totalCost
    })
  }
  return {
    startDate,
    endDate,
    buyDates,
    totalStock,
    nrOfBuys,
    totalCost,
    portfolioValue: totalStock * lastClose,
    noneInvestedValue
  }
}

module.exports = {
  dollarCostAveragingCalc
}