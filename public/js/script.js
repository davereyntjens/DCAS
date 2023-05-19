var options = { year: 'numeric', month: '2-digit', day: '2-digit' }
var dateFormatter = new Intl.DateTimeFormat('en-US', options)
const formatDate = (date) => {
  try {
    return dateFormatter.format(new Date(date))
  } catch (e) {
    return '' + date
  }
}
const formatNumber = (number) => {
  try {
    return number.toFixed(2)
  } catch (e) {
    return '' + number
  }
}

const annualReturn = (X, Y, n) => {
  return (Math.pow((Y/X), (365/n)) - 1) * 100
}

function showChart(data) {
  const ctx = document.getElementById('myChart')
  const config = {
    type: 'line',
    data: data,
    options: {
      plugins: {
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'xy',
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            // date nfs format string
            tooltipFormat: 'MM/dd/yyyy',
            unit: "year",
            displayFormats: {
              day: 'MM/dd/yyyy'
            }
          },
          title: {
            display: true,
            text: ''
          },
          position: 'bottom'
        },
        y: {
          startAtZero: true,
          type: 'linear',
          display: true,
          position: 'left'
        },
        y1: {
          startAtZero: true,
          type: 'linear',
          display: true,
          position: 'right'
        }
      },
    },
  }
  const chart = new Chart(ctx, config)

  function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
      dataset.data.push(data);
    });
    chart.update();
  }
  function removeData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
      dataset.data.pop();
    });
    chart.update();
  }
}

$(document).ready(() => {

  $( "#autocomplete-input-symbol" ).autocomplete({
    source: "/api/autocomplete-values/symbols"
  })

  const searchParams = new URLSearchParams(window.location.search);
  $('#term').val(searchParams.get('term'))
  $('#amount').val(searchParams.get('amount'))
  $('#currency').val(searchParams.get('currency'))
  $('#start').val(searchParams.get('start'))
  $('#length').val(searchParams.get('length'))

  // add a click listener to the symbollist items
  $('.symbollist .remove').click(function(e) {
    e.preventDefault()
    let symbol = $(this).data('symbol')
    console.log('remove:', symbol)
    $.post(`/remove/${symbol}`, function(data){
      window.location.reload()
    })
  })

  $('#addSymbol').click(function(e) {
    e.preventDefault()
    let symbol = $('#autocomplete-input-symbol').val()
    console.log('add:', symbol)
    $.post(`/add/${symbol}`, function(data){
      window.location.reload()
    })
  })

  console.log(window.location)
  if (!outOfCredits) {
    $.get(`data${window.location.pathname}${window.location.search}`, function(data, status){
      showChart(data.data)
      const { symbol, amount, startDate, endDate, totalStock, nrOfBuys, totalCost, portfolioValue } = data.description
      let profit = portfolioValue-totalCost
      let investmentPeriodMillies = new Date(endDate).getTime() - new Date(startDate).getTime()
      let investmentPeriodDays = investmentPeriodMillies / (1000 * 60 * 60 * 24)
      let roi = annualReturn(totalCost, portfolioValue, investmentPeriodDays)
      console.log(annualReturn(totalCost, portfolioValue, investmentPeriodDays).toFixed(2) + '%'); // 23.89%

      $("#description").html(`
        <div class="investment-container">
            <div class="investment-header">
                <span class="investment-symbol">Symbol: <b>${symbol}</b></span>
            </div>
            <div class="investment-details">
                <div class="investment-dates">
                    <span>Start Date: <b>${formatDate(startDate)}</b></span>
                    <span>End Date: <b>${formatDate(endDate)} </b></span>
                </div>
                <div class="investment-amounts">
                    <span>Amount: <b>${formatNumber(amount)}</b></span>
                    <span>Total Invested: <b>${formatNumber(totalCost)}</b></span>
                    <span>End Value: <b>${formatNumber(portfolioValue)}</b></span>
                    <span>Profit: <b>${formatNumber(portfolioValue-totalCost)}</b></span>
                </div>
                <div class="investment-roi">
                    <span>ROI: <b>${annualReturn(totalCost, portfolioValue, investmentPeriodDays).toFixed(2) + '%'}</b></span>
                </div>
                <div class="investment-summary">
                  <p>If you started investing <span class="amount">${formatNumber(amount)}</span> each week from <span class="start-date">${formatDate(startDate)}</span> until <span class="end-date">${formatDate(endDate)}</span> of <span class="symbol">${symbol}</span>,</p>
                  <p>then you would have invested a total amount of <span class="total-cost">${formatNumber(totalCost)}</span></p>
                  <p>and at the end of the investment period, you would have been left with a portfolio value of <span class="portfolio-value">${formatNumber(portfolioValue)}</span>,</p>
                  <p> resulting in a profit of <span class="profit">${formatNumber(portfolioValue-totalCost)}</span> and a return on investment of <span class="roi">${annualReturn(totalCost, portfolioValue, investmentPeriodDays).toFixed(2) + '%'}</span>.</p>
                </div>
            </div>
        </div>
    `)
    })
  } else {
    $("#description").text('out of credits...')
  }
})