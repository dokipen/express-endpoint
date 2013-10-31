/**
 * Parameter parsing middleware for endpoint.
 */
var _ = require('underscore')
  , defaultRules = require('../rules')
  , step = require('step');

/**
 * Parses arguments according to rules.
 *
 *  - `parameters` Defined parameters by rules
 *  - `rules`      Custom rules
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
exports = module.exports = function(options) {
  var config = _.extend({}, {
    rules: {},
    parameters: []
  }, options);

  function parseRule(ruleStr) {
    var regex = /^([^(]+)(\((.*)\))?$/
      , ruleGroup = regex.exec(ruleStr).slice(1);

    return ({
      name: ruleGroup.shift(),
      arg: ruleGroup[1] });
  }

  // verify that rules exist
  config.parameters.forEach(function(paramDef) {
    paramDef.rules.forEach(function(ruleStr) {
      var rule = parseRule(ruleStr);

      if (!config.rules[rule.name]) {
        throw Error("Rule [" + rule.name + "] does not exist");
      }
    })
  })

  function normalizedParam(req, name, def) {
    var val = req.param(name, def);

    if ('undefined' == typeof(val)) {
      val = [];
    } else if (val.constructor.toString().indexOf('Array') == -1) {
      val = [val];
    }

    return val;
  }


  function parseParams(req, parseCb) {
    var rule
      , ruleFn
      , normalParam;

    step(
      function parseParams() {
        var self = this;

        config.parameters.forEach(function(paramDef) {
          function applyRules(oldValue, rules, cb) {
            if (rules.length > 0) {
              rule = parseRule(rules[0]);

              ruleFn = config.rules[rule.name](paramDef.name, rule.arg, req);
              ruleFn(oldValue, function(err, newValue) {
                if (err) {
                  err.parameterName = paramDef.name;
                  cb(null, [err, paramDef.name, oldValue]);
                } else {
                  applyRules(newValue, rules.slice(1), cb);
                }
              });
            } else {
              cb(null, [null, paramDef.name, oldValue]);
            }
          }
          normalParam = normalizedParam(req, paramDef.name);
          applyRules(normalParam, paramDef.rules, self.parallel());
        })
      },
      parseCb
    )
  }

  return function(req, res, next) {
    req.endpoint = req.endpoint || {}
    req.endpoint.config = config;

    parseParams(req, function(err) {
      var errors = []
        , error;

      if (err) {
        next(err);
      } else {
        req.endpoint.params = {};
        ;[].slice.call(arguments, 1).forEach(function(param) {
          if (param[0]) {
            errors.push(param[0]);
           } else {
            req.endpoint.params[param[1]] = param[2];
          }
        })
        if (errors.length > 0) {
          error = new Error('Error parsing parameters');
          error.paramErrors = errors;
          next(error);
        } else {
          next();
        }
      }
    })
  }
}
