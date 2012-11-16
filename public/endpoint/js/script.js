jQuery(document).ready(function($) {
  $('.tryItButton').click(function() {
    var query = $(this).parent().find('input[type!=button]').filter(function() {
      return $(this).val() != '';
    }).map(function() {
      console.log($(this).val().split(','));

      var vals = $.map($(this).val().split(','), function(v) {
        return encodeURIComponent(v);
      }).join(',');

      return $(this).attr('name')+'='+vals;
    }).toArray().join('&');
    var endpoint = $(this).closest('div.endpoint').find('p.pathname').text();
    document.location.href = 'http://localhost:3000'+endpoint+'?'+query;
  });

  $('input.required').each(function() {
    $(this).attr('placeholder', '(required)');
  });

  $.each(URI(document.location.href).query(true), function(k,v) {
    $('input[name='+k+']').val(decodeURIComponent(v));
  });
});
