var catalog = require('../lib/catalog.js')
  , should = require('should')
  , libxmljs = require('libxmljs');

describe('render', function() {

  function setup() {
    var mock = {
        res: {},
        req: { endpointParams: {callback: 'c'} },
        config: {
          endpoints: [{config: {name: 'a'}}, {config: {name: 'b'}}]
        }
    }
    mock.handler = catalog(mock.config)
    return mock
  }

  it('should render catalog of endpoints', function(done) {
    var mock = setup();

    mock.res.render = function(view, payload) {
      view.should.match(/doc.jade/);
      payload.errors.length.should.eql(0);
      payload.endpoints.length.should.eql(2);
      payload.endpoints[0].should.eql({name: 'a'});
      payload.endpoints[1].should.eql({name: 'b'});
      payload.config.should.have.property('stylesheets');
      payload.config.should.have.property('view');
      payload.config.should.have.property('endpoints', mock.config.endpoints);
      done();
    }
    mock.handler(mock.req, mock.res)
  });
});
