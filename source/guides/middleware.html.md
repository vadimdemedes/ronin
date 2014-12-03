---
title: Middleware
description: Use middleware for validation, authentication and other common functionality between commands.
---

# Middleware

After reading this guide you will know:

1. How to use middleware in Ronin programs
2. Abort the process and emit an error


### Configuring middleware

Middleware is a function that gets executed before command's *.run()* method.
You can insert multiple middleware functions.
Each function is invoked with a callback, that should be called when the work is done.
All middleware functions should be defined **separately** in *middleware/* directory of the project. For example:

```bash
- index.js
- commands/
- middleware/
	- auth.js
	- check.js
```

And each file in *middleware/* directory looks like that:

```javascript
module.exports = function middlewareName (next) {
	// do some work
	
	next();
};
```

### Aborting the process

If middleware determined that the process should shutdown, then it should just throw an error and its message will be displayed in the console:

```javascript
module.exports = function auth (next) {
	throw new Error('Authentication failed!');
}
```