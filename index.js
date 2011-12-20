/**
 * Mirage - A simple ssl image proxy in node.
 */
var Hash = require('hashish')
  , urlparse = require('urlparse.js').parse
  , fs = require('fs')
  , connect = require('connect')
  , path = require('path')

var DEFAULT_VALIDATION_RULES =
  { number: function(name) {
      return function(vals) {
        rvals = []
        vals.forEach(function(val) {
          if (val.match(/[^0-9]/)) {
            throw "Invalid number '"+val+"'"
          } else {
            rvals.push(Number(val))
          } 
        })
        return rvals
      }
    }
  , bool: function(name) {
      return function(vals) {
        if (vals.length > 1) {
          throw "the boolean parameter only excepts one value"
        }
        var val = vals.length == 1 ? vals[0] : null
          , rval = [false]

        if (val == true ||
                   val == '1' ||
                   val == '' ||
                   val == 1 ||
                   String(val).toLowerCase() == 'true') {
          return [true]
        } else {
          return [false]
        }
      }
    }
  , regex: function(name, param) {
      var regex = new RegExp(param)

      return function(vals) {
        var rvals = []
        vals.forEach(function(val) {
          var new_val = null

          if (val && val.match(regex)) {
            new_val = val
          } else {
            throw "'"+val+"' doesn't match the regex '"+regex+"'"
          }
          rvals.push(new_val)
        })
        return rvals
      }
    }
  , required: function(name) {
      return function(vals) {
        if (vals.filter(function(i) {return i != ''}).length == 0) { 
          throw "Required parameter is not defined"
        } else {
          return vals
        }
      }
    }
  , url: function(name) {
      var rvals = []
      return function(vals) {
        vals.forEach(function(val) {
          var purl = urlparse(val)

          if (purl && purl.hostname) {
            rvals.push(purl.href)
          } else {
            throw "'"+val+"' isn't a valid URL"
          }
        })
        return rvals
      }
    }
  , max: function(name, param) {
      var occurances = Number(param)

      return function(vals) {
        if (vals.length > occurances) {
          throw "The parameter can only be specified "+occurances+" time(s)"
        } else {
          return vals
        }
      }
    }
  , 'default': function(name, param) {
      return function(vals) {
        if (vals.length == 0) {
          return [param]
        } else {
          return vals
        }
      }
    }
  }

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
  for (var r in DEFAULT_VALIDATION_RULES) {
    rules[r] = DEFAULT_VALIDATION_RULES[r]
  }
  config.rules = Hash(rules).update(config.rules).end

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
      , regex = /^([^(]+)(\((.*)\))?$/

    config.parameters.forEach(function parse_param(param_def) {
      var normal_param = normalized_param(req, param_def.name)
      parsed[param_def.name] = normal_param
      param_def.rules.forEach(function(rule) {
        var rule_group = regex.exec(rule).slice(1)
          , rule_name = rule_group.shift()
          , rule_args = [param_def.name, rule_group[1]]

        try {
          var rule = config.rules[rule_name].apply(null, rule_args)
          var nvals = rule(parsed[param_def.name], normal_param)
          //console.log(rule_name + " changing", parsed[param_def.name], " to ", nvals)
          parsed[param_def.name] = nvals
        } catch(e) {
          if (e.stack) { console.log(e.stack) }
          throw "Error on parameter '"+param_def.name+"': "+e
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
      if (e.stack) {
        console.error(e.stack)
      } else {
        console.error(e)
      }
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
    console.log(ENDPOINTS)
    res.render(config.doc_view, {errors: [], endpoints: ENDPOINTS, Hash: Hash})
  })
}
