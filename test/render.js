var render = require('../lib/middleware/render')
  , should = require('should')
  , step = require('step')
  , libxmljs = require('libxmljs');

describe('render', function() {

  function setup() {
    var mock = {
        res: {},
        req: { endpointParams: {callback: 'c'} },
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

  it('should renderEdnpointData', function(done) {
    var mock = setup();

    mock.next = function() {
      mock.res.format = function(obj) {
        mock.res.send = function(text) {
          JSON.parse(text).should.eql({number: 1, letter: "a"});
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
      mock.res.renderEndpointData({letter: 'a', number: 1})
    }
    mock.handler(mock.req, mock.res, mock.next)
  });
});
