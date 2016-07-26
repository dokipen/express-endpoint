var render = require('../lib/middleware/render')
  , should = require('should')
  , libxmljs = require('libxmljs');

describe('render', function() {

  function setup() {
    var mock = {
        res: {},
        req: { endpoint: { params: {callback: 'c'} } },
        config: {}
    }
    mock.handler = render(mock.config)
    return mock
  }

  it('should have extra parameter callback', function(done) {
    render.extraParameters.should.eql(
      [{name: 'callback', rules: ['callback'], description: 'JSONP Callback.'}]);
    done();
  });

  it('should renderEndpointData', function(done) {
    var mock = setup();

    mock.next = function() {
      mock.res.format = function(obj) {
        mock.res.send = function(text) {
          text.should.eql('c({"letter":"a","number":1})');
          this.charset.should.eql("utf-8")
        }
        obj.json()

        mock.res.send = function(text) {
          text.should.eql('c({"letter":"a","number":1})');
          this.charset.should.eql("utf-8")
        }
        obj.js()

        mock.res.send = function(text) {
          var doc = libxmljs.parseXmlString(text);
          doc.get('//letter').text().should.eql('a');
          doc.get('//number').text().should.eql('1');
          this.charset.should.eql("utf-8")
        }
        obj.xml()

        mock.res.render = function(view, obj) {
          view.should.match(/response.jade$/);
          should.not.exist(obj.errors);
          obj.config.should.have.property('stylesheets');
          obj.config.should.have.property('render_view');
          this.charset.should.eql("utf-8")
        }
        obj.html()

        done()
      };
      mock.res.endpoint.render({letter: 'a', number: 1})
    }
    mock.handler(mock.req, mock.res, mock.next)
  });
});
