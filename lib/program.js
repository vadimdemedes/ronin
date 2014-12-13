/**
 * Dependencies
 */

var Logger = require('./logger');

var basename = require('path').basename;
var table = require('text-table');
var glob = require('glob').sync;
var util = require('./util');
var fs = require('fs');

var extend = util.extend;
var take = util.take;


/**
 * Expose `Program`
 */

module.exports = Program;


/**
 * Program
 */

function Program (options) {
	this.name = basename(process.argv[1]);
	this.path = process.cwd();
	this.delimiter = ' ';
	this.stdout = process.stdout;
	
	// if options is a string
	// assume it's a path
	if ('string' === typeof options) this.path = options;
	
	// if it's an object
	// extend this with it
	if ('object' === typeof options) extend(this, options);
}


/**
 * Program prototype
 */

var program = Program.prototype;


/**
 * Methods
 */


/**
 * Set option
 *
 * @param {String,Object} key
 * @param {Mixed} value - value
 * @returns {Mixed}
 * @api public
 */

program.set = function (key, value) {
	if ('object' === typeof key) {
		return extend(this, key);
	}
	
	return this[key] = value;
};


/**
 * Get option
 *
 * @param {String} key
 * @returns {Mixed}
 * @api public
 */

program.get = function (key) {
	return this[key] = value;
};


/**
 * Setup commands
 *
 * @api private
 */

program.setupCommands = function () {
	var rootPath = this.path;
	var path = rootPath + '/commands';
	
	if (!fs.existsSync(path)) return;
	
	var program = this;
	var delimiter = this.delimiter;
	
	// search through ./commands folder
	var commands = glob(path + '/**/*');
	
	// level of nesting for commands
	var level = 0;
	
	// filter out non-js files
	commands = commands.filter(function (file) {
		return /\.js$/.test(file);
	});

	path = path.replace(/\\/g, '/');
	
	// strip root path and apply delimiter
	commands = commands.map(function (file) {
	  // remove root path from file path
	  // remove .js extension
	  // replace slashes with a delimiter
		file = file.replace(/\\/g, '/')
					      .replace(path + '/', '')
					      .replace('.js', '')
					      .replace(/\//g, delimiter);
		
		// find number of delimiters
		// in command name
		var match = file.match(new RegExp(delimiter));
		var delimiters = (match || []).length;
		
		// if delimiter count is more than
		// previous level
		// increase it
		if (delimiters > level) level = delimiters;
		
		return file;
	});
	
	// sort files by path length
	commands.sort(function (a, b) {
		return a.length > b.length ? 1 : -1;
	});
	
	// assign handlers
	commands.forEach(function (name) {
	  // path to command
		var path = rootPath + '/commands/' + name.replace(new RegExp(delimiter), '/');
		
		// command class
		var command = require(path);
		
		// extend command with its name, program and path
		command.prototype.program = program;
		command.prototype.path = path;
		command.prototype.name = name;
		
		// set nesting level for command
		var match = name.match(new RegExp(delimiter));
		command.prototype.level = (match || []).length;
		
		// register command
		commands[name] = command;
	});
	
	this.commands = commands;
	this.level = level;
}


/**
 * Run a program
 *
 * @api public
 */

program.run = function () {
  // search through ./commands folder
  // and register all commands
	this.setupCommands();
	
	// strip "node" and path to a script
	var args = process.argv.slice(2);
	
	// no options, print program help
	if (!args.length) {
		return this.help();
	}
	
	// if there is "-h" or "--help"
	// this should be a help command
	var isHelp = args.includes('-h') || args.includes('--help');
	
	// if there is ONLY help option
	// this is a root help command
	if (1 === args.length && isHelp) {
		return this.help();
	}
	
	var level = this.level;
	var commands = this.commands;
	
	while (level >= 0) {
	  // get n first items of program arguments
		var name = take(args, level + 1).join(this.delimiter);
		
		if (commands[name]) {
			// remove command name from process.argv
			process.argv.splice(0, level + 3);
			
			if (isHelp) {
				this.helpCommand(name);
			} else {
				this.runCommand(name);
			}
			
			return;
		}
		
		level--;
	}
	
	Logger.log('error', 'Command does not exist.');
};


/**
 * Run specific command
 *
 * @param {String} name
 * @api private
 */

program.runCommand = function (name) {
	// get handler for command
	var command = new this.commands[name];
	
	try {
		command.execute();
	} catch (err) {
		var nativeErrors = [
			'EvalError',
			'InternalError',
			'RangeError',
			'ReferenceError',
			'SyntaxError',
			'TypeError',
			'URIError'
		];
		
		// if the error is related to code
		// throw it
		if (nativeErrors.includes(err.name)) throw err;
		
		// if not, assume that it was thrown on purpose
		Logger.log('error', err.message);
	}
};


/**
 * Print program help
 *
 * @api private
 */

program.help = function () {
	this.stdout.write('Usage: ' + this.name + ' COMMAND [OPTIONS]\n\n');
	
	if (this.desc) {
		this.stdout.write('  ' + this.desc + '\n\n');
	}
	
	// get top-level commands and
	// show compact help for each of them
	var commands = this.commandsForLevel(0);
	if (!commands.length) return;
	
	var output = [];
	
	commands.forEach(function (command) {
		command = new command();
		var help = command.help('compact');
		
		output.push([command.name, help]);
	});
	
	this.stdout.write('Available commands:\n\n');
	
	// build output
	output = table(output);
	
	// write generated output
	this.stdout.write(output + '\n');
};


/**
 * Print help for a specific command
 *
 * @param {String} name
 * @api private
 */

program.helpCommand = function (name) {
	// get handler for command
	var command = new this.commands[name];
	
	this.stdout.write(command.help());
	
	// if there are sub-commands
	// (commands on the deeper level)
	// show compact help for each of them
	var subcommands = this.commandsForLevel(command.level + 1);
	subcommands = subcommands.filter(function (subcommand) {
		return subcommand.prototype.name.indexOf(command.name) === 0;
	});
	
	if (subcommands.length) {
		this.stdout.write('Additional commands:\n\n');
		
		var output = [];
		
		subcommands.forEach(function (subcommand) {
			subcommand = new subcommand();
			var help = subcommand.help('compact');
			
			output.push([subcommand.name, help]);
		});
		
		// build output
		output = table(output);
		
		// write generated output
		this.stdout.write(output + '\n');
	}
};


/**
 * Get a list of commands
 * For a specific level/floor
 *
 * @param {Number} level
 * @returns {Array}
 * @api private
 */

program.commandsForLevel = function (level) {
	var delimiter = this.delimiter;
	var commands = this.commands;
	
	return commands.filter(function (name) {
		var command = commands[name].prototype;
		
		// check if there is an index command
		// apps/create.js => apps.js
		var path = command.path.split('/').slice(0, -1).join('/') + '.js';
		
		if (!fs.existsSync(path)) {
		  if (command.level > 0) command.level--;
		}
		
		return command.level === level;
	}).map(function (command) {
		return commands[command];
	});
};
