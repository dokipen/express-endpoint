var rules = require('../lib/rules')
  , should = require('should')
  , step = require('step')
  , assert = require('assert')

describe('rules', function() {
  describe('callback', function() {
    var fn = rules.callback('callback')
    it('should fail on reserved words', function(done) {
      fn(['break'], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
    it('should fail on predefined variables', function(done) {
      fn(['undefined'], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
    it('should fail on event names', function(done) {
      fn(['onclick'], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
    it('should fail on multiple args', function(done) {
      fn(['zonclick', 'bob'], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
    it('should fail on illegal function names', function(done) {
      step(
        function() {
          var self = this
          ['@onclick', ''].forEach(function(name) {
            var p = self.parallel()
            fn([name], function(err, vals) {
              err.should.not.eql(null)
              p()
            })
          })
        }
      , function() {
          done()
        }
      )
    })
    it('should accept legal function names', function(done) {
      step(
        function() {
          var self = this
          ['zonclick', '$$', 'a9879385472945_234aASDFasdf'].forEach(function(name) {
            var p = self.parallel()
            fn([name], function(err, vals) {
              assert(err == null)
              vals.should.eql([name])
              p()
            })
          })
        }
      , function() {
          done()
        }
      )
    })
  })
  describe('number', function() {
    var fn = rules.number('number')
    it('should fail on non-numbers', function(done) {
      step(
        function() {
          var self = this
          'break 1a a1 1o1 - .4 10.'.split(' ').forEach(function(val) {
            var p = self.parallel()
            fn([val], function(err, vals) {
              err.should.not.eql(null)
              p()
            })
          })
          ['', null, undefined].forEach(function(val) {
            var p = self.parallel()
            fn([val], function(err, vals) {
              err.should.not.eql(null)
              p()
            })
          })
        }
      , function() {
          done()
        }
      )
    })
    it('should convert legal strings to numbers', function(done) {
      fn(['1', '12', '-234', '-24.234', '0.4'], function(err, vals) {
        assert(err == null)
        vals.should.eql([1, 12, -234, -24.234, 0.4])
        done()
      })
    })
  })
  describe('timestamp', function() {
    var fn = rules.timestamp('timestamp')
    it('should fail on invalid times', function(done) {
      fn(['lkasjdf'], function(err, vals) {
        err.should.not.equal(null)
        done()
      })
    })
    it('should parse valid timestamps', function(done) {
      var d = new Date()
        , str_ms = Number(d).toString()
        , str_s = (Number(d)/1000).toString()

      step(
        function() {
          var self = this
          [str_ms, str_s].forEach(function(val) {
            var p = self.parallel()
            fn([val], function(err, vals) {
              assert(err == null)
              vals.should.eql([d])
              p()
            })
          })
        }
      , function() {
          done()
        }
      )
    })
  })
  describe('boolean', function() {
    var fn = rules['boolean']('boolean')
    it("should convert '1' '' and 'true' to true", function(done) {
      step(
        function() {
          var self = this
          ['1', '', 'true'].forEach(function(val) {
            var p = self.parallel()
            fn([val], function(err, val) {
              assert(err == null)
              val.should.eql(true)
              p()
            })
          })
        }
      , function() { done() }
      )
    })
    it("should only accept one value", function(done) {
      fn(['1', '1'], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
    it("should convert other values to false", function(done) {
      step(
        function() {
          var self = this
          ['2', 'truer'].forEach(function(val) {
            var p = self.parallel()
            fn(val, function(err, val) {
              assert(err == null)
              val.should.eql(false)
              p()
            })
          })
        }
      , function() { done() }
      )
    })
  })
  describe('regex', function() {
    var fn = rules.regex('regex', 'a+')
    it("should accept matching params", function(done) {
      step(
        function() {
          var self = this
          ['a', 'aa', 'aaa'].forEach(function(val) {
            var p = self.parallel()
            fn([val], function(err, vals) {
              assert(err == null)
              vals.should.eql([val])
              p()
            })
          })
        }
      , function() { done() }
      )
    })
    it("should fail on non-matching params", function(done) {
      fn(['a', 'b', 'aa'], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
  })
  describe('url', function() {
    var fn = rules.url('url')
    it("should accept valid urls", function(done) {
      fn(
        [ 'www.google.com'
        , 'https://yahoo.com/a/b'
        , 'doki-pen.org/~doki_pen'
        ]
      , function(err, vals) {
          assert(err == null)
          vals.map(function(i) {return i.href}).should.eql(
            [ 'http://www.google.com/'
            , 'https://yahoo.com/a/b'
            , 'http://doki-pen.org/~doki_pen'
            ]
          )
          done()
        }
      )
    })
    it("should fail on non-valid urls", function(done) {
      fn(['::/:/', 'www.yahoo.com'], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
  })
  describe('required', function() {
    var fn = rules.required('required')
    it("should accept specified params", function(done) {
      fn([1], function(err, vals) {
        assert(err == null)
        vals.should.eql([1])
        done()
      })
    })
    it("should fail if param is empty", function(done) {
      fn([], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
  })
  describe('max', function() {
    it("should accept up to max params", function(done) {
      var fn = rules.max('max', 3)
      step(
        function() {
          var self = this
          [[1,2,3], [1,2], [1], []].forEach(function(input) {
            var p = self.parallel()
            fn(input, function(err, vals) {
              assert(err == null)
              vals.should.eql(input)
              p()
            })
          })
        }
      , function() {done()}
      )
    })
    it("should fail if param is specified more then max times", function(done) {
      var fn = rules.max('max', 3)
      fn([1,2,3,4], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
  })
  describe('once', function() {
    var fn = rules.once('once')
    it("should accept specified param", function(done) {
      fn(['1'], function(err, vals) {
        assert(err == null)
        vals.should.eql('1')
        done()
      })
    })
    it("should fail if param is specified more then once", function(done) {
      fn(['1', '2'], function(err, vals) {
        err.should.not.eql(null)
        done()
      })
    })
  })
  describe('default', function() {
    var fn = rules['default']('default', '2')
    it("should accept specified param", function(done) {
      fn(['1'], function(err, vals) {
        assert(err == null)
        vals.should.eql(['1'])
        done()
      })
    })
    it("should set param if not present", function(done) {
      fn([], function(err, vals) {
        assert(err == null)
        vals.should.eql(['2'])
        done()
      })
    })
  })
})
