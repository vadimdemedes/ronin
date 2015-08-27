'use strict';

/**
 * Dependencies
 */

var buildOptions = require('minimist-options');
var minimist = require('minimist');
var format = require('util').format;
var result = require('get-result');
var Class = require('class-extend');
var table = require('text-table');
var async = require('async');
var help = require('generate-help');
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

  // strip command name
  var argv = process.argv.slice(2).join(' ').replace(this.name + ' ', '').split(' ');

  parseOptions = buildOptions(options);
  this.global = minimist(argv, parseOptions);

  // command options
  options = command.options;

  parseOptions = buildOptions(options);
  var args = this.options = minimist(argv, parseOptions);

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
