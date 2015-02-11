var Program = require('./build/program');
var Command = require('./build/command');

var exports = module.exports = function createProgram (options) {
	return new Program(options);
};

exports.Command = Command;