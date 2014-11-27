/**
 * Dependencies
 */

var Class = require('class-extend');

var minimist = require('minimist');
var async = require('async');


/**
 * Command
 */

var Command = Class.extend({
	constructor: function () {
		if (!this.options) this.options = {};
		if (!this.use) this.use = [];
		if (!this.desc) this.desc = '';
		
		this.configure();
	}
});


/**
 * Command prototype
 */

var command = Command.prototype;


/**
 * Methods
 */

command.configure = function () {
	
};

command.help = function (type) {
	if ('compact' === type) {
		return this.desc;
	}
	
	var help = '';
	
	help += 'Usage: ' + this.program.name + ' ' + this.name + ' [OPTIONS]\n\n';
	
	if (this.desc) {
		help += '  ' + this.desc + '\n\n';
	}
	
	return help;
};

command.buildArgs = function () {
	// options for minimist
	var parserOptions = {
		string: [],
		boolean: [],
		alias: {},
		default: {}
	};
	
	// command options
	var options = this.options;
	
	// convert command options
	// into options for minimist
	Object.keys(options).forEach(function (name) {
		var option = options[name];
		
		// option can be a string
		// assume it's a type
		if ('string' === option) {
			option = {
				type: option
			};
		}
		
		if ('string' === option.type) {
			parserOptions.string.push(name);
		}
		
		if ('boolean' === option.type) {
			parserOptions.boolean.push(name);
		}
		
		// "aliases" or "alias" property
		// can be string or array
		// need to always convert to array
		var aliases = options.aliases || option.alias || [];
		if ('string' === typeof aliases) aliases = [aliases];
		
		aliases.forEach(function (alias) {
			parserOptions.alias[alias] = name;
		});
		
		if (option.default) {
			parserOptions.default[name] = option.default;
		}
	});
	
	var args = minimist(process.argv, parserOptions);
	
	// arguments for .run() method
	// need to build them in the same order
	// they were defined
	var handlerArgs = [];
	
	Object.keys(options).forEach(function (name) {
		var option = options[name];
		var value = args[name];
		
		if (option.required && !value) {
			throw new Error('No value provided for required argument \'' + name + '\'');
		}
		
		handlerArgs.push(args[name]);
	});
	
	handlerArgs.push.apply(handlerArgs, args._);
	
	return handlerArgs;
};

command.execute = function () {
	var command = this;
	var program = this.program;
	
	var args = this.buildArgs();
	
	var middleware = this.use || [];
	if (! (middleware instanceof Array)) {
		middleware = [middleware];
	}
	
	middleware.push(this.run);
	
	var stack = middleware.map(function (fn) {
		if ('string' === typeof fn) {
			var path = program.path + '/middleware/' + fn;
			fn = require(path);
		}
		
		var bindArgs = Array.prototype.slice.call(args);
		bindArgs.unshift(command);
		
		return fn.bind.apply(fn, bindArgs);
	});
	
	async.forEachSeries(stack, function (fn, next) {
		fn(next);
	});
};

command.run = function () {
	
};


/**
 * Expose `Command`
 */

module.exports = Command;