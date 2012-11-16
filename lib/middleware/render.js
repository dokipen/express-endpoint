/**
 * Middleware that adds renderEndpointData function to the response object.
 */

/**
 * Module dependencies.
 */

var Hash = require('hashish')
  , highlight = require('highlight').Highlight
  , json2xml = require('json2xml');

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

var render = function(options) {
  var config = Hash({
    stylesheets: ['/endpoint/css/reset.css',
                    '/endpoint/css/style.css'],
    render_view: __dirname + '/../../views/response.jade' }).
      update(options || {}).end;

  return function(req, res, next) {
    res.endpoint = res.endpoint || {}
    req.endpoint = req.endpoint || {}

    res.endpoint.render = function(data) {
      var callback = req.endpoint.params && req.endpoint.params.callback;

      res.charset = 'utf-8'
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
      , 'html': function() {
          var payload;

          if (callback) {
            payload = highlight(
                callback+"("+JSON.stringify(data, null, 2)+")");
          } else {
            payload = highlight(JSON.stringify(data, null, 2));
          }

          res.render(config.render_view, { data: payload, config: config })
        }
      , 'xml': function() {
          res.send('<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+
                json2xml.toXml('response', data)); }
      });
    }
    next();
  }
}

render.extraParameters = [{
  name: 'callback',
  rules: ['callback'],
  description: 'JSONP Callback.'}];

exports = module.exports = render;
