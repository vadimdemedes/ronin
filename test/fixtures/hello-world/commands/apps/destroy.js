var Command = require('../../../../../').Command;

var AppsDestroyCommand = module.exports = Command.extend({
	desc: 'Destroy application',
	
	options: {
		force: {
			type: 'boolean',
			alias: 'f'
		}
	},
	
	run: function (force, name) {
		this.program.stdout.write('apps destroy ' + name + ' ' + force + '\n');
	}
});