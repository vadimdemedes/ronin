"use strict";

var _toArray = function (arr) { return Array.isArray(arr) ? arr : Array.from(arr); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
 * Dependencies
 */

var minimist = require("minimist");
var semver = require("semver");
var spawn = require("child_process").spawn;
var chalk = require("chalk");
var table = require("text-table");
var glob = require("glob").sync;
var exec = require("child_process").exec;
var join = require("path").join;
var fs = require("fs");
var os = require("os");

// path shortcuts
var separator = require("path").sep;
var normalize = require("path").normalize;
var basename = require("path").basename;

// utilities
require("./util");

/**
 * Program
 */

var Program = (function () {
  function Program(options) {
    _classCallCheck(this, Program);

    this.name = basename(process.argv[1]);
    this.path = normalize(process.cwd());
    this.delimiter = " ";
    this.stdout = process.stdout;
    this.commands = {};

    // if options is a string
    // assume it's a path
    if ("string" === typeof options) this.path = options;

    // if it's an object
    // extend this with it
    if ("object" === typeof options) Object.assign(this, options);
  }

  /**
   * Set option
   *
   * @param {String,Object} key
   * @param {Mixed} value - value
   * @returns {Mixed}
   * @api public
   */
  Program.prototype.set = function set(key, value) {
    if ("object" === typeof key) {
      return Object.assign(this, key);
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
  Program.prototype.get = function get(key) {
    return this[key];
  };




  /**
   * Setup commands
   *
   * @api private
   */
  Program.prototype.setupCommands = function setupCommands() {
    var _this = this;
    if (!fs.existsSync(this.path)) return;

    var files = glob(join(this.path, "commands", "**", "*"));

    files.forEach(function (path) {
      path = path.replace(join(_this.path, "commands"), "").replace(separator, "");

      // include only .js files
      if (/\.js$/.test(path)) {
        var _name = path.split(separator).join(_this.delimiter).replace(".js", "");

        var command = require(join(_this.path, "commands", path));
        command.prototype.program = _this;
        command.prototype.name = _name;

        _this.commands[_name] = command;
      }
    });

    // calculate a maximum number
    // of delimiters in all command names
    var max = function (arr) {
      return Math.max.apply(Math, _toArray(arr));
    };

    this._level = max(Object.keys(this.commands).map(function (key) {
      return key.split(_this.delimiter).length;
    }));
  };




  /**
   * Run a program
   *
   * @api public
   */
  Program.prototype.run = function run() {
    var _this = this;
    // catch exceptions
    process.on("uncaughtException", function (err) {
      var nativeErrors = ["EvalError", "InternalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError"];

      // if the error is related to code
      // throw it
      // if not, assume that it was thrown on purpose
      if (nativeErrors.indexOf(err.name) > -1) {
        _this.stdout.write(err.stack + os.EOL);
      } else {
        _this.stdout.write("" + chalk.red("error") + "\t" + err.message + "" + os.EOL);
      }

      process.exit(1);
    });

    // search through ./commands folder
    // and register all commands
    this.setupCommands();

    // strip executable and path to a script
    var options = minimist(process.argv.slice(2));
    var argv = options._;

    // determine if it is a help command
    var isHelp = !argv.length || options.h || options.help;

    // remove node, path to a script
    // and command name from argv
    var end = this.delimiter === " " ? this._level : 1;

    process.argv.splice(0, 2 + end);

    var name = argv.splice(0, end).join(this.delimiter);
    var command = this.commands[name];

    if (isHelp) {
      var help = undefined;

      if (command) {
        help = new command().help();
      } else {
        help = this.help();
      }

      this.stdout.write(help + os.EOL);
    } else {
      this.invoke(command);
    }
  };




  /**
   * Auto-update a program
   *
   * @api public
   */
  Program.prototype.autoupdate = function autoupdate(done) {
    var pkg = require(join(this.path, "package.json"));

    var name = pkg.name;
    var version = pkg.version;

    // file in OS tmp directory
    // to keep track when autoupdate
    // was last executed
    var tmpPath = join(os.tmpdir(), name);

    try {
      // get mtime of tracking file
      var stat = fs.statSync(tmpPath);

      // if file was touched earlier
      // than a day ago
      // update its mtime and autoupdate
      // else just run the program
      if (new Date() - stat.mtime > 60 * 60 * 24 * 1000) {
        fs.writeFileSync(tmpPath, "", "utf-8");
      } else {
        return done();
      }
    } catch (e) {
      // no file was created, need to create
      fs.writeFileSync(tmpPath, "", "utf-8");
    }

    // get the latest version of itself
    exec("npm info " + name + " version", function (err, latestVersion) {
      // compare using semver
      var updateAvailable = semver.gt(latestVersion, version);

      if (!updateAvailable) return done();

      exec("npm install -g " + name, function () {
        // execute the same command
        // but on the updated program
        spawn("node", process.argv.slice(1), { stdio: "inherit" });
      });
    });
  };




  /**
   * Show help
   *
   * @param {String} command
   * @api public
   */
  Program.prototype.help = function help() {
    var _this = this;
    var help = "";

    help += "Usage: " + this.name + " COMMAND [OPTIONS]" + (os.EOL + os.EOL);

    if (this.desc) {
      help += "  " + this.desc + "" + (os.EOL + os.EOL);
    }

    // build a list of program's top commands
    var names = Object.keys(this.commands).filter(function (name) {
      var parts = name.split(_this.delimiter);

      // determine if parent command exists
      // e.g. `apps` in case of `apps add`
      var parent = parts.length > 1 && parts[parts.length - 2];
      var parentExists = parent && _this.commands[parent];

      // include command if it does not have a parent
      return !parentExists || parts.length < _this._level;
    });

    // program does not have commands
    if (!names.length) return;

    // sort commands alphabetically
    names.sort(function (a, b) {
      return a.localeCompare(b);
    });

    // get description for each command
    var commands = names.map(function (name) {
      var desc = new _this.commands[name]().help("compact");

      return [name, desc];
    });

    // output a list of commands
    help += "Available commands:" + (os.EOL + os.EOL);
    help += table(commands);

    return help;
  };




  /**
   * Execute command
   *
   * @param {String} command
   * @api public
   */
  Program.prototype.invoke = function invoke(command) {
    if (typeof command === "string") command = this.commands[command];

    new command().execute();
  };

  return Program;
})();




/**
 * Expose `Program`
 */

module.exports = Program;