// What is the model... ?
// A user has:
// roiQueries
// symbols

// Finding uncorrelated symbols that all go up together ...
// Find symbols who's correlation over 1 year periods is low ...?
// Yet all perform well over a long period of time ...

// once you where logged in, immediately redirect to the login page
// roi(symbol)
// add symbols and see the RIO fo the symbol

// The anonymous user can add and remove symbols
// The signed-in user can add and remove symbols
// when the session does not yet have a symbols object, then a symbols is created
// When the anonymous user signs in, and he does not yet have a symbols object,
// then the symbols object is taken from the session
// When a singed in user signs out, then he gets back the symbols object of the session
// Axiom: When the user is signed in, symbols and notes are of the signed in user
// Symbols model

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