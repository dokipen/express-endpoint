var errorHandler = require('../lib/middleware/errorHandler')
  , should = require('should')
  , step = require('step');

describe('errorHandler', function() {
  var res
    , req
    , err
    , config
    , handler;

  function setup() {
    res = {};
    req = {endpointParams: {}};
    err = new Error('my error');
    config = {};
    handler = errorHandler(config);
  }

  it('should do stuff', function(done) {
    setup()
    req.endpointParams.callback = 'a'
    res.format = function(obj) {
      obj.should.not.eql(null);
      res.send = function(text) {
        text.should.not.eql(null);
        text.should.eql('{"errors":[{"message":"my error"}]}')
      }
      obj.json()
      res.send = function(text) {
        text.should.not.eql(null);
        text.should.eql('a({"errors":[{"message":"my error"}]})')
      }
      obj.js()
      done()
    };
    handler(err, req, res, function() {})
  });
});
