/**
 * Dependencies
 */

var chalk = require('chalk');


/**
 * Expose `Logger`
 */

module.exports = Logger;


/**
 * Logger
 */

function Logger () {
	
}

Logger.stdout = process.stdout;
Logger.stderr = process.stderr;

Logger.log = function (label) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var color = 'green';
	
	switch (label) {
		case 'warning': color = 'yellow'; break;
		case 'invoke': color = 'black'; break;
		case 'error': color = 'red'; break;
	}
	
	var stream = 'error' === label ? this.stderr : this.stdout;
	var output = chalk[color](label) + '\t' + args.join(' ');
	
	stream.write(output + '\n');
};