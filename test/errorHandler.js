var errorHandler = require('../lib/middleware/errorHandler')
  , should = require('should')
  , step = require('step')
  , libxmljs = require('libxmljs');

describe('errorHandler', function() {

  function setup() {
    var mock = {
        res: {},
        req: {endpointParams: {}, endpointConfig: {}},
        err: new Error('my error'),
        config: {},
        next: function() {}
    }
    mock.handler = errorHandler(mock.config)
    return mock
  }

  it('should format errors properly on parse errors', function(done) {
    var mock = setup();
    mock.err.paramErrors = [{parameterName: 'name', message: 'my error'}];

    mock.req.endpointParams.callback = 'a'
    mock.res.format = function(obj) {
      mock.res.send = function(text) {
        mock.res.statusCode.should.eql(400);
        JSON.parse(text).should.eql({"errors":[{"message":"my error", "parameterName":"name"}]});
      }
      obj.json()

      mock.res.send = function(text) {
        mock.res.statusCode.should.eql(400);
        text.should.eql('a({"errors":[{"message":"my error","parameterName":"name"}]})');
      }
      obj.js()

      mock.res.send = function(text) {
        mock.res.statusCode.should.eql(400);
        var doc = libxmljs.parseXmlString(text);
        doc.get('//message').text().should.eql('my error');
      }
      obj.xml()

      mock.res.render = function(view, obj) {
        mock.res.statusCode.should.eql(400);
        view.should.match(/doc.jade$/);
        obj.errors.length.should.eql(1);
        obj.errors[0].should.have.property('message', 'my error');
        obj.config.should.have.property('stylesheets');
        obj.config.should.have.property('view');
        obj.config.rules.should.eql({});
        obj.endpoints.should.eql([{}]);
        obj.Hash.should.not.eql(null);
      }
      obj.html()

      done()
    };
    mock.handler(mock.err, mock.req, mock.res, mock.next)
  });
});