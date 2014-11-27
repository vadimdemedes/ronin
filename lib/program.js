/**
 * Dependencies
 */

var Logger = require('./logger');

var basename = require('path').basename;
var table = require('text-table');
var util = require('./util');
var fs = require('fs');

var extend = util.extend;
var walk = util.walk;
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
	this.rootPath = process.cwd();
	this.delimiter = ' ';
	
	// if options is a string
	// assume it's a path
	if ('string' === typeof options) this.rootPath = options;
	
	// if it's an object
	// extend this with it
	if ('object' === typeof options) extend(this, options);
	
	this.setupCommands();
}


/**
 * Program prototype
 */

var program = Program.prototype;


/**
 * Methods
 */

program.setupCommands = function () {
	var rootPath = this.rootPath;
	var path = rootPath + '/commands';
	
	if (!fs.existsSync(path)) return;
	
	var programName = this.name;
	var delimiter = this.delimiter;
	
	// search through ./commands folder
	var commands = walk(path);
	
	// level of nesting for commands
	var level = 0;
	
	// filter out non-js files
	commands = commands.filter(function (file) {
		return /\.js$/.test(file);
	});
	
	// strip root path and apply delimiter
	commands = commands.map(function (file) {
		file = file.replace(path + '/', '')
					.replace('.js', '')
					.replace('/', delimiter);
		
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
		var commandPath = rootPath + '/commands/' + name.replace(delimiter, '/');
		var command = require(commandPath);
		
		// extend command with its name, program name and path
		command.prototype.path = commandPath;
		command.prototype.name = name;
		command.prototype.programName = programName;
		
		// set nesting level for command
		var match = name.match(new RegExp(delimiter));
		command.prototype.level = (match || []).length;
		
		// register command
		commands[name] = command;
	});
	
	this.commands = commands;
	this.level = level;
}

program.run = function () {
	var args = process.argv.slice(2);
	
	// no options
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

program.help = function () {
	process.stdout.write('Usage: ' + this.name + ' COMMAND [OPTIONS]\n\n');
	process.stdout.write('Available commands:\n\n');
	
	var output = [];
	
	// get top-level commands and
	// show compact help for each of them
	var commands = this.commandsForLevel(0);
	commands.forEach(function (command) {
		command = new command();
		var help = command.help('compact');
		
		output.push([command.name, help]);
	});
	
	// build output
	output = table(output);
	
	// write generated output
	process.stdout.write(output + '\n');
};

program.commandsForLevel = function (level) {
	var delimiter = this.delimiter;
	var commands = this.commands;
	
	return commands.filter(function (name) {
		var command = commands[name].prototype;
		
		var commandLevel = command.level;
		
		if (!fs.existsSync(command.path.split('/').slice(0, -1).join('/') + '.js')) {
			if (commandLevel > 0) commandLevel = commandLevel - 1;
		}
		
		return commandLevel === level;
	}).map(function (command) {
		return commands[command];
	});
};

program.helpCommand = function (name) {
	// get handler for command
	var command = new this.commands[name];
	
	process.stdout.write(command.help());
	
	// if there are sub-commands
	// (commands on the deeper level)
	// show compact help for each of them
	var subcommands = this.commandsForLevel(command.level + 1);
	subcommands = subcommands.filter(function (subcommand) {
		return subcommand.prototype.name.indexOf(command.name) === 0;
	});
	
	if (subcommands.length) {
		process.stdout.write('Additional commands:\n\n');
		
		var output = [];
		
		subcommands.forEach(function (subcommand) {
			subcommand = new subcommand();
			var help = subcommand.help('compact');
			
			output.push([subcommand.name, help]);
		});
		
		// build output
		output = table(output);
		
		// write generated output
		process.stdout.write(output + '\n');
	}
};