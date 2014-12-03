/**
 * Dependencies
 */

var Command = require('../../../').Command;

var spawn = require('child_process').spawn;


/**
* New middleware
*/

var NewMiddleware = Command.extend({
	desc: 'Create new middleware',

	run: function (name) {
	  spawn('yo', ['ronin:middleware', name], {
		  cwd: process.cwd(),
		  stdio: 'inherit'
		});
	}
});


/**
* Expose command
*/

module.exports = NewMiddleware;