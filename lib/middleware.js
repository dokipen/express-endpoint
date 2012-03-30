var render = require('./middleware/render')
  , params = require('./middleware/params')
  , static = require('./middleware/static')
  , errorHandler = require('./middleware/errorHandler');

exports = module.exports = { render: render,
                             params:  params,
                             static: static,
                             errorHandler: errorHandler };
