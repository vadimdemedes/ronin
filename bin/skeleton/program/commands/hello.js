var Command = require('ronin').Command;

var HelloCommand = module.exports = Command.extend({
	desc: 'Command that says hello',
	
	run: function () {
		console.log('Hello World!');
	}
});