var Hash = require('hashish')
  , express = require('express')
  , default_rules = require('./rules')

// global registry
var ENDPOINTS = []

exports = module.exports = function(opts) {

  var config = Hash(
    { rules: {}
    , handler: function() {}
    , doc_view: 'doc.jade'
    , doc_on_error: true
    }
  ).update(opts || {}).end

  var rules = {}
  for (var r in default_rules) {
    rules[r] = default_rules[r]
  }
  config.rules = Hash(rules).update(config.rules).end

  var parse_rule = function(rule_str) {
    var regex = /^([^(]+)(\((.*)\))?$/
      , rule_group = regex.exec(rule_str).slice(1)

    return (
      { name: rule_group.shift()
      , arg: rule_group[1]
      }
    )
  }

  // verify that rules exist
  config.parameters.forEach(function verify(param_def) {
    param_def.rules.forEach(function rule(rule_str) {
      var rule = parse_rule(rule_str)

      if (!config.rules[rule.name]) {
        throw "Rule [" + rule.name + "] does not exist"
      }
    })
  })

  config.app.set('views', __dirname + '/../views')
  config.app.use('/static/endpoint/', express.static(__dirname + '/../public'))

  var normalized_param = function(req, name, def) {
    var val = req.param(name, def)
    if (typeof(val) == 'undefined') {
      val = []
    } else if (val.constructor.toString().indexOf('Array') == -1) {
      val = [val]
    }
    return val
  }


  var parse_params = function(req) {
    var parsed = {}

    config.parameters.forEach(function parse_param(param_def) {
      var normal_param = normalized_param(req, param_def.name)
      parsed[param_def.name] = normal_param
      param_def.rules.forEach(function(rule_str) {
        var rule = parse_rule(rule_str)

        try {
          var rule_fn = config.rules[rule.name](param_def.name, rule.arg)
          var nvals = rule_fn(parsed[param_def.name], normal_param)
          //console.log(rule_name + " changing", parsed[param_def.name], " to ", nvals)
          parsed[param_def.name] = nvals
        } catch(e) {
          e.parameter_name = param_def.name
          throw e
        }
      })
    })
    return parsed
  }

  config.app.get(config.path, function(req, res, next) {
    try {
      req.endpoint_params = parse_params(req)
      return config.handler(req, res, next)
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
