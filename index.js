var Hash = require('hashish')
  , urlparse = require('urlparse.js').parse
  , fs = require('fs')
  , path = require('path')
  , express = require('express')
  , default_rules = require('./lib/rules')

// global registry
var ENDPOINTS = []

/**
 * endpoint - parse, validate and molest endpoint parameters. Parameters can be
 * query string, path params or body params. We use req.param() internally. All
 * parameters will be set in req.endpoint_params and they will all be arrays.
 * This allows for repeat values.
 *
 * endpoints are described declaritively, allowing the middleware to generate
 * meaningful documenation and error messages when invalid calls are made.
 *
 * If the params are invalid, then an error and documentation will be printed.
 *
 * Some standard rules are described about and include:
 *
 *   required  - ensure parameter is specified
 *   url       - ensure valid url
 *   number    - convert to number
 *   regex     - match against regex
 *   bool      - convert to boolean ('1', '', or 'true' is true)
 *   max       - max occurances of parameter
 *   default   - default value if none is specified. should be called first
 *
 * Custom rules can be added. A rule is a function that takes the parameter
 * name and returns a filter for the parameter. The filter will be passed an
 * array of values, and the original values before validation began. If the
 * parameter values are invalid, then an exception should be thrown describing
 * the error in detail.
 *
 * The module should be passed an object describing the endpoint as follows:
 *
 * { path: '/my/endpoint'
 * , doc_path: '/docs/my/endpoint'
 * , doc_on_error: true
 * , description: '...'
 * , example: '/my/endpoint?firstname=bob&lastname=corsaro&age=34'
 * , parameters:
 *   [ { name: 'firstname'
 *     , rules: ['regex(^[^0-9_]+$)', 'required', 'max(1)']
 *     , description: 'The first name."
 *     }
 *   , { name: 'lastname'
 *     , rules: ['regex(^[^0-9_]+$)', 'required', 'max(1)']
 *     , description: 'The last name."
 *     }
 *   , { name: 'age'
 *     , rules: ['number', 'required', 'gte18', 'max(1)']
 *     , description: 'The age. Must be at least 18."
 *     }
 *   , { name: 'favorite-color'
 *     , rules: ['default(blue)', 'regex(^(blue|red|yellow|black|white|green)$)', 'max(1)']
 *     , descripton: 'Your favorite color'
 *     }
 *   ]
 * , rules:
 *   { gte18: function(name) {
 *       return function(val) {
 *         if (val < 18) {
 *           throw name+" must be at least 18"
 *         } else {
 *           return val
 *         }
 *       }
 *     }
 *   }
 * }
 */
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

  config.app.set('views', __dirname + '/views')
  config.app.use('/static/endpoint/', express.static(__dirname + '/public'))

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

exports.catalog = function(opts) {
  var config = Hash(
    { doc_view: 'doc.jade'
    , path: '/docs'
    }
  ).update(opts||{}).end

  config.app.get(config.path, function(req, res, next) {
    res.render(config.doc_view, {errors: [], endpoints: ENDPOINTS, Hash: Hash})
  })
}
