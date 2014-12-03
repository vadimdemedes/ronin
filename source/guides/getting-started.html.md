---
title: Getting Started
description: Learn how to get started with Ronin and build a CLI program
---

# Getting Started

After reading this guide you will know:

1. How to create a base for your program
2. Understand how Ronin generates your commands
3. Configure options for a command


### Installation

To install Ronin via npm, simply:

```bash
$ npm install --global ronin
```

> Notice ==-\\-global== option in that command. This option tells npm to install Ronin in a place, where it's accessible globally.

It will also install Yeoman, if you don't have it already, and Ronin's generators.

### Creating your first program

Now, let's build a theoretical todo list CLI application.
Ronin ships with a **ronin** command-line utility, that helps you get started in seconds.
To create a new program and configure it automatically, run:

```bash
$ ronin new todo
```

The output of this command should be like this:

![](http://cl.ly/image/3Y2E390k2r1q/embed)

It will create a folder named *todo* and put there all the required files to start.
Also, it will run *npm install* to install dependencies and *npm link* to make our *todo* program available globally.

If you will run *todo* now, you'll see that a program outputs help message and has a *hello* command by default:

![](http://cl.ly/image/132e0I2D3t11/embed)

Let's open *index.js* and change the description of our program:

```javascript
var ronin = require('ronin');

var program = ronin({
  path: __dirname,
  desc: 'Simple to-do application'
});

program.run();
```

If you will run *todo* again, you'll notice an updated description.
Next part, learning how Ronin generates your commands.

### Commands

As you probably remember from the homepage, Ronin generates commands based on your project structure.

> All commands should be placed in *commands* directory.

Our todo application should list all tasks, create new tasks and also remove them.
For Ronin to understand what commands we want, create such files inside *commands* directory:

```
- commands/
	- list.js
	- add.js
	- remove.js
```

And Ronin will know, that we want *list*, *add* and *remove* commands.
Let's fill in a required code for those commands.
Repeat the following code for all files:

```javascript
var Command = require('ronin').Command;

var List = Command.extend({
	desc: 'List all tasks',
	
	run: function () {
		
	}
});

module.exports = List;
```

Now, if you execute *todo*, you should see something like this:

![](http://cl.ly/image/2L3k0X0D3c10/embed)

> To generate command files automatically, use Ronin's CLI utility:
>
> ```bash
> $ ronin g command list add remove
> ```



### Command options

I guess 99% of command-line programs accept options to change their behavior.
In our example to-do application, options might come handy to prevent accidental removals of tasks. Let's implement *--force* option to confirm the removal.

```javascript
var Remove = Command.extend({
	desc: 'Removes a task',
	
	options: {
		force: 'boolean'
	},
	
	run: function (force, name) {
		if (!force) {
			throw new Error('--force should be set when removing a task!');
		}
		
		// it's ok, remove the task with given name
	}
});
```

All should be defined ==options== property.
Their values are passed to ==.run()== method first, before other arguments, **in the order they were defined**.

> There is a dedicated guide to options. [Read it](/guides/options) to discover all functionality for defining options.
