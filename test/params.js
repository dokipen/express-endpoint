var params = require('../lib/middleware/params')
  , should = require('should')
  , step = require('step')
  , libxmljs = require('libxmljs')
  , rules = require('../lib/rules');

describe('params middleware', function() {

  function setup() {
    var mock = {
        res: {},
        req: {
            endpoint: {
              params: {},
              config: {}
            },
            param: function() {
                return 'a';
            }
        },
        err: new Error('my error'),
        config: {
          parameters: [ {
            name: 'letter',
            rules: ['regex(^[a-zA-Z]$)', 'required', 'once']
          } ],
          rules: rules
        },
        next: function() {}
    }
    mock.handler = params(mock.config)
    return mock
  }

  it('should parse parameters', function(done) {
    var mock = setup();

    mock.next = function() {
      mock.req.endpoint.params.letter.should.eql('a');
      done();
    };

    mock.handler(mock.req, mock.res, mock.next)
  });

  it('should throw an error on undefined rules', function(done) {
    var mock = setup();
    mock.config.parameters.push({ name: 'blah', rules: ['fakerule'] });

    (function() {
      params(mock.config);
    }).should.throw(/does not exist/);

    done();
  });

  it('should throw an error on rule failure', function(done) {
    var mock = setup();
    mock.req.param = function(n, d) { return d; }

    mock.next = function(err) {
      should.exist(err);
      should.exist(err.paramErrors);
      err.paramErrors.length.should.eql(1);
      err.message.should.eql("Error parsing parameters");
      err.paramErrors[0].message.should.eql("The parameter is required");
      err.paramErrors[0].parameterName.should.eql("letter");
      done();
    };

    mock.handler(mock.req, mock.res, mock.next);
  });

  it('should throw have multiple errors on multiple rule failures', function(done) {
    var mock = setup();
    mock.config.parameters.push({name: 'number', rules: ['number', 'once']})
    mock.req.param = function(n, d) { var params = {letter: d, number: 'a'}; return params[n]; }

    mock.next = function(err) {
      should.exist(err);
      should.exist(err.paramErrors);
      err.paramErrors.length.should.eql(2);
      err.message.should.eql("Error parsing parameters");
      err.paramErrors[0].message.should.eql("The parameter is required");
      err.paramErrors[0].parameterName.should.eql("letter");
      err.paramErrors[1].message.should.eql("Invalid number [a]");
      err.paramErrors[1].parameterName.should.eql("number");
      done();
    };

    mock.handler(mock.req, mock.res, mock.next);
  });
});
