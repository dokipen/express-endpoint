var express = require('express');

exports = module.exports = function() {
  return express.static(__dirname + '/../../public');
}
