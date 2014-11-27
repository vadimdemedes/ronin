# Ronin

Toolkit for building shining CLI programs in Node.js.

## Features

- *Forced clean* organization of program code
- Command name generation based on folder structure
- CLI tool to quickly create program skeleton and commands
- Auto-generated usage and help
- Small codebase (269 sloc)

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

![Output](http://cl.ly/image/3u1T073h2v1o/embed)

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

```
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

**Bonus**: There's a quicker way to create commands:

```
$ ronin generate command apps/add
```

#### Specifying options

You can specify options and their properties directly, using *options* object or .option() method. Their result is identical.

```
var AppsDestroyCommand = module.exports = Command.extend({
    desc: 'This command removes application',
    
    options: {
        name: 'string'
    },
    
    configure: function () {
        this.option('force', {
            type: 'boolean',
            alias: 'f'
        });
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
var program = ronin({
    rootPath: __dirname,
    delimiter: ':'
});
```

After that, `apps create` command will become `apps:create`.

## License

The MIT License (MIT) Copyright © 2014 Vadim Demedes vdemedes@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.