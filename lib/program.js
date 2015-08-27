'use strict';

/**
 * Dependencies
 */

var buildOptions = require('minimist-options');
var minimist = require('minimist');
var flatten = require('lodash.flatten');
var listDir = require('list-dir').sync;
var assign = require('object-assign');
var result = require('get-result');
var semver = require('semver');
var spawn = require('child_process').spawn;
var chalk = require('chalk');
var table = require('text-table');
var help = require('generate-help');
var glob = require('glob').sync;
var exec = require('child_process').exec;
var path = require('path');
var set = require('set-value');
var get = require('get-value');
var is = require('is_js');
var fs = require('fs');
var os = require('os');

// fs shortcuts
var readdir = fs.readdirSync;
var stat = fs.statSync;

// path shortcuts
var separator = path.sep;
var normalize = path.normalize;
var basename = path.basename;
var join = path.join;


/**
 * Program
 */

function Program (params) {
  if (!params) {
    params = {};
  }

  this.name = params.name || basename(process.argv[1]);
  this.path = params.path || normalize(process.cwd());
  this.desc = params.desc;
  this.delimiter = params.delimiter || ' ';
  this.stdout = process.stdout;
  this.commands = {};
  this.options = {
    help: {
      alias: 'h',
      desc: 'Display help'
    }
  };

  // if params is a string
  // assume it's a path
  if (is.string(params)) {
    this.path = params;
  }

  // extend built-in options
  if (is.object(params.options)) {
    assign(this.options, params.options);
  }
}


/**
 * Set option
 *
 * @param {String,Object} key
 * @param {Mixed} value - value
 * @returns {Mixed}
 * @api public
 */

Program.prototype.set = function set (key, value) {
  if (is.object(key)) {
    return assign(this, key);
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

Program.prototype.get = function get (key) {
  return this[key];
};


/**
 * Setup commands
 *
 * @api private
 */

Program.prototype.setupCommands = function setupCommands () {
  if (!fs.existsSync(this.path)) {
    return;
  }

  var path = join(this.path, 'commands');

  var files = listDir(path);

  var self = this;

  files.forEach(function (file) {
    var name = basename(file, '.js');

    var parts = file.split(separator);
    parts.pop();

    if (name !== 'index') {
      parts.push(name);
    }

    var Command = require(join(path, file));
    Command.prototype.name = parts.join(self.delimiter);

    var key = parts.join('.');

    set(self.commands, key, assign(get(self.commands, key) || {}, {
      class: Command
    }));
  });
};


/**
 * Run a program
 *
 * @api public
 */

Program.prototype.run = function run () {
  var self = this;

  // catch exceptions
  process.on('uncaughtException', function (err) {
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
    // if not, assume that it was thrown on purpose
    if (nativeErrors.indexOf(err.name) > -1) {
      self.stdout.write(err.stack + os.EOL);
    } else {
      self.stdout.write(chalk.red('error') + '\t' + err.message + os.EOL);
    }

    process.exit(1);
  });

  // search through ./commands folder
  // and register all commands
  this.setupCommands();

  // strip executable and path to a script
  var argv = process.argv.slice(2);

  // parse arguments
  var options = minimist(argv, buildOptions(this.options));

  if ((options.help && !options._.length) || !options._.length) {
    this.stdout.write(this.help());
    return;
  }

  if (this.delimiter !== ' ') {
    if (options._.length > 0) {
      var firstArg = options._[0];

      options._.shift();

      firstArg.split(this.delimiter).forEach(function (arg) {
        options._.unshift(arg);
      });
    }
  }

  var index = options._.length - 1;
  var Command;

  while (index-- >= 0) {
    var name = options._.slice(0, index + 2);

    Command = (get(this.commands, name.join('.')) || {}).class;

    if (Command) {
      break;
    }
  }

  if (Command) {
    if (options.help) {
      this.stdout.write(this.help(Command));
    } else {
      this.invoke(Command);
    }
  }
};


/**
 * Auto-update a program
 *
 * @api public
 */

Program.prototype.autoupdate = function autoupdate (done) {
  var pkg = require(join(this.path, 'package.json'));

  var name = pkg.name;
  var version = pkg.version;

  // file in OS tmp directory
  // to keep track when autoupdate
  // was last executed
  var tmpPath = join(os.tmpdir(), name);

  var shouldCheck = true;

  try {
    // get mtime of tracking file
    var stat = fs.statSync(tmpPath);

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
  exec('npm info ' + name + ' version', function (err, latestVersion) {
    // compare using semver
    var updateAvailable = err || !latestVersion ? false : semver.gt(latestVersion, version);

    if (!updateAvailable) return done();

    exec('npm install -g ' + name, function () {
      // execute the same command
      // but on the updated program
      spawn('node', process.argv.slice(1), { stdio: 'inherit' });
    });
  });
};


/**
 * Show help
 *
 * @param {Object} command
 * @api public
 */

Program.prototype.help = function (Command) {
  var self = this;

  var root;

  if (Command) {
    var instance = new Command();

    root = get(this.commands, instance.name.split(this.delimiter).join('.'));
  } else {
    root = this.commands;
  }

  var commands = commandsList(root).map(function (name) {
    var Command = get(root, name).class;

    var command = new Command();

    return {
      name: command.name,
      desc: result(command, 'desc')
    };
  });

  var usage = this.name + ' [options] <command>';
  var desc = result(this, 'desc');
  var options = this.options;

  if (Command) {
    var instance = new Command();

    usage = result(instance, 'usage');
    desc = result(instance, 'desc');
    options = instance.options;
  }

  var params = {
    usage: usage,
    desc: desc,
    options: options,
    commands: commands
  };

  return help(params);
};

function commandsList (commands) {
  var list = [];

  Object.keys(commands).forEach(function (name) {
    var entry = commands[name];

    if (entry.class) {
      list.push(name);
    } else {
      Object.keys(entry).forEach(function (subName) {
        var subEntry = entry[subName];

        if (subEntry.class) {
          list.push(name + '.' + subName);
        }
      });
    }
  });

  return list;
}


/**
 * Execute command
 *
 * @param {String} command
 * @api public
 */

Program.prototype.invoke = function invoke (Command) {
  if (is.string(Command)) {
    Command = this._get(Command);
  }

  var command = new Command();
  command.program = this;
  command.execute();
};


/**
 * Expose `Program`
 */

module.exports = Program;
