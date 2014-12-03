/**
 * Dependencies
 */

var Command = require('../../../').Command;

var spawn = require('child_process').spawn;


/**
* New command
*/

var NewCommand = Command.extend({
	desc: 'Create new command',

	run: function (name) {
	  spawn('yo', ['ronin:command', name], {
		  cwd: process.cwd(),
		  stdio: 'inherit'
		});
	}
});


/**
* Expose command
*/

module.exports = NewCommand;