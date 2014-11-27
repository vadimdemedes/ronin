var Command = require('../../../../../').Command;

var GenerateKeyCommand = module.exports = Command.extend({
	desc: 'Generate new key',
	
	run: function (name) {
		throw new Error('generate key ' + name);
	}
});