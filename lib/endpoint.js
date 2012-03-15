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

  config.app.set('views', __dirname + '/../views')
  config.app.use('/static/endpoint/', express.static(__dirname + '/../public'))

  var error_handler = function(err, req, res, next) {
    if (err) {
      res.render(config.doc_view, {errors: [err], endpoints: [config], Hash: Hash})
    }
    try {
      req.endpoint_params = parse_params(req)
      next()
    } catch(e) {
      // optionally, display docs and error message
      if (config.doc_on_error) {
        res.render(config.doc_view, {errors: [e], endpoints: [config], Hash: Hash})
      } else {
        res.writeHead(400)
        res.write(e)
        res.end()
      }
    }
  }

  var mw = []
  mw.push(middleware.params(config))
  if (config.doc_on_error) {
    //mw.push(error_handler)
  }

  config.app.get(config.path, mw, config.handler)
  config.aliases.forEach(function(alias) {
    config.app.get(alias, mw, config.handler)
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
