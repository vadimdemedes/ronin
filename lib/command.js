'use strict';

/**
 * Dependencies
 */

var buildOptions = require('minimist-options');
var minimist = require('minimist');
var format = require('util').format;
var Class = require('class-extend');
var async = require('async');
var help = require('generate-help');
var join = require('path').join;
var is = require('is_js');


/**
 * Expose `Command`
 */

module.exports = Command;


/**
 * Command
 */

function Command () {
  if (!this.options) {
    this.options = {};
  }

  if (!this.use) {
    this.use = [];
  }

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

Command.prototype._parseArgs = function _parseArgs () {
  var program = this.program;
  var command = this;

  // strip command name
  var argv = process.argv
    .slice(2)
    .join(' ')
    .replace(this.name + ' ', '')
    .split(' ');

  // parse global options
  var globalOptions = buildOptions(program.options);

  this.global = minimist(argv, globalOptions);

  // parse command options
  var options = this.options;
  var commandOptions = buildOptions(options);

  this.options = minimist(argv, commandOptions);

  // arguments for .run() method
  // need to build them in the same order
  // they were defined
  var handlerArgs = [];

  Object.keys(options).forEach(function (name) {
    var option = options[name];
    var value = command.options[name];

    if (option.required && !value) {
      throw new Error('No value provided for required argument `' + name + '`');
    }

    handlerArgs.push(command.options[name]);
  });

  // append arguments (don't confuse with options)
  handlerArgs.push.apply(handlerArgs, this.options._);

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

  var args = this._parseArgs();

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

    // if this is a last middleware
    // it is an actual command
    var isLastMiddleware = index === middleware.length - 1;

    if (isLastMiddleware) {
      // bind command's .run() method
      // with parsed arguments
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
    var isRunFunction = fn.displayName === 'run';

    // if this is a command's .run() function
    // don't require it to call next()
    if (isRunFunction) {
      fn();
      next();
    } else {
      fn(next);
    }
  });
};


/**
 * Allow extending using class-extend module
 */

Command.extend = function extend () {
  return Class.extend.apply(this, arguments);
}
