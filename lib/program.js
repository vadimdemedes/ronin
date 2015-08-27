'use strict';

/**
 * Dependencies
 */

var updateNotifier = require('update-notifier');
var pathSeparator = require('path').sep;
var buildOptions = require('minimist-options');
var minimist = require('minimist');
var basename = require('path').basename;
var listDir = require('list-dir').sync;
var assign = require('object-assign');
var result = require('get-result');
var help = require('generate-help');
var exec = require('child_process').execFile;
var join = require('path').join;
var set = require('set-value');
var get = require('get-value');
var is = require('is_js');
var fs = require('fs');


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
    var parts = file.split(pathSeparator);
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
  // search through ./commands folder
  // and register all commands
  this.setupCommands();

  // strip executable and path to a script
  var argv = process.argv.slice(2);

  // parse arguments
  var options = minimist(argv, buildOptions(this.options));

  // command args
  var args = options._;

  // display program help, if:
  //  1. -h, --help flag is set
  //  2. no arguments
  if (args.length === 0) {
    this.stdout.write(this.help());
    return;
  }

  // if delimiter is not " " (space)
  // convert command name to a space-based name
  if (this.delimiter !== ' ') {
    if (args.length > 0) {
      // assume, that command name is
      // a first argument
      var firstArg = args[0];

      args.shift();

      firstArg.split(this.delimiter).forEach(function (arg) {
        args.unshift(arg);
      });
    }
  }

  // try to detect command name
  var index = args.length - 1;
  var Command;

  // get all non-flag arguments
  // and go from right to left
  // and check if there's a command with that name
  //
  // e.g. argv = apps create hello
  // 1. try apps.create.hello
  // 2. try apps.create
  // 3. try apps
  while (index-- >= 0) {
    var name = args.slice(0, index + 2);
    var key = name.join('.');

    var entry = get(this.commands, key) || {};
    var Command = entry.class;

    // command found, stop
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

  // TODO: command not found message
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
  // root point to search commands from
  var root = this.commands;

  if (Command) {
    // get command's name
    var instance = new Command();
    var key = instance.name.split(this.delimiter).join('.');

    root = get(this.commands, key);
  }

  // list sub-commands for a given command
  var commands = commandsList(root).map(function (name) {
    var Command = get(root, name).class;

    var command = new Command();

    return {
      name: command.name,
      desc: result(command, 'desc')
    };
  });

  // default params for program help
  var usage = this.name + ' [options] <command>';
  var desc = result(this, 'desc');
  var options = this.options;

  // if a command was given, override
  // usage, description and options
  // with command's own ones
  if (Command) {
    var instance = new Command();

    usage = result(instance, 'usage');
    desc = result(instance, 'desc');
    options = instance.options;
  }

  // generate help
  var params = {
    usage: usage,
    desc: desc,
    options: options,
    commands: commands
  };

  return help(params);
};


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
 * Helpers
 */

/**
 * Build a sub-command list
 *
 * @param  {Object} commands
 * @return {Array}
 */

function commandsList (commands) {
  var list = [];

  Object.keys(commands).forEach(function (name) {
    var entry = commands[name];

    var isCommand = !!entry.class;

    if (isCommand) {
      list.push(name);
    }

    // if entry is not a command
    // assume it has sub-commands
    // so, add those to the result list
    if (!isCommand) {
      Object.keys(entry).forEach(function (subName) {
        var subEntry = entry[subName];

        var isCommand = !!subEntry.class;

        if (isCommand) {
          list.push(name + '.' + subName);
        }
      });
    }
  });

  return list;
}

function noop () {}


/**
 * Expose `Program`
 */

module.exports = Program;
