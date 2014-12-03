var Command = require('../../../../../').Command;

var AppsEditCommand = module.exports = Command.extend({
	desc: 'Edit application',
	use: ['auth', 'beforeRun'],
	
	run: function (name) {
		this.program.stdout.write('apps edit ' + name + '\n');
	},
	
	beforeRun: function (next) {
		this.program.stdout.write('beforeRun\n');
		
		next();
	}
});