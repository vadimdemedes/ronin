var Command = require('../../../../../').Command;

var GenerateProjectCommand = module.exports = Command.extend({
	desc: 'Generate new project',
	options: {
	  verbose: 'boolean'
	},
	
	run: function (verbose, name) {
	  this.program.stdout.write('generate project ' + name + ' ' + verbose + ' ' + this.global.app + ' ' + this.global.a + '\n');
	}
});