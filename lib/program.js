/**
 * Dependencies
 */

var minimist = require('minimist');
var flatten = require('lodash.flatten');
var semver = require('semver');
var spawn = require('child_process').spawn;
var chalk = require('chalk');
var table = require('text-table');
var glob = require('glob').sync;
var exec = require('child_process').exec;
var join = require('path').join;
var fs = require('fs');
var os = require('os');

// path shortcuts
var separator = require('path').sep;
var normalize = require('path').normalize;
var basename = require('path').basename;

// utilities
require('./util');

/**
 * Program
 */
 
class Program {
  constructor (options) {
    this.name = basename(process.argv[1]);
  	this.path = normalize(process.cwd());
  	this.delimiter = ' ';
  	this.stdout = process.stdout;
  	this.commands = {};

  	// if options is a string
  	// assume it's a path
  	if ('string' === typeof options) this.path = options;

  	// if it's an object
  	// extend this with it
  	if ('object' === typeof options) Object.assign(this, options);
  }
  
  /**
   * Set option
   *
   * @param {String,Object} key
   * @param {Mixed} value - value
   * @returns {Mixed}
   * @api public
   */
  set (key, value) {
    if ('object' === typeof key) {
  		return Object.assign(this, key);
  	}

  	return this[key] = value;
  }
  
  
  /**
   * Get option
   *
   * @param {String} key
   * @returns {Mixed}
   * @api public
   */
  get (key) {
    return this[key];
  }
  
  
  /**
   * Setup commands
   *
   * @api private
   */
  setupCommands () {
    if (!fs.existsSync(this.path)) return;

    let files = glob(join(this.path, 'commands', '**', '*'));
    
    files.forEach(path => {
      path = path.replace(join(this.path, 'commands'), '')
                 .replace(separator, '');
      
      // include only .js files
      if (/\.js$/.test(path)) {
        let name = path.split(separator)
                       .join(this.delimiter)
                       .replace('.js', '');
        
        this.commands[name] = join(this.path, 'commands', path);
      }
    });
  }
  
  
  /**
   * Run a program
   *
   * @api public
   */
  run () {
    // catch exceptions
    process.on('uncaughtException', err => {
      let nativeErrors = [
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
  		// if not, assume that it was thrown on purpose
  		if (nativeErrors.indexOf(err.name) > -1) {
  		  this.stdout.write(err.stack + os.EOL);
  		} else {
  		  this.stdout.write(chalk.red('error') + '\t' + err.message + os.EOL);
  		}
  		
  		process.exit(1);
    });
    
    // search through ./commands folder
    // and register all commands
   	this.setupCommands();

   	// strip executable and path to a script
   	process.argv.splice(0, 2);
   	
   	// parse arguments
   	let options = minimist(process.argv);
   	let argv = options._;
   	
   	if (this.delimiter !== ' ') {
   	  argv = argv.map(arg => arg.split(this.delimiter));
   	  argv = flatten(argv);
   	}

   	// determine if it is a help command
   	let isHelp = !argv.length || options.h || options.help;

    // find matching command
    let names = Object.keys(this.commands);
    
    let matches = names.filter(name => {
      let isValid = true;
      
      name.split(this.delimiter).forEach((part, i) => {
        if (part !== argv[i]) isValid = false;
      });
      
      return isValid;
    });

   	let name = matches.reverse()[0] || '';
   	let command = this._get(name);
   	
   	// strip command name from arguments
   	let delimiters = this.delimiter === ' ' ? name.split(this.delimiter).length : 1;
   	
   	process.argv.splice(0, delimiters);
   	
   	// execute
   	if (isHelp) {
   	  let help;

   	  if (command) {
   	    help = new command().help();
   	  } else {
   	    help = this.help();
   	  }

   	  this.stdout.write(help + os.EOL);
   	} else {
   	  this.invoke(command);
   	}
  }
  
  
  /**
   * Lazy load command
   *
   * @api private
   */
  _get (name) {
    let path = this.commands[name];
    
    // if value is not string (not path)
    // then this command was already require()'ed
    if (typeof path !== 'string') return path;
    
    let command = require(path);
    
    // create a bridge between command
    // and a program
    command.prototype.program = this;
    
    // and tell it what is its name
    command.prototype.name = name;
    
    // save to prevent the same work ^
    this.commands[name] = command;
    
    return command;
  }
  
  
  /**
   * Auto-update a program
   *
   * @api public
   */
  autoupdate (done) {
    let pkg = require(join(this.path, 'package.json'));

    let name = pkg.name;
    let version = pkg.version;

    // file in OS tmp directory
    // to keep track when autoupdate
    // was last executed
    let tmpPath = join(os.tmpdir(), name);
    
    let shouldCheck = true;

    try {
      // get mtime of tracking file
      let stat = fs.statSync(tmpPath);

      // if file was touched earlier
      // than a day ago
      // update its mtime and autoupdate
      // else just run the program
      if (new Date - stat.mtime > 60 * 60 * 24 * 1000) {
        fs.writeFileSync(tmpPath, '', 'utf-8');
      } else {
        shouldCheck = false;
      }
    } catch (e) {
      // no file was created, need to create
      fs.writeFileSync(tmpPath, '', 'utf-8');
    }
    
    if (!shouldCheck) return done();

    // get the latest version of itself
    exec('npm info ' + name + ' version', (err, latestVersion) => {
      // compare using semver
      let updateAvailable = err || !latestVersion ? false : semver.gt(latestVersion, version);

      if (!updateAvailable) return done();

      exec('npm install -g ' + name, () => {
        // execute the same command
        // but on the updated program
        spawn('node', process.argv.slice(1), { stdio: 'inherit' });
      });
    });
  }
  
  
  /**
   * Show help
   *
   * @param {String} command
   * @api public
   */
  help () {
    // calculate a maximum number
    // of delimiters in all command names
    const max = arr => Math.max(...arr);
    
    let delimiters = max(Object.keys(this.commands).map(key => key.split(this.delimiter).length));
    
    // build help output
    let help = '';
    
    help += `Usage: ${ this.name } COMMAND [OPTIONS]${ os.EOL + os.EOL }`;

    if (this.desc) {
      help += `  ${ this.desc }${ os.EOL + os.EOL }`;
    }
    
    // build a list of program's top commands
    let names = Object.keys(this.commands).filter(name => {
      let parts = name.split(this.delimiter);
      
      // determine if parent command exists
      // e.g. `apps` in case of `apps add`
      let parent = parts.length > 1 && parts[parts.length - 2];
      let parentExists = parent && this.commands[parent];
      
      // include command if it does not have a parent
      return !parentExists || parts.length < delimiters;
    });

    // program does not have commands
    if (!names.length) return;

    // sort commands alphabetically
    names.sort((a, b) => a.localeCompare(b));
    
    // get description for each command
    let commands = names.map(name => {
      let command = this._get(name);
      let desc = new command().help('compact');
      
      return [name, desc];
    });
    
    // output a list of commands
    help += `Available commands:${ os.EOL + os.EOL }`;
    help += table(commands);

    return help;
  }
  
  
  /**
   * Execute command
   *
   * @param {String} command
   * @api public
   */
  invoke (command) {
    if (typeof command === 'string') command = this._get(command);

    new command().execute();
  }
}


/**
 * Expose `Program`
 */

module.exports = Program;
