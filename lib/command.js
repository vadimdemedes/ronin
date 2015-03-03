/**
 * Dependencies
 */

var Class = require('class-extend');

var minimist = require('minimist');
var table = require('text-table');
var async = require('async');
var os = require('os');

// path shortcuts
var join = require('path').join;

/**
 * Command
 */

class Command {
  constructor () {
    if (!this.options) this.options = {};
		if (!this.use) this.use = [];
		if (!this.desc) this.desc = '';
		
		this.configure();
  }
  
  configure () {
    
  }
  
  run () {
    
  }
  
  
  /**
   * Display help for a command
   *
   * @param {String} type
   * @api public
   */
  help (type) {
    if (type === 'compact') return this.desc;

  	let help = '';

    help += `Usage: ${ this.usage() }${ os.EOL + os.EOL }`;

  	if (this.desc) {
  	  help += `  ${ this.desc }${ os.EOL + os.EOL }`;
  	}
  	
  	// generate a list of sub-commands
  	let names = Object.keys(this.program.commands).filter(name => {
  	  // add command to the list if
  	  // - it does not equal to itself
  	  // - it contains the name of a current command
  	  return name !== this.name && name.split(this.program.delimiter).indexOf(this.name) > -1;
  	});

    // no sub-commands
  	if (!names.length) return help;

    // sort commands alphabetically
    names.sort((a, b) => a.localeCompare(b));
    
    // get description for each command
    let commands = names.map(name => {
      let command = this.program._get(name);
      let desc = new command().help('compact');
      
      return [name, desc];
    });

    // output the list
    help += `Additional commands:${ os.EOL + os.EOL }`;
  	help += table(commands);

  	return help;
  }
  
  
  /**
   * Return usage information for this command
   *
   * @api public
   */
  usage () {
    return `${ this.program.name } ${ this.name } [OPTIONS]`;
  }
  
  
  /**
   * Build options for minimist
   *
   * @api private
   */
  _buildOptions (options) {
    // options for minimist
  	let parseOptions = {
  		string: [],
  		boolean: [],
  		alias: {},
  		default: {}
  	};

  	// convert command options
  	// into options for minimist
  	Object.keys(options).forEach(name => {
  		let option = options[name];

  		// option can be a string
  		// assume it's a type
  		if (option === 'string') {
  			option = {
  				type: option
  			};
  		}

  		if (option.type === 'string') {
  			parseOptions.string.push(name);
  		}

  		if (option.type === 'boolean') {
  			parseOptions.boolean.push(name);
  		}

  		// "aliases" or "alias" property
  		// can be string or array
  		// need to always convert to array
  		let aliases = option.aliases || option.alias || [];
  		if (typeof aliases === 'string') aliases = [aliases];

      aliases.forEach(alias => parseOptions.alias[alias] = name);

  		if (option.default) {
  			parseOptions.default[name] = option.default;
  		}
  	});

  	return parseOptions;
  }
  
  
  /**
   * Parse arguments
   *
   * @api private
   */
  _buildArgs () {
    let program = this.program;
    let command = this;
    
    // options for parser
    let parseOptions;
    
    // global options
    let options = program.options || {};

    parseOptions = this._buildOptions(options);
    this.global = minimist(process.argv, parseOptions);

    // command options
    options = command.options;

    parseOptions = this._buildOptions(options);
  	let args = this.options = minimist(process.argv, parseOptions);

  	// arguments for .run() method
  	// need to build them in the same order
  	// they were defined
  	let handlerArgs = [];

  	Object.keys(options).forEach(name => {
  		let option = options[name];
  		let value = args[name];

  		if (option.required && !value) {
  		  throw new Error(`No value provided for required argument '${ name }'`);
  		}

  		handlerArgs.push(args[name]);
  	});

  	// append arguments (don't confuse with options)
  	handlerArgs.push.apply(handlerArgs, args._);

  	return handlerArgs;
  }
  
  
  /**
   * Run command
   *
   * @api public
   */
  execute () {
  	let program = this.program;
  	let command = this;

  	let args = this._buildArgs();

  	let middleware = this.use || [];

  	// middleware must always be an array
  	if (! (middleware instanceof Array)) middleware = [middleware];

  	// last function in a middleware
  	// is the actual command
  	middleware.push(this.run);

  	let stack = middleware.map((fn, index) => {
  		// if middleware item is a string
  		// it is a function name
  		if (typeof fn === 'string') {
  			// check if function with this name
  			// exists in Command.prototype
  			// else, search in middleware/ dir
  			if (typeof command[fn] === 'function') {
  				fn = command[fn];
  			} else {
  			  let path = join(program.path, 'middleware', fn);
  				fn = require(path);
  			}
  		}

  		if (index === middleware.length - 1) {
  		  let bindArgs = Array.prototype.slice.call(args);
    		bindArgs.unshift(command);

    		fn = fn.bind.apply(fn, bindArgs);
  		  fn.displayName = 'run';
  		} else {
  		  fn = fn.bind(command);
  		}

  		return fn;
  	});

  	async.forEachSeries(stack, (fn, next) => {
  		if ('run' === fn.displayName) {
  			fn();
  			next();
  		} else {
  			fn(next);
  		}
  	});
  }
  
  static extend () {
    return Class.extend.apply(this, arguments);
  }
}


/**
 * Expose `Command`
 */

module.exports = Command;
