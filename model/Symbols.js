
class Symbols {

  constructor(user) {
    user.credits = user.credits || 15
    user.symbols = user.symbols || ['GOOG', 'IBM', 'PTC']
    user.calculationsMade = user.calculationsMade || { }
    user.dcaInvestmentPlans = user.dcaInvestmentPlans || {}
    user.notes= user.notes || {}
    this.user = user
  }

  addSymbol(symbol) {
    this.user.symbols.push(symbol)
  }

  getSymbols() {
    return this.user.symbols
  }

  removeSymbol(symbol) {
    this.user.version = (this.user.version || 0) + 1
    this.user.symbols = this.user.symbols.filter((s) => s !== symbol)
  }

  updateNotes(symbol, notes) {
    this.user.notes[symbol] = notes
  }

  getNotes(symbol) {
    return this.user.notes[symbol]
  }

  getRemainingCredits() {
    return this.user.credits
  }

  addCredits(credits) {
    this.user.credits += credits
  }

  hasRemainingCredits() {
    return this.user.credits > 0
  }

  reduceCredits(calcCost) {
    this.user.credits -= calcCost
  }

  addCalculationMade(calculationKey, result) { // this consumes a credit
    // e.g. `dca:${symbol}-${term}-${amount}-${currency}-${start}-${length}`

    if (this.user.calculationsMade[calculationKey]) return
    this.user.calculationsMade[calculationKey] = result
    this.reduceCredits(1)
  }

  addDCAInvestmentPlan(dcaInvestmentPlans) {
    this.user.dcaInvestmentPlans.push(roiQuery)
  }

  removeDCAInvestmentPlan(dcaInvestmentPlans) {
    this.user.dcaInvestmentPlans = this.dcaInvestmentPlans.filter((q) => q !== dcaInvestmentPlans)
  }
}

module.exports = Symbols