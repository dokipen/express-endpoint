
/*
 * Error handling middleware for endpoint. Will display HTML documentation
 * if the client accepts it. Formats errors for other content types.
 */

// TODO: Handle non-param errors better.

/**
 * Module dependencies.
 */

var Hash = require('hashish')
  , json2xml = require('json2xml')
  , urlparse = require('urlparse.js').parse
  , sprintf = require('util').format;


/**
 * Handle errors by displaying doc with error messages.
 * Depends on params.
 *
 * Options:
 *
 *  - `rules` rules passed to params middleware.
 *  - `view`  path to template. (optional)
 *  - `css`   url of css. (optional)
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

exports = module.exports = function(options) {
  var config = Hash({
    rules: {},
    stylesheets: ['/endpoint/css/reset.css',
                    '/endpoint/css/style.css'],
    view: __dirname + '/../../views/doc.jade'}).update(options || {}).end;

  return function(err, req, res, next) {
    req.endpoint = req.endpoint || {}

    var errors
      , callback = req.endpoint.params ? req.endpoint.params.callback : undefined;

    if (err.paramErrors) {
      res.statusCode = 400;
      errors = err.paramErrors;
    } else {
      throw err;
    }

    function formatHtml() {
      if (req.endpoint.config.example) {
        var exampleUrl = urlparse(req.endpoint.config.example, true);
        exampleUrl.query = exampleUrl.query || {};
        req.endpoint.config.exampleUrl = exampleUrl;
      }
      res.render(config.view,
        { errors: errors,
          config: config,
          // change when path specific error handlers are allowed.
          endpoints: [req.endpoint.config],
          Hash: Hash });
    }

    function errorsData(errors) {
      var obj;

      var errorMessage = errors.map(function(error) {
        if (error.parameterName) {
          return sprintf("%s: %s", error.parameterName, error.message);
        } else {
          return error.message;
        }
      }).join(', ');

      return {
        error: 1,
        errors: errors.map(function(error) {
          obj = {message: error.message}
          if (error.parameterName) {
            obj['parameterName'] = error.parameterName;
          }
          return obj;
        }),
        error_message: errorMessage
      };
    }

    res.format({
      'json': function() {res.send(JSON.stringify(errorsData(errors)))},
      'js': function() {res.send(callback+"("+JSON.stringify(errorsData(errors))+")")},
      'xml': function() {res.send(json2xml({failure: errorsData(errors)}))},
      'html': formatHtml });
  }
}
