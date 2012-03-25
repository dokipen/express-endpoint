var Hash = require('hashish');

exports.resolveParameters = module.exports.resolveParameters = function(params, extras) {
  if (!extras) {
    extras = [];
  }

  function map(r, i) {
    r[i.name] = i;
    return r;
  }

  return Hash(params.reduce(map, extras.reduce(map, {}))).values;
}
