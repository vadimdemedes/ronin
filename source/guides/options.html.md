---
title: Options
description: Defining options. Configure liases, global options, default values.
---

# Options

After reading this guide you will know:

1. How to define options in multiple ways
2. Configure aliases and default values
3. Set up global options


### Defining options

Let's take a look on a full example on how to define options for imaginary *apps create* command:

```javascript
var CreateApplication = Command.extend({
	desc: 'Create application',
	
	options: {
		region: {
			type: 'string',
			aliases: ['r', 'reg'],
			default: 'london'
		},
		
		size: {
			alias: 's',
			default: 512
		}
	},
	
	run: function (region, size, name) {
		// create app with supplied options
	}
});
```

All options should be defined in ==options== property.
For each option object, you can specify these properties:

- **type** - value type, can be *string* or *boolean* (integers and floats are parsed automatically)
- **alias** - alias for an option, can be *string* or *array* of strings
- **aliases** - same as **alias**, exists for convenience
- **default** - default value for an option, in case it was not specified

There's also a shorthand API for defining options.

```javascript
options: {
	region: {
		type: 'string'
	},
	force: {
		type: 'boolean'
	}
}
```

equals to:

```javascript
options: {
	region: 'string',
	force: 'boolean'
}
```

If option's property value is a String, Ronin understands it as a value type of an option, as if it was defined using **type**.

> Option values are passed to the ==.run()== method **in the order they were defined**


### Global options

There are cases when global options are required, options that can be consumed by each command in your program. Global options are defined in *index.js*, where you initialize your program. The API for defining global options is exactly the same as for local options.

```javascript
var ronin = require('ronin');

var program = ronin({
	path: __dirname,
	desc: 'Simple to-do application',
	options: {
		user: {
			type: 'string',
			alias: 'u',
			default: 'me'
		}
	}
});

program.run();
```

To get the value of a global option, use ==this.global== property inside *.run()* method:

```
var RemoveTask = Command.extend({
	desc: 'Removes task',
	
	run: function (name) {
		// value of --user, -u global option
		var user = this.global.user;
	}
});
```