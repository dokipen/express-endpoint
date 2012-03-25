/**
 * Middleware that adds renderEndpointData function to the response object.
 */

/**
 * Module dependencies.
 */

var Hash = require('hashish')
  , highlight = require('highlight').Highlight;

/**
 * Adds renderEndpointData to resposne object.
 *
 * Options:
 *
 *  - `stylesheet` Url to css for html output. (optional)
 *  - `view`       Template for html output. (optional)
 *
 *  @param {Object} options
 *  @return {Function}
 *  @api public
 */

exports = module.exports = function(options) {
  var config = Hash({
    stylesheets: ['/endpoint/css/reset.css',
                    '/endpoint/css/style.css'],
    view: __dirname + '/../../views/response.jade' }).update(options || {}).end;

  return function(req, res, next) {

    if (!req.endpointRules) {
      req.endpointExtraParameters = []
    }

    req.endpointExtraParameters.push({
      name: 'callback',
      rules: ['callback'],
      description: 'JSONP Callback.'})

    res.renderEndpointData = function(data) {
      var callback = req.endpointParams.callback;

      res.format({
        'json': function() {
          res.send(JSON.stringify(data));
        }
      , 'js': function() {
          if (callback) {
            res.send(callback+"("+JSON.stringify(data)+")");
          } else {
            res.send(JSON.stringify(data));
          }
        }
      , 'xml': function() { res.send(json2xml.toXml('response', data)); }
      , 'html': function() {
          var payload;

          if (callback) {
            payload = highlight(
                callback+"("+JSON.stringify(data, null, 2)+")");
          } else {
            payload = highlight(JSON.stringify(data, null, 2));
          }

          res.render(config.view, {config: config, data: payload})
        }
      });
    }
    next();
  }
}
