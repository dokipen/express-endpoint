var rules = require('../lib/rules')
  , should = require('should')

describe('rules', function() {
  describe('callback', function() {
    var fn = rules.callback('callback')
    it('should fail on reserved words', function(done) {
      ;(function() {
        fn(['break'])
      }).should.throw()
      done()
    })
    it('should fail on predefined variables', function(done) {
      ;(function() {
        fn(['undefined'])
      }).should.throw()
      done()
    })
    it('should fail on event names', function(done) {
      ;(function() {
        fn(['onclick'])
      }).should.throw()
      done()
    })
    it('should fail on multiple args', function(done) {
      ;(function() {
        fn(['zonclick', 'bob'])
      }).should.throw()
      done()
    })
    it('should fail on illegal function names', function(done) {
      ;(function() {
        fn(['@onclick'])
      }).should.throw()
      ;(function() {
        fn([''])
      }).should.throw()
      done()
    })
    it('should accept legal function names', function(done) {
      fn(['zonclick']).should.eql(['zonclick'])
      fn(['$$']).should.eql(['$$'])
      fn(['a9879385472945_234aASDFasdf']).should.eql(['a9879385472945_234aASDFasdf'])
      done()
    })
  })
  describe('number', function() {
    var fn = rules.number('number')
    it('should fail on non-numbers', function(done) {
      'break 1a a1 1o1 - .4 10.'.split(' ').forEach(function(val) {
        ;(function() {
          fn([val])
        }).should.throw()
      })
      ;(function() {
        fn([''])
      }).should.throw()
      ;(function() {
        fn([null])
      }).should.throw()
      ;(function() {
        fn([undefined])
      }).should.throw()
      done()
    })
    it('should convert legal strings to numbers', function(done) {
      fn(['1', '12', '-234', '-24.234', '0.4']).should.eql([1, 12, -234, -24.234, 0.4])
      done()
    })
  })
  describe('timestamp', function() {
    var fn = rules.timestamp('timestamp')
    it('should fail on invalid times', function(done) {
      ;(function() {
        fn(['lkasjdf'])
      }).should.throw()
      done()
    })
    it('should parse valid timestamps', function(done) {
      var d = new Date()
        , str_ms = Number(d).toString()
        , str_s = (Number(d)/1000).toString()

      fn([str_ms]).should.eql([d])
      fn([str_s]).should.eql([d])
      done()
    })
  })
  describe('boolean', function() {
    var fn = rules['boolean']('boolean')
    it("should convert '1' '' and 'true' to true", function(done) {
      fn(['1']).should.eql([true])
      fn(['']).should.eql([true])
      fn(['true']).should.eql([true])
      done()
    })
    it("should only accept one value", function(done) {
      ;(function() {
        fn(['1', '1'])
      }).should.throw()
      done()
    })
    it("should convert other values to false", function(done) {
      fn(['2']).should.eql([false])
      fn(['truer']).should.eql([false])
      done()
    })
  })
  describe('regex', function() {
    var fn = rules.regex('regex', 'a+')
    it("should accept matching params", function(done) {
      fn(['a', 'aa', 'aaa']).should.eql(['a', 'aa', 'aaa'])
      done()
    })
    it("should fail on non-matching params", function(done) {
      (function() {
        fn(['a', 'b', 'aa'])
      }).should.throw()
      done()
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
      ).map(function(i) {return i.href}).should.eql(
        [ 'http://www.google.com/'
        , 'https://yahoo.com/a/b'
        , 'http://doki-pen.org/~doki_pen'
        ]
      )
      done()
    })
    it("should fail on non-valid urls", function(done) {
      (function() {
        fn(['::/:/', 'www.yahoo.com'])
      }).should.throw()
      done()
    })
  })
  describe('required', function() {
    var fn = rules.required('required')
    it("should accept specified params", function(done) {
      fn([1]).should.eql([1])
      done()
    })
    it("should fail if param is empty", function(done) {
      (function() {
        fn([])
      }).should.throw()
      done()
    })
  })
  describe('max', function() {
    it("should accept up to max params", function(done) {
      var fn = rules.max('max', 3)
      fn([1,2,3]).should.eql([1,2,3])
      fn([1,2]).should.eql([1,2])
      fn([1]).should.eql([1])
      fn([]).should.eql([])
      done()
    })
    it("should fail if param is specified more then max times", function(done) {
      var fn = rules.max('max', 3)
      (function() {
        fn([1,2,3,4])
      }).should.throw()
      done()
    })
  })
  describe('once', function() {
    var fn = rules.once('once')
    it("should accept specified param", function(done) {
      fn(['1']).should.eql(['1'])
      done()
    })
    it("should fail if param is specified more then once", function(done) {
      ;(function() {
        fn(['1', '2'])
      }).should.throw()
      done()
    })
  })
  describe('default', function() {
    var fn = rules['default']('default', '2')
    it("should accept specified param", function(done) {
      fn(['1']).should.eql(['1'])
      done()
    })
    it("should set param if not present", function(done) {
      fn([]).should.eql(['2'])
      done()
    })
  })
})
