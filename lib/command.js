'use strict';

/**
 * Dependencies
 */


var buildOptions = require('minimist-options');
var minimist = require('minimist');
var format = require('util').format;
var Class = require('class-extend');
var table = require('text-table');
var async = require('async');
var is = require('is_js');
var os = require('os');

// path shortcuts
var join = require('path').join;

/**
 * Command
 */

function Command () {
  if (!this.options) this.options = {};
  if (!this.use) this.use = [];
  if (!this.desc) this.desc = '';

  this.configure();
}


Command.prototype.configure = function () {

};

Command.prototype.run = function () {

};


/**
 * Display help for a command
 *
 * @param {String} type
 * @api public
 */

Command.prototype.help = function help (type) {
  var self = this;

  if (type === 'compact') return this.desc;

  var help = '';

  help += 'Usage: ' + this.usage() + os.EOL + os.EOL;

  if (this.desc) {
    help += '  ' + this.desc + os.EOL + os.EOL;
  }

  // generate a list of sub-commands
  var names = Object.keys(this.program.commands).filter(function (name) {
    // add command to the list if
    // - it does not equal to itself
    // - it contains the name of a current command
    return name !== self.name && name.split(self.program.delimiter).indexOf(self.name) > -1;
  });

  // no sub-commands
  if (!names.length) return help;

  // sort commands alphabetically
  names.sort(function (a, b) {
    return a.localeCompare(b)
  });

  // get description for each command
  var commands = names.map(function (name) {
    var command = self.program._get(name);
    var desc = new command().help('compact');

    return [name, desc];
  });

  // output the list
  help += 'Additional commands:' + os.EOL + os.EOL;
  help += table(commands);

  return help;
};


/**
 * Return usage information for this command
 *
 * @api public
 */

Command.prototype.usage = function usage () {
  return format('%s %s [OPTIONS]', this.program.name, this.name);
};


/**
 * Parse arguments
 *
 * @api private
 */

Command.prototype._buildArgs = function _buildArgs () {
  var program = this.program;
  var command = this;

  // options for parser
  var parseOptions;

  // global options
  var options = program.options || {};

  parseOptions = buildOptions(options);
  this.global = minimist(process.argv, parseOptions);

  // command options
  options = command.options;

  parseOptions = buildOptions(options);
  var args = this.options = minimist(process.argv, parseOptions);

  // arguments for .run() method
  // need to build them in the same order
  // they were defined
  var handlerArgs = [];

  Object.keys(options).forEach(function (name) {
    var option = options[name];
    var value = args[name];

    if (option.required && !value) {
      throw new Error('No value provided for required argument `' + name + '`');
    }

    handlerArgs.push(args[name]);
  });

  // append arguments (don't confuse with options)
  handlerArgs.push.apply(handlerArgs, args._);

  return handlerArgs;
};


/**
 * Run command
 *
 * @api public
 */

Command.prototype.execute = function execute () {
  var program = this.program;
  var command = this;

  var args = this._buildArgs();

  var middleware = this.use || [];

  // middleware must always be an array
  if (is.not.array(middleware)) {
    middleware = [middleware];
  }

  // last function in a middleware
  // is the actual command
  middleware.push(this.run);

  var stack = middleware.map(function (fn, index) {
    // if middleware item is a string
    // it is a function name
    if (is.string(fn)) {
      // check if function with this name
      // exists in Command.prototype
      // else, search in middleware/ dir
      if (is.function(command[fn])) {
        fn = command[fn];
      } else {
        var path = join(program.path, 'middleware', fn);
        fn = require(path);
      }
    }

    if (index === middleware.length - 1) {
      var bindArgs = Array.prototype.slice.call(args);
      bindArgs.unshift(command);

      fn = fn.bind.apply(fn, bindArgs);
      fn.displayName = 'run';
    } else {
      fn = fn.bind(command);
    }

    return fn;
  });

  async.forEachSeries(stack, function (fn, next) {
    if ('run' === fn.displayName) {
      fn();
      next();
    } else {
      fn(next);
    }
  });
};


Command.extend = function extend () {
  return Class.extend.apply(this, arguments);
}


/**
 * Expose `Command`
 */

module.exports = Command;
