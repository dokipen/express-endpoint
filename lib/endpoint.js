var defaultMiddleware = require('./middleware')
  , catalog = require('./catalog')
  , _ = require('underscore')
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

  self.config = _.extend({}, {
    parameters: [],
    stylesheets: ['/endpoint/css/reset.css',
                    '/endpoint/css/style.css'],
    view: __dirname + '/../views/doc.jade',
    rules: {},
    middleware: {}
  }, options);

  if (!self.config.selectedMiddleware) {
    self.config.selectedMiddleware = [ 'render', 'params' ];

    Array.prototype.push.apply( self.config.selectedMiddleware
                              , _.keys(self.config.middleware) );
  }

  for (r in defaultRules) {
    self.config.rules[r] = defaultRules[r];
  }
  for (m in defaultMiddleware) {
    self.config.middleware[m] = defaultMiddleware[m];
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
    , selected = selected || self.config.selectedMiddleware;

  return selected.reduce(function(mw, name) {
    mw.push(proxy(self.config, self.config.middleware[name])());
    return mw
  }, []);
}

/**
 * Helper method to mount endpoint on an express app.
 *
 * @param {Object}
 * @param {Array}
 * @api public
 */

Endpoint.prototype.mount = function(app, methods, selected) {
  var self = this

  if (!methods) {
    methods = ['get'];
  }

  methods.forEach(function(method) {
    app[method](self.config.path, self.middleware(selected),
                self.config.handler);
  });
  return app;
}

Endpoint.static = defaultMiddleware.static;
Endpoint.errorHandler = defaultMiddleware.errorHandler;
Endpoint.catalog = catalog;

exports = module.exports = Endpoint
