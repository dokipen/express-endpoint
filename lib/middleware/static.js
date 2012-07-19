var express = require('express')
  , resolve = require('path').resolve;

exports = module.exports = function() {
  return express.static(resolve(__dirname, '../../public'));
}
