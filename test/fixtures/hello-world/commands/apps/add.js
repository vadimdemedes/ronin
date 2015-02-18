var Command = require('../../../../../').Command;

var AppsAddCommand = module.exports = Command.extend({
	desc: 'Add application',
	
	options: {
		stack: 'string'
	},
	
	run: function (stack, name) {
		this.program.stdout.write('apps add ' + this.options.stack + ' ' + name + '\n');
	}
});