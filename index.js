var Program = require('./lib/program');
var Command = require('./lib/command');

var exports = module.exports = function createProgram (options) {
	return new Program(options);
};

exports.Command = Command;