var parse = require('urlparse.js').parse

exports = module.exports =
  { pretty_url: function(url) {
      var url_obj = parse(url)
      var pretty_url = '<pre>'+url+'</pre>'
      pretty_url = pretty_url.replace("?", "\n    ?").replace(/&/g, "\n    &")
      return pretty_url; } }

