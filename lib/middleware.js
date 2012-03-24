/**
 * Middleware for endpoint
 */
var func_blacklist = require('./func_blacklist')
  , Hash = require('hashish')
  , default_rules = require('./rules')
  , step = require('step')
  , highlight = require('highlight').Highlight

/**
 * Parses arguments according to rules.
 */
function endpoint_params(opts) {
  var config = Hash(
    { rules: {}
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

  var normalized_param = function(req, name, def) {
    var val = req.param(name, def)
    if (typeof(val) == 'undefined') {
      val = []
    } else if (val.constructor.toString().indexOf('Array') == -1) {
      val = [val]
    }
    return val
  }


  var parse_params = function(req, parse_cb) {
    var params = {}

    step(
      function parse_params() {
        var self = this
        config.parameters.forEach(function(param_def) {
          function apply_rules(old_value, rules, cb) {
            if (rules.length > 0) {
              var rule = parse_rule(rules[0])

              try {
                var rule_fn = config.rules[rule.name](param_def.name, rule.arg)
                rule_fn(old_value, function(err, new_value) {
                  if (err) throw err
                  apply_rules(new_value, rules.slice(1), cb)
                })
              } catch(e) {
                e.parameter_name = param_def.name
                cb(null, [e, param_def.name, old_value])
              }
            } else {
              cb(null, [null, param_def.name, old_value])
            }
          }
          var normal_param = normalized_param(req, param_def.name)
          apply_rules(normal_param, param_def.rules, self.parallel())
        })
      },
      parse_cb
    )
  }

  return function(req, res, next) {
    try {
      parse_params(req, function(err) {
        if (err) {
          next(err)
        } else {
          req.endpoint_params = {}
          var errors = []
          ;[].slice.call(arguments, 1).forEach(function(param) {
            if (param[0]) {
              errors.push(param[0])
             } else {
              req.endpoint_params[param[1]] = param[2]
            }
          })
          if (errors.length > 0) {
            e = new Error()
            e.param_errors = errors
            next(e)
          } else {
            next()
          }
        }
      })
    } catch(e) {
      next(e)
    }
  }
}

/**
 * Handle errors by displaying doc with error messages.
 * Depends on params.
 *
 * TODO: Handle non-param errors
 */
function error_handler(opts) {
  var config = Hash(
    { rules: {}
    }
  ).update(opts || {}).end

  return function(err, req, res, next) {
    var errors = [err]

    res.statusCode = 400
    if (err.param_errors) {
      errors = err.param_errors
    }
    function format_html() {
      res.render(config.doc_view, {errors: errors, endpoints: [config], Hash: Hash})
    }
    function format() {
      res.send(errors.map(function(error) {
        return "Error on parameter ["+error.parameter_name+"]: "+error.message
      }).join("\n"))
    }
    res.format({ 'json': format
               , 'js': format
               , 'xml': format
               , 'html': format_html
               })
  }
}

function render_middleware(opts) {

  var config = Hash(
    { stylesheet: '/static/endpoint/css/style.css'
    , template: '<html><head><link rel="stylesheet" href="${STYLESHEET}" '+
                'media="screen"></head>' +
                '<body><div id="response"><pre>${PAYLOAD}'+
                '</pre></div></body></html>'
    }
  ).update(opts || {}).end

  return function(req, res, next) {
    res.render_endpoint_data = function(data) {
      callback = req.endpoint_params.callback
      res.format({
        'json': function() {
          if (callback) {
            res.send(callback+"("+JSON.stringify(data)+")")
          } else {
            res.send(JSON.stringify(data))
          }
        }
      , 'js': function() {
          if (callback) {
            res.send(callback+"("+JSON.stringify(data)+")")
          } else {
            res.send(JSON.stringify(data))
          }
        }
      , 'xml': function() { res.send(json2xml.toXml('response', data)) }
      , 'html': function() {
          var payload

          if (callback) {
            payload = highlight(
                callback+"("+JSON.stringify(data, null, 2)+")")
          } else {
            payload = highlight(JSON.stringify(data, null, 2))
          }

          res.send(config.template.replace('${STYLESHEET}', config.stylesheet).replace('${PAYLOAD}', payload))
        }
      })
    }
    next()
  }
}

exports = module.exports =
  { render: render_middleware
  , params:  endpoint_params
  , errorHandler: error_handler
  }
