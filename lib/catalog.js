var Hash = require('hashish')
  , endpoints = require('./endpoint').endpoints

exports = module.exports = function(options) {
  var config = Hash({
    view: __dirname + '/../views/doc.jade',
    stylesheets: ['/endpoint/css/reset.css',
                  '/endpoint/css/style.css'],
    endpoints: [] }).update(options||{}).end;

  return function(req, res) {
    res.render(config.view, {
      config: config,
      errors: [],
      endpoints: config.endpoints.map(function(i) {return i.config}),
      Hash: Hash});
  }
}
