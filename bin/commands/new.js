/**
 * Dependencies
 */

var Command = require('../../').Command;

var spawn = require('child_process').spawn;


/**
 * New application
 */

var NewApplication = Command.extend({
	desc: 'Create new application',
	
	run: function (name) {
		var execFile = process.platform === "win32" ? "yo.cmd" : "yo";

		spawn(execFile, ['ronin', name], {
			cwd: process.cwd(),
			stdio: 'inherit'
		});
	}
});


/**
 * Expose command
 */

module.exports = NewApplication;