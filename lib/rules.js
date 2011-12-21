/**
 * Default rules set for express-endpoint
 */
var urlparse = require('urlparse.js').parse
  , func_blacklist = require('./func_blacklist')

exports = module.exports =
  { number: function(name) {
      return function(vals) {
        return vals.map(function(val) {
          if (val.match(/[^0-9]/)) {
            throw "Invalid number '"+val+"'"
          } else {
            return Number(val)
          }
        })
      }
    }
  , time: function(name) {
      return function(vals) {
        return vals.map(function(val) {
          return val
        })
      }
    }
  , bool: function(name) {
      return function(vals) {
        if (vals.length > 1) {
          throw "the boolean parameter only excepts one value"
        }
        var val = vals.length == 1 ? vals[0] : null
          , rval = [false]

        if (val == true ||
                   val == '1' ||
                   val == '' ||
                   val == 1 ||
                   String(val).toLowerCase() == 'true') {
          return [true]
        } else {
          return [false]
        }
      }
    }
  , regex: function(name, param) {
      var regex = new RegExp(param)

      return function(vals) {
        var rvals = []
        return vals.map(function(val) {
          if (val && val.match(regex)) {
            return val
          } else {
            throw "'"+val+"' doesn't match the regex '"+regex+"'"
          }
        })
      }
    }
  , required: function(name) {
      return function(vals) {
        if (vals.filter(function(i) {return i != ''}).length == 0) { 
          throw "Required parameter is not defined"
        } else {
          return vals
        }
      }
    }
  , url: function(name) {
      var rvals = []
      return function(vals) {
        return vals.map(function(val) {
          var purl = urlparse(val)

          if (purl && purl.hostname) {
            return purl.href
          } else {
            throw "'"+val+"' isn't a valid URL"
          }
        })
      }
    }
  , max: function(name, param) {
      var occurances = Number(param)

      return function(vals) {
        if (vals.length > occurances) {
          throw "The parameter can only be specified "+occurances+" times"
        } else {
          return vals
        }
      }
    }
  , once: function(name) {
      return function(vals) {
        if (vals.length > 1) {
          throw "The parameter can only be specified once"
        } else {
          return vals
        }
      }
    }
  , callback: function(name) {
      return function(vals) {
        if (vals.length > 1) {
          throw "The parameter can only be specified once"
        } else {
          if (vals.length > 0 &&
                (  func_blacklist[vals[0]] 
                || !vals[0].match(/^[$a-z_][$a-z0-9_]*$/i) ) ) {
            throw "The value ["+vals[0]+"] is not a legal function name" 
          } else {
            return vals
          }
        }
      }
    }
  , 'default': function(name, param) {
      return function(vals) {
        if (vals.length == 0) {
          return [param]
        } else {
          return vals
        }
      }
    }
  }
