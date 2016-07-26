#!/usr/bin/env node
var app = require('express')()
  , urlparse = require('urlparse.js').parse
  , Endpoint = require('../index')
  , morgan = require('morgan')
  , errorHandler = require('errorhandler')
  , test
  , echo
  , catalog;

test = new Endpoint(
  { path: '/my/endpoint'
  , description: 'My endpoint.'
  , example: '/my/endpoint?firstname=bob&lastname=corsaro&age=34&homepage=doki-pen.org/~doki_pen&homepage=bit.ly/rcorsaro'
  , parameters:
    [ { name: 'firstname'
      , rules: ['regex(^[^0-9_]+$)', 'required', 'once']
      , description: 'The first name.'
      }
    , { name: 'lastname'
      , rules: ['regex(^[^0-9_]+$)', 'required', 'once']
      , description: 'The last name.'
      }
    , { name: 'homepage'
      , rules: ['url', 'max(3)']
      , description: 'The home page. You can specify up to 3.'
      }
    , { name: 'age'
      , rules: ['number', 'required', 'gte18', 'once']
      , description: 'The age. Must be at least 18.'
      }
    , { name: 'favorite-color'
      , rules: ['default(blue)', 'regex(^(blue|red|yellow|black|white|green)$)', 'once']
      , description: 'Your favorite color.'
      }
    , { name: 'crazy'
      , rules: ['default(false)', 'boolean']
      , description: 'Are you crazy?'
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
      res.endpoint.render(req.endpoint.params);
    }
  }
);

echo = new Endpoint(
  { path: '/echo'
  , description: 'Echo message'
  , example: '/echo?msg=Hello+World'
  , parameters:
    [ { name: 'msg'
      , rules: ['required', 'max(1)']
      , description: 'Message that should be echoed. (required)'
      }
    ]
  , middleware:
    { hi:
        function() {
          return function(req, res, next) {
            console.log('hi from middleware')
            next()
          }
        }
    }
  , handler: function(req, res) {
      res.send('<pre>'+req.endpoint.params.msg[0]+'<\pre>')
    }
  }
);

catalog = Endpoint.catalog({endpoints: [test, echo]});

app.set('view options', { pretty: true });

app.use(morgan('combined'));
app.use(Endpoint.static());

test.mount(app);
echo.mount(app);
app.get('/', catalog);

app.use(Endpoint.errorHandler());
app.use(errorHandler());

app.listen(process.env.PORT || 3000);
