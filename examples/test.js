var app = require('express')()
  , urlparse = require('urlparse.js').parse
  , endpoint = require('../index')
  , express = require('express')

var test_opts =
  { path: '/my/endpoint'
  , doc_on_error: true
  , description: 'My endpoint.'
  , example: '/my/endpoint?firstname=bob&lastname=corsaro&age=34&homepage=doki-pen.org/~doki_pen&homepage=bit.ly/rcorsaro'
  , parameters:
    [ { name: 'firstname'
      , rules: ['regex(^[^0-9_]+$)', 'required', 'once']
      , description: 'The first name. (required)'
      }
    , { name: 'lastname'
      , rules: ['regex(^[^0-9_]+$)', 'required', 'once']
      , description: 'The last name. (required)'
      }
    , { name: 'homepage'
      , rules: ['url', 'max(3)']
      , description: 'The home page. You can specify up to 3.'
      }
    , { name: 'age'
      , rules: ['number', 'required', 'gte18', 'once']
      , description: 'The age. Must be at least 18. (required)'
      }
    , { name: 'favorite-color'
      , rules: ['default(blue)', 'regex(^(blue|red|yellow|black|white|green)$)', 'once']
      , description: 'Your favorite color.'
      }
    , { name: 'crazy'
      , rules: ['default(false)', 'boolean']
      , description: 'Are you crazy?'
      }
    , { name: 'callback'
      , rules: ['callback']
      , description: 'JSONP Callback.'
      }
    ]
  , rules:
    { gte18: function(name) {
        return function(vals, cb) {
          try {
            var mapped = vals.map(function(val) {
              if (val < 18) {
                throw new Error("["+val+"] is less then 18")
              } else {
                return val
              }
            })
            cb(null, mapped)
          } catch(e) {
            cb(e)
          }
        }
      }
    }
  , handler: function(req, res) {
      res.render_endpoint_data(req.endpoint_params)
    }
  , app: app
  }

var echo_opts =
  { path: '/echo'
  , description: 'Echo message'
  , example: '/echo?msg=Hello+World'
  , parameters:
    [ { name: 'msg'
      , rules: ['required', 'max(1)']
      , description: 'Message that should be echoed. (required)'
      }
    ]
  , handler: function(req, res) {
      res.send('<pre>'+req.endpoint_params.msg[0]+'<\pre>')
    }
  , app: app
  }

app.use(express.logger())
app.use(express.errorHandler())
endpoint(test_opts)
endpoint(echo_opts)
endpoint.catalog({app: app, path: '/'})

app.listen(process.env.PORT || 3000)
