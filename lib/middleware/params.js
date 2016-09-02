/**
 * Parameter parsing middleware for endpoint.
 */
var defaultRules = require('../rules')
  , debug = require('debug')('express-endpoint:middleware:params')
  , Promise = require('bluebird')
  , _ = require('lodash');

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
  var config = _.merge({
    rules: {},
    parameters: []
  }, options)

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

  function readReq(req, dict, name) {
    try {
      return req[dict][name];
    } catch(e) {
      return undefined;
    }
  }

  function normalizedParam(req, name, def) {
    var val = _([readReq(req, 'params', name) ||
                 readReq(req, 'body', name) ||
                 readReq(req, 'query', name) ||
                 def])
            .filter()
            .flatten(function(v) { return typeof(v) != 'undefined' })
            .value();
    debug('val: %j', val);
    return val;
  }


  function parseParams(req) {
    var rule
      , ruleFn
      , parallel = []
      , normalParam;

    debug("config: %j", config);

    config.parameters.forEach(function(paramDef) {
      debug("paramDef: %j", paramDef);
      function applyRules(oldValue, rules, cb) {
        debug("running rules: %j", rules);
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
      parallel.push(Promise.promisify(applyRules)(normalParam, paramDef.rules));
    })
    return Promise.all(parallel);
  }

  return function(req, res, next) {
    req.endpoint = req.endpoint || {}
    req.endpoint.config = config;

    parseParams(req)
      .then(function(results) {
        var errors = []
          , error;

        debug('arguments: %j', results);

        req.endpoint.params = {};
        results.forEach(function(param) {
          debug('param: %j', param);
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

      })
    .catch(function(err) {
      next(err);
    })
    .done();
  }
}
