/**
 * Middleware for endpoint
 */
var func_blacklist = require('./func_blacklist')
  , Hash = require('hashish')
  , default_rules = require('./rules')
  , step = require('step')

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
              //console.log('applying rule ' + rules[0] + ' to param ' + param_def.name)

              try {
                var rule_fn = config.rules[rule.name](param_def.name, rule.arg)
                rule_fn(old_value, function(err, new_value) {
                  //console.log(rules[0] + " changing", old_value, " to ", new_value)
                  if (err) throw err
                  apply_rules(new_value, rules.slice(1), cb)
                })
              } catch(e) {
                e.parameter_name = param_def.name
                cb(e)
              }
            } else {
              cb(null, [param_def.name, old_value])
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
          ;[].slice.call(arguments, 1).forEach(function(pair) {
            req.endpoint_params[pair[0]] = pair[1]
          })
          console.log(req.endpoint_params)
          next()
        }
      })
    } catch(e) {
      next(e)
    }
  }
}

function jsonp_middleware() {
  return function(req, res, next) {
    if (req.endpoint_params.callback) {
      res.header('Content-Type', 'application/javascript')
      res.send(req.endpoint_params.callback+"(")
      next()
      res.send(')')
    }
  }
}

exports = module.exports =
  { jsonp: jsonp_middleware
  , params:  endpoint_params
  }
