/**
 * Dependencies
 */

require('colorodo');


/**
 * Expose `Logger`
 */

module.exports = Logger;


/**
 * Logger
 */

function Logger () {
	
}

Logger.log = function (label) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var color = 'green';
	
	switch (label) {
		case 'warning': color = 'yellow'; break;
		case 'invoke': color = 'black'; break;
		case 'error': color = 'red'; break;
	}
	
	var stream = 'error' === label ? process.stderr : process.stdout;
	var output = label.color(color) + '\t' + args.join(' ');
	
	stream.write(output + '\n');
};