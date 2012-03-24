var Hash = require('hashish')
  , endpoints = require('./endpoint').endpoints

exports = module.exports = function(opts) {
  var config = Hash(
    { doc_view: 'doc.jade'
    , path: '/docs'
    }
  ).update(opts||{}).end

  config.app.get(config.path, function(req, res, next) {
    res.render(config.doc_view, {layout: 'layout', errors: [], endpoints: endpoints, Hash: Hash})
  })
}
