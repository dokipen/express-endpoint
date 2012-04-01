var params = require('../lib/middleware/params')
  , should = require('should')
  , step = require('step')
  , libxmljs = require('libxmljs');

describe('params middleware', function() {

  function setup() {
    var mock = {
        res: {},
        req: {endpointParams: {}, endpointConfig: {}},
        err: new Error('my error'),
        config: {parameters: [
          { name: 'letter'
          , rules: ['regex(^[a-zA-Z]$)', 'required', 'once'] }
        ]},
        next: function() {}
    }
    mock.handler = params(mock.config)
    return mock
  }

  it('should parse parameters', function(done) {
    var mock = setup();

    mock.next = function() {
      //mock.req.endpointParams.letter.should.eql('a');
      done();
    };

    mock.handler(mock.req, mock.res, mock.next)
  });

  it('should throw an error on undefined rules', function(done) {
    var mock = setup();
    mock.config.parameters.push({ name: 'blah', rules: ['fakerule'] });

    mock.next = function(err) {
      err.should.not.eql(null);
      done();
    };

    mock.handler(mock.req, mock.res, mock.next)
  });
});
