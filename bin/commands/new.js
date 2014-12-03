/**
 * Dependencies
 */

var Command = require('../../').Command;

var spawn = require('child_process').spawn;


/**
 * New application command
 */

var NewCommand = Command.extend({
	desc: 'Create new application',
	
	run: function (name) {
		spawn('yo', ['ronin', name], {
		  cwd: process.cwd(),
		  stdio: 'inherit'
		});
	}
});


/**
 * Expose command
 */

module.exports = NewCommand;