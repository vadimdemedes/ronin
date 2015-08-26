'use strict';

/**
 * Dependencies
 */

var Program = require('./lib/program');
var Command = require('./lib/command');


/**
 * Expose factory and Command class
 */

module.exports = exports = createProgram;

exports.Command = Command;


/**
 * Program factory
 */

function createProgram(options) {
  return new Program(options);
}
