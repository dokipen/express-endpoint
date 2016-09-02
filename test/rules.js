var rules = require('../lib/rules')
  , should = require('should')
  , Promise = require('bluebird')
  , debug = require('debug')("express-endpoint:tests:rules")
  , _ = require('lodash')

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
      var parallel = []

      ;['@onclick', ''].forEach(function(name) {
        parallel.push(Promise.promisify(fn)([name])
          .then(function() {
            throw Error("Expected error");
          })
          .catch(function() {}))
      })
      Promise.all(parallel).spread(done).catch(done).done()
    })
    it('should accept legal function names', function(done) {
      var parallel = []

      ;['zonclick', '$$', 'a9879385472945_234aASDFasdf'].forEach(function(name) {
        parallel.push(
          Promise.promisify(fn)([name])
            .then(function(vals) {
              vals.should.eql(name)
            }))
      })

      Promise.all(parallel).spread(done).catch(done).done();
    })
  })
  describe('number', function() {
    var fn = rules.number('number')
    it('should fail on non-numbers', function(done) {
      var parallel = []

      'break 1a a1 1o1 - .4 10.'.split(' ').forEach(function(val) {
        parallel.push(Promise.promisify(fn)([val])
          .then(function() { throw new Error('Expected failure') })
          .catch(_.noop))
      })

      ;['', null, undefined].forEach(function(val) {
        parallel.push(Promise.promisify(fn)([val])
          .then(function() { throw new Error('Expected failure') })
          .catch(_.noop))
      })

      Promise.all(parallel).spread(done).catch(done).done();
    })
    it('should convert legal strings to numbers', function(done) {
      fn(['1', '12', '-234', '-24.234', '0.4'], function(err, vals) {
        should.not.exist(err)
        vals.should.eql([1, 12, -234, -24.234, 0.4])
        done()
      })
    })
  })
  describe('timestamp', function() {
    var fn = rules.timestamp('timestamp')
    it('should fail on invalid times', function(done) {
      fn(['lkasjdf'], function(err, vals) {
        should.exist(err)
        done()
      })
    })
    it('should parse valid timestamps', function(done) {
      var d = new Date()
        , str_ms = Number(d).toString()
        , str_s = (Number(d)/1000).toString()
        , parallel = []

      ;[str_ms, str_s].forEach(function(val) {
        parallel.push(
          Promise.promisify(fn)([val])
            .then(function(vals) {
              vals.should.eql([d])
            }))
      })

      Promise.all(parallel).spread(done).catch(done).done();
    })
  })
  describe('boolean', function() {
    var fn = rules['boolean']('boolean')
    it("should convert '1' '' and 'true' to true", function(done) {
      var parallel = []
      ;['1', '', 'true'].forEach(function(val) {
        parallel.push(Promise.promisify(fn)([val]).then(function(val) {
          val.should.eql(true)
        }))
      })
      Promise.all(parallel).spread(done).catch(done).done();
    })
    it("should only accept one value", function(done) {
      fn(['1', '1'], function(err) {
        err.should.not.eql(null)
        done()
      })
    })
    it("should convert other values to false", function(done) {
      var parallel = []
      ;['2', 'truer'].forEach(function(val) {
        parallel.push(Promise.promisify(fn)([val]).then(function(val) {
          val.should.eql(false)
        }))
      })
      Promise.all(parallel).spread(done).catch(done).done();
    })
  })
  describe('regex', function() {
    var fn = rules.regex('regex', 'a+')
    it("should accept matching params", function(done) {
      var parallel = []
      ;['a', 'aa', 'aaa'].forEach(function(val) {
        parallel.push(Promise.promisify(fn)([val]).then(function(vals) {
          vals.should.eql([val])
        }))
      })
      Promise.all(parallel).spread(done).catch(done).done();
    })
    it("should fail on non-matching params", function(done) {
      fn(['a', 'b', 'aa'], function(err) {
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
          should.not.exist(err)
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
      fn(['::/:/', 'www.yahoo.com'], function(err) {
        err.should.not.eql(null)
        done()
      })
    })
  })
  describe('required', function() {
    var fn = rules.required('required')
    it("should accept specified params", function(done) {
      fn([1], function(err, vals) {
        should.not.exist(err)
        vals.should.eql([1])
        done()
      })
    })
    it("should fail if param is empty", function(done) {
      fn([], function(err) {
        err.should.not.eql(null)
        done()
      })
    })
  })
  describe('max', function() {
    it("should accept up to max params", function(done) {
      var fn = rules.max('max', 3)
        , parallel = []

      ;[[1,2,3], [1,2], [1], []].forEach(function(input) {
        parallel.push(Promise.promisify(fn)(input).then(function(vals) {
          vals.should.eql(input)
          return null
        }))
      })
      Promise.all(parallel).spread(done).catch(done).done();
    })
    it("should fail if param is specified more then max times", function(done) {
      var fn = rules.max('max', 3)
      fn([1,2,3,4], function(err) {
        err.should.not.eql(null)
        done()
      })
    })
  })
  describe('once', function() {
    var fn = rules.once('once')
    it("should accept specified param", function(done) {
      fn(['1'], function(err, vals) {
        should.not.exist(err)
        vals.should.eql('1')
        done()
      })
    })
    it("should fail if param is specified more then once", function(done) {
      fn(['1', '2'], function(err) {
        err.should.not.eql(null)
        done()
      })
    })
  })
  describe('default', function() {
    var fn = rules['default']('default', '2')
    it("should accept specified param", function(done) {
      fn(['1'], function(err, vals) {
        should.not.exist(err)
        vals.should.eql(['1'])
        done()
      })
    })
    it("should set param if not present", function(done) {
      fn([], function(err, vals) {
        should.not.exist(err)
        vals.should.eql(['2'])
        done()
      })
    })
  })
})
