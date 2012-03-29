var middleware = require('./middleware')
  , catalog = require('./catalog')
  , Hash = require('hashish')
  , defaultRules = require('./rules')
  , utils = require('./utils');

/**
 * Define an Endpoint object.
 *
 * @param {Object}
 * @return {Object}
 * @api public
 */

var Endpoint = function(options) {
  var self = this
    , rules = {}
    , r;

  self.config = Hash({
    parameters: [],
    stylesheets: ['/endpoint/css/reset.css',
                    '/endpoint/css/style.css'],
    view: __dirname + '/../views/doc.jade',
    rules: {},
  }).update(options || {}).end;

  for (r in defaultRules) {
    rules[r] = defaultRules[r];
  }

}

/**
 * Proxy endpoint middleware, automatically configuring and adding
 * any extraParameters from the middleware to the endpoint object.
 *
 * @param {Object}
 * @param {Function}
 * @return {Function}
 * @api private
 */

function proxy(config, handler) {
  return function() {
    utils.safeUpdate(config.parameters, handler.extraParameters);
    return handler(config);
  }
}

/**
 * Returns configured endpoint middleware. Pass an array of middleware names
 * to override the default of including everything.
 *
 * @param {Array}
 * @return {Array}
 * @api public
 */

Endpoint.prototype.middleware = function(selected) {
  var self = this
    , selected = selected || "render params".split(" ");

  return selected.reduce(function(mw, name) {
    mw.push(proxy(self.config, middleware[name])());
    return mw
  }, []);
}

/**
 * Helper method to mount endpoint on an express app.
 *
 * @param {Object}
 * @api public
 */

Endpoint.prototype.mount = function(app, middleware) {
  return app.get(this.config.path, this.middleware(), this.handler);
}

Endpoint.static = middleware.static;
Endpoint.errorHandler = middleware.errorHandler;
Endpoint.catalog = catalog;

exports = module.exports = Endpoint
