var Command = require('../../../../').Command;

var AppsCommand = module.exports = Command.extend({
  usage: 'hello-world apps [options] <command>',
	desc: 'List applications',

	run: function () {
		this.program.stdout.write('apps\n');
	}
});
