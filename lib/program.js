'use strict';

/**
 * Dependencies
 */

var updateNotifier = require('update-notifier');
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
var exec = require('child_process').execFile;
var path = require('path');
var set = require('set-value');
var get = require('get-value');
var is = require('is_js');
var fs = require('fs');
var os = require('os');

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

  // set path to program root
  var path = params.path || params;

  if (is.not.string(path)) {
    throw new Error('Ronin requires `path` option to be set.');
  }

  this.path = path;

  // program name
  this.name = params.name || basename(process.argv[1]);

  // program description
  this.desc = params.desc;

  // command delimiter
  this.delimiter = params.delimiter || ' ';

  // where to write output
  this.stdout = process.stdout;

  // commands store
  this.commands = {};

  // global program options
  this.options = {
    help: {
      alias: 'h',
      desc: 'Display help'
    }
  };

  // extend built-in options
  if (is.object(params.options)) {
    assign(this.options, params.options);
  }

  // load package.json
  var pkgPath = join(path, 'package.json');

  this.pkg = require(pkgPath);
}


/**
 * Setup commands
 *
 * @api private
 */

Program.prototype.setupCommands = function setupCommands () {
  var path = join(this.path, 'commands');
  var files = listDir(path);

  var program = this;

  files.forEach(function (file) {
    var name = basename(file, '.js');

    // if the command is "index" (root command)
    // save it to this.commands/[name]
    var parts = file.split(separator);
    parts.pop();

    if (name !== 'index') {
      parts.push(name);
    }

    // assign command its name
    var commandPath = join(path, file);

    var Command = require(commandPath);
    Command.prototype.name = parts.join(program.delimiter);

    // path to save command to
    // e.g. apps.list
    var key = parts.join('.');

    // save command
    // preserve previous content
    var currentValue = get(program.commands, key) || {};

    var value = assign(currentValue, {
      class: Command
    });

    set(program.commands, key, value);
  });
};


/**
 * Run a program
 *
 * @api public
 */

Program.prototype.run = function run () {
  var self = this;

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

Program.prototype.autoupdate = function autoupdate () {
  var notifier = updateNotifier({
    pkg: this.pkg
  });

  if (notifier.update) {
    var args = [
      'install',
      '--global',
      this.pkg.name
    ];

    exec('npm', args, noop).unref();
  }
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
 * Utils
 */

function noop () {}


/**
 * Expose `Program`
 */

module.exports = Program;
