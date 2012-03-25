var parse = require('urlparse.js').parse;

exports = module.exports =
  { pretty_url: function(url) {
      var urlObj = parse(url)
      var prettyUrl = '<pre>'+url+'</pre>'
      pretty_url = prettyUrl.replace("?", "\n    ?").replace(/&/g, "\n    &")
      return pretty_url; } };

