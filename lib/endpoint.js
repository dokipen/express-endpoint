var Hash = require('hashish')
  , express = require('express')
  , default_rules = require('./rules')
  , middleware = require('./middleware')

// global registry
var ENDPOINTS = []

exports = module.exports = function(opts) {

  var config = Hash(
    { rules: {}
    , handler: function() {}
    , doc_view: 'doc.jade'
    , doc_on_error: true
    , aliases: []
    }
  ).update(opts || {}).end

  config.app.set('view engine', 'jade')
  config.app.set('views', __dirname + '/../views')
  config.app.use('/static/endpoint/', express.static(__dirname + '/../public'))

  config.app.use(config.path, middleware.params(config))
  config.app.use(config.path, middleware.render(config))
  if (config.doc_on_error) {
    config.app.use(config.path, middleware.errorHandler(config))
  }

  config.app.get(config.path, config.handler)
  config.aliases.forEach(function(alias) {
    config.app.use(config.path, middleware.params(config))
    if (config.doc_on_error) {
      config.app.use(config.path, error_handler)
    }
    config.app.get(alias, config.handler)
  })

  if (config.doc_path) {
    config.app.get(config.doc_path, function(req, res, next) {
      res.render(config.doc_view, {errors: [], endpoints: [config], Hash: Hash})
    })
  }

  ENDPOINTS.push(config)
  return config.app
}

exports.endpoints = module.exports.endpoints = ENDPOINTS
