var Command = require('../../../../').Command;

var AppsCommand = module.exports = Command.extend({
	desc: 'List applications',
	
	run: function () {
		this.program.stdout.write('apps\n');
	}
});