var rules = require('../lib/rules')
  , should = require('should')
  , utils = require('../lib/utils');

describe('utils', function() {
  describe('resolveParameters(params, extraParams)', function() {
    it('should combine none matching params and extras', function() {
      var params
        , extraParams;

      params = [{
        name: 'a',
        value: 'params'
      },{
        name: 'b',
        value: 'params'
      }];

      extraParams = [{
        name: 'c',
        value: 'extras'
      }];


      params = utils.resolveParameters(params, extraParams);
      params.length.should.eql(3);
    })
    it('should override extras with matching params', function() {
      var params
        , extraParams;

      params = [{
        name: 'a',
        value: 'params'
      },{
        name: 'b',
        value: 'params'
      }];

      extraParams = [{
        name: 'b',
        value: 'extras'
      }];


      params = utils.resolveParameters(params, extraParams);
      params.length.should.eql(2);
      params.filter(function(i){return i.value == 'extras'}).should.eql([]);
    })
  })
})
