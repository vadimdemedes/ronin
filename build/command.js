"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
 * Dependencies
 */

var Class = require("class-extend");

var minimist = require("minimist");
var table = require("text-table");
var async = require("async");
var os = require("os");

// path shortcuts
var join = require("path").join;

/**
 * Command
 */

var Command = (function () {
  function Command() {
    _classCallCheck(this, Command);

    if (!this.options) this.options = {};
    if (!this.use) this.use = [];
    if (!this.desc) this.desc = "";

    this.configure();
  }

  Command.prototype.configure = function configure() {};

  Command.prototype.run = function run() {};




  /**
   * Display help for a command
   *
   * @param {String} type
   * @api public
   */
  Command.prototype.help = function help(type) {
    var _this = this;
    if (type === "compact") {
      return this.desc;
    }var help = "";

    help += "Usage: " + this.usage() + "" + (os.EOL + os.EOL);

    if (this.desc) {
      help += "  " + this.desc + "" + (os.EOL + os.EOL);
    }

    // generate a list of sub-commands
    var names = Object.keys(this.program.commands).filter(function (name) {
      // add command to the list if
      // - it does not equal to itself
      // - it contains the name of a current command
      return name !== _this.name && name.split(_this.program.delimiter).indexOf(_this.name) > -1;
    });

    // no sub-commands
    if (!names.length) {
      return help;
    } // sort commands alphabetically
    names.sort(function (a, b) {
      return a.localeCompare(b);
    });

    // get description for each command
    var commands = names.map(function (name) {
      var command = _this.program._get(name);
      var desc = new command().help("compact");

      return [name, desc];
    });

    // output the list
    help += "Additional commands:" + (os.EOL + os.EOL);
    help += table(commands);

    return help;
  };




  /**
   * Return usage information for this command
   *
   * @api public
   */
  Command.prototype.usage = function usage() {
    return "" + this.program.name + " " + this.name + " [OPTIONS]";
  };




  /**
   * Build options for minimist
   *
   * @api private
   */
  Command.prototype._buildOptions = function _buildOptions(options) {
    // options for minimist
    var parseOptions = {
      string: [],
      boolean: [],
      alias: {},
      "default": {}
    };

    // convert command options
    // into options for minimist
    Object.keys(options).forEach(function (name) {
      var option = options[name];

      // option can be a string
      // assume it's a type
      if (option === "string") {
        option = {
          type: option
        };
      }

      if (option.type === "string") {
        parseOptions.string.push(name);
      }

      if (option.type === "boolean") {
        parseOptions.boolean.push(name);
      }

      // "aliases" or "alias" property
      // can be string or array
      // need to always convert to array
      var aliases = option.aliases || option.alias || [];
      if (typeof aliases === "string") aliases = [aliases];

      aliases.forEach(function (alias) {
        return parseOptions.alias[alias] = name;
      });

      if (option["default"]) {
        parseOptions["default"][name] = option["default"];
      }
    });

    return parseOptions;
  };




  /**
   * Parse arguments
   *
   * @api private
   */
  Command.prototype._buildArgs = function _buildArgs() {
    var program = this.program;
    var command = this;

    // options for parser
    var parseOptions = undefined;

    // global options
    var options = program.options || {};

    parseOptions = this._buildOptions(options);
    this.global = minimist(process.argv, parseOptions);

    // command options
    options = command.options;

    parseOptions = this._buildOptions(options);
    var args = this.options = minimist(process.argv, parseOptions);

    // arguments for .run() method
    // need to build them in the same order
    // they were defined
    var handlerArgs = [];

    Object.keys(options).forEach(function (name) {
      var option = options[name];
      var value = args[name];

      if (option.required && !value) {
        throw new Error("No value provided for required argument '" + name + "'");
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
  Command.prototype.execute = function execute() {
    var program = this.program;
    var command = this;

    var args = this._buildArgs();

    var middleware = this.use || [];

    // middleware must always be an array
    if (!(middleware instanceof Array)) middleware = [middleware];

    // last function in a middleware
    // is the actual command
    middleware.push(this.run);

    var stack = middleware.map(function (fn, index) {
      // if middleware item is a string
      // it is a function name
      if (typeof fn === "string") {
        // check if function with this name
        // exists in Command.prototype
        // else, search in middleware/ dir
        if (typeof command[fn] === "function") {
          fn = command[fn];
        } else {
          var path = join(program.path, "middleware", fn);
          fn = require(path);
        }
      }

      if (index === middleware.length - 1) {
        var bindArgs = Array.prototype.slice.call(args);
        bindArgs.unshift(command);

        fn = fn.bind.apply(fn, bindArgs);
        fn.displayName = "run";
      } else {
        fn = fn.bind(command);
      }

      return fn;
    });

    async.forEachSeries(stack, function (fn, next) {
      if ("run" === fn.displayName) {
        fn();
        next();
      } else {
        fn(next);
      }
    });
  };

  Command.extend = function extend() {
    return Class.extend.apply(this, arguments);
  };

  return Command;
})();




/**
 * Expose `Command`
 */

module.exports = Command;
