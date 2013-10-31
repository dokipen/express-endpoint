var _ = require('underscore')
  , endpoints = require('./endpoint').endpoints
  , urlparse = require('urlparse.js').parse

exports = module.exports = function(options) {
  var config = _.extend({}, {
    view: __dirname + '/../views/doc.jade',
    stylesheets: ['/endpoint/css/reset.css',
                  '/endpoint/css/style.css'],
    endpoints: [] }, options);

  return function(req, res) {
    res.render(config.view, {
      config: config,
      errors: [],
      endpoints: config.endpoints.map(function(i) {
        var config = i.config;
        if (config.example) {
          config.exampleUrl = urlparse(config.example, true);
        }
        return config;
      })
    });
  }
}
