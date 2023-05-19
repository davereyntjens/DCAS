$(document).ready(function() {
  $('#cookie-popup').hide()

  setInterval(function() {
    // Check if the user has agreed to the terms
    if (document.cookie.indexOf('agreedToTerms=true') === -1) {
      // Show the modal
      $('#termsModal').modal('show')
    } else {
      if (document.cookie.indexOf('cookie-accepted=true') === -1) {
        $('#cookie-popup').show()
      }
    }
  }, 1000)


  // Set a cookie when the user agrees to the terms
  $('#agreeBtn').click(function() {
    document.cookie = 'agreedToTerms=true; expires=Fri, 31 Dec 9999 23:59:59 GMT'
  })

  $('#accept-cookie').click(function() {
    $('#cookie-popup').hide()
    document.cookie = 'cookie-accepted=true; path=/;'
  })

  // show the flash messages
  $('.toast').toast('show');
})