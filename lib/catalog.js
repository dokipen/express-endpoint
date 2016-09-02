var endpoints = require('./endpoint').endpoints
  , urlparse = require('urlparse.js').parse
  , _ = require('lodash')
  , debug = require('debug')('express-endpoint:catalog')

exports = module.exports = function(options) {
  var config = _.merge(
      { view: __dirname + '/../views/doc.pug'
      , stylesheets:
        [ '/endpoint/css/reset.css'
        , '/endpoint/css/style.css']
      , endpoints: [] }
    , options||{} )

  return function(req, res) {
    debug(config.endpoints)
    res.render(config.view,
     { config: config
     , errors: []
     , endpoints: config.endpoints.map(function(i) {
        var config = i.config
        if (config.example) {
          config.exampleUrl = urlparse(config.example, true)
        }
        return config } ) } ) } }
