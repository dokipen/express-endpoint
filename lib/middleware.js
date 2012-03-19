/**
 * Middleware for endpoint
 */
var func_blacklist = require('./func_blacklist')
  , Hash = require('hashish')
  , default_rules = require('./rules')
  , step = require('step')
  , highlight = require('highlight').Highlight

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
        console.log(arguments)
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

function error_handler(opts) {
  var config = Hash(
    { rules: {}
    }
  ).update(opts || {}).end

  return function(err, req, res, next) {
    res.statusCode = 400
    var errors = [err]
    if (err.param_errors) {
      errors = err.param_errors
    }
    if (req.accepts('text/html')) {
      res.render(config.doc_view, {errors: errors, endpoints: [config], Hash: Hash})
    } else {
      res.send(errors.map(function(error) {
        return "Error on parameter ["+error.parameter_name+"]: "+error.message
      }).join("\n"))
    }
  }
}

function render_middleware(opts) {

  var config = Hash(
    { stylesheet: '/static/endpoint/css/style.css'
    }
  ).update(opts || {}).end

  return function(req, res, next) {
    res.render_endpoint_data = function(data) {
      function stringify() {
        if (!req.accepts('text/javascript') && !req.accepts('application/javascript') && req.accepts('text/html')) {
          return JSON.stringify(data, null, 2)
        } else {
          return JSON.stringify(data)
        }
      }

      function render(str, content_type) {

        if (   !req.accepts('text/javascript')
            && !req.accepts('application/javascript')
            &&  req.accepts('text/html')) {

          res.header('Content-Type', 'text/html')
          res.send('<html><head><link rel="stylesheet" type="text/css" ' +
                   'href="'+config.stylesheet+'" media="screen"></head>' +
                   '<body><div id="response"><pre>'+highlight(str)+
                   '</pre></div></body></html>')
        } else {
          console.log('rendering '+str)
          res.header('Content-Type', content_type)
          res.send(str)
        }
      }

      var data_str = ''
      var content_type = ''
      if (req.endpoint_params.callback) {
        content_type = 'application/javascript'
        data_str = req.endpoint_params.callback+"("+stringify()+")"
      } else {
        content_type = 'text/javascript'
        data_str = stringify()
      }

      render(data_str)
    }

    next()
  }
}

exports = module.exports =
  { render: render_middleware
  , params:  endpoint_params
  , errorHandler: error_handler
  }
