/**
 * Default rules set for express-endpoint
 */
var urlparse = require('urlparse.js').parse
  , debug = require('debug')('express-endpoint:rules')
  , funcBlacklist = require('./funcBlacklist')

exports = module.exports =
  { number: function(name) {
      return function(vals, cb) {
        try {
          var mapped = vals.map(function(val) {
            if (val.match(/^-?[0-9]+(\.[0-9]+)?$/)) {
              return Number(val)
            } else {
              throw new Error("Invalid number ["+val+"]")
              return
            }
          })
          cb(null, mapped)
        } catch(e) {
          cb(e)
        }
      }
    }
  , timestamp: function(name) {
      return function(vals, cb) {
        try {
          var mapped = vals.map(function(val) {
            if (val.match(/^-?[0-9]+(\.[0-9]+)?$/)) {
              var n = Number(val)
              // I apologize to any date before 1971 specified in ms
              if (n < 1000000000000) {
                n *= 1000
              }
              return new Date(n)
            } else {
              throw new Error("Invalid timestamp ["+val+"]")
              return
            }
          })
          cb(null, mapped)
        } catch(e) {
          cb(e)
        }
      }
    }
  , 'boolean': function(name) {
      return function(vals, cb) {
        if (vals.length > 1) {
          cb(new Error("The parameter only accepts one value"))
        } else {
          var val = vals.length == 1 ? vals[0] : null

          if (val == true ||
                     val == '1' ||
                     val == '' ||
                     val == 1 ||
                     String(val).toLowerCase() == 'true') {
            cb(null, true)
          } else {
            cb(null, false)
          }
        }
      }
    }
  , regex: function(name, param) {
      var regex = new RegExp(param)

      return function(vals, cb) {
        try {
          var mapped = vals.map(function(val) {
            if (val && val.match(regex)) {
              return val
            } else {
              throw new Error("["+val+"] doesn't match the regex ["+regex+"]")
              return
            }
          })
          cb(null, mapped)
        } catch(e) {
          cb(e)
        }
      }
    }
  , required: function(name) {
      return function(vals, cb) {
        debug("running required rule");
        debug(name, vals)
        if (vals.filter(function(i) {return i != ''}).length == 0) {
          cb(new Error("The parameter is required"))
        } else {
          cb(null, vals)
        }
      }
    }
  , url: function(name) {
      return function(vals, cb) {
        try {
          var mapped = vals.map(function(val) {
            var purl = urlparse(val)

            if (purl && purl.hostname) {
              return purl
            } else {
              throw new Error("["+val+"] isn't a valid URL")
              return
            }
          })
          cb(null, mapped)
        } catch(e) {
          cb(e)
        }
      }
    }
  , max: function(name, param) {
      var occurances = Number(param)

      return function(vals, cb) {
        if (vals.length > occurances) {
          cb(new Error("The parameter can only be specified ["+occurances+"] times"))
        } else {
          cb(null, vals)
        }
      }
    }
  , once: function(name) {
      return function(vals, cb) {
        if (!vals || vals.length > 1) {
          cb(new Error("The parameter can only be specified once"))
        } else {
          cb(null, vals[0])
        }
      }
    }
  , callback: function(name) {
      return function(vals, cb) {
        if (vals.length > 1) {
          cb(new Error("The parameter can only be specified once"))
        } else {
          if (vals.length > 0 &&
                (  funcBlacklist[vals[0]]
                || !vals[0].match(/^[$a-z_][$a-z0-9_]*$/i) ) ) {
            cb(new Error("The value ["+vals[0]+"] is not a legal function name"))
          } else {
            cb(null, vals[0])
          }
        }
      }
    }
  , 'default': function(name, param) {
      return function(vals, cb) {
        if (vals.length == 0) {
          cb(null, [param])
        } else {
          cb(null, vals)
        }
      }
    }
  }
