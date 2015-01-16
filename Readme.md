# Ronin

Toolkit for building shining CLI programs in Node.js.

[![Circle CI](https://circleci.com/gh/vdemedes/ronin.svg?style=svg)](https://circleci.com/gh/vdemedes/ronin)

## Features

- *Forced & clean* organization of program code
- Command name generation based on folder structure
- CLI tool to quickly create program skeleton and commands
- Auto-generated usage and help
- Small codebase (269 sloc)
- **Program auto-updates itself when new version is available**

## Installation

```
npm install ronin --global
```

## Getting Started

### Creating basic structure

Execute the following command to generate basic skeleton for your program:

```
ronin new hello-world
```

Ronin will create a hello-world directory (if it does not exists or empty) and put everything that's needed to start developing your CLI tool immediately:

![Output](http://cl.ly/image/3p1R160V2Z2W/embed)

### Initialization

Here's how to initialize CLI program using Ronin:

```javascript
var ronin = require('ronin');

var program = ronin(__dirname); // root path, where commands folder is

program.run();
```

### Creating commands

Next, to setup some commends, simply create folders and files.
The structure you create, will be reflected in your program.
For example, if you create such folders and files:

```
commands/
--  apps.js
--  apps/
    -- add.js
    -- remove.js
--  keys/
    -- dump.js
```

In result, Ronin, will generate these commands for you automatically:

```
$ hello-world apps
$ hello-world apps add
$ hello-world apps remove
$ hello-world keys dump
```

Each folder is treated like a namespace and each file like a command, where file name is command name.

To actually create handlers for those commands, in each file, Command should be defined:

```javascript
var Command = require('ronin').Command;

var AppsAddCommand = module.exports = Command.extend({
    desc: 'This command adds application',
    
    run: function (name) {
        // create an app with name given in arguments
    }
});
```

To run this command, execute:

```
$ hello-world apps add great-app
```

Whatever arguments passed to command after command name, will be passed to .run() method in the same order they were written.

#### Specifying options

You can specify options and their properties using *options* object.

```javascript
var AppsDestroyCommand = module.exports = Command.extend({
    desc: 'This command removes application',
    
    options: {
        name: 'string',
        force: {
            type: 'boolean',
            alias: 'f'
        }
    },
    
    run: function (name, force) {
        if (!force) {
            throw new Error('--force option is required to remove application');
        }
        
        // remove app
    }
});
```

**Note**: Options will be passed to .run() method in the same order they were defined.

#### Customizing help

By default, Ronin generates help for each command and for whole program automatically.
If you wish to customize the output, override .help() method in your command (program help can not be customized at the moment):

```javascript
var HelloCommand = Command.extend({
    help: function () {
        return 'Usage: ' + this.programName + ' ' + this.name + ' [OPTIONS]';
    },
    
    desc: 'Hello world'
});
```

#### Customizing command delimiter

By default, Ronin separates sub-commands with a space.
If you want to change that delimiter, just specify this option when initializing Ronin:

```javascript
var program = ronin();

program.set({
    path: __dirname,
    delimiter: ':'
});

program.run();
```

After that, `apps create` command will become `apps:create`.


### Middleware

There are often requirements to perform the same operations/checks for many commands.
For example, user authentication.
In order to avoid code repetition, Ronin implements middleware concept.
Middleware is just a function, that accepts the same arguments as .run() function + callback function.
Middleware functions can be asynchronous, it makes no difference for Ronin.

Let's take a look at this example:

```javascript
var UsersAddCommand = Command.extend({
    use: ['auth', 'beforeRun'],
    
    run: function (name) {
        // actual users add command
    },
    
    beforeRun: function (name, next) {
        // will execute before .run()
        
        // MUST call next() when done
        next();
    }
});
```

In this example, we've got 2 middleware functions: auth and beforeRun.
Ronin allows you to write middleware functions inside commands or inside `root/middleware` directory.
So in this example, Ronin will detect that `beforeRun` function is defined inside a command and `auth` function will be `require`d from `root/middleware/auth.js` file.

**Note**: To interrupt the whole program and stop execution, just throw an error.


### Auto-updating

To make your program auto-update itself, only 1 line of code needed.
Go to your program's index file and replace `program.run()` with this:

```javascript
program.autoupdate(function () {
  program.run();
});
```

From now on, your program will check for updates once a day and if new update is available, it will automatically install it.
**How cool is this?**

## Tests

```
npm test
```

## License

Ronin is released under the MIT License.
