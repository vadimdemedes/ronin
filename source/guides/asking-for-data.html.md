---
title: Asking user for data
description: See how you can ask for data, passwords and display menu of choices.
---

# Asking for data

After reading this guide you will know how to:

1. Ask user for data
2. Prompt for passwords
3. Display menu of choices


### Asking simple questions

To gather input from the user we are going to use [asking](https://github.com/vdemedes/asking) package, because it's simple and is not bloated with unneeded features. It is inspired by highly popular [highline](https://github.com/JEG2/highline) ruby gem. Let's go ahead and install it:

```
$ npm install asking --save
```

Asking package exposes only 2 functions: *ask* and *choose*. Simple as that. *ask* method is for entering data manually and *choose* method is for selecting one of the possible answers. To get started with *asking*:

```javascript
var choose = require('asking').choose;
var ask = require('asking').ask;
```

To ask user a question:

```javascript
ask('What is your favourite color?', function (err, color) {
	// color variable contains the answer
});
```

*ask* also supports default values and input validation:

```javascript
ask('What is your favourite color?', { default: 'green' }, function (err, color) {
	// color defaults to "green"
});

ask('What is your favourite color?', { pattern: /red|green|blue/ }, function (err, color) {
	// color can be either "red", "green" or "blue"
});
```

### Prompting for passwords

Password prompt is a bit different from the others, because it's input should be hidden. To achieve this behavior with *asking*, simply:

```javascript
ask('Enter your password: ', { hidden: true }, function (err, password) {
	// password will be hidden in console
});
```

### Menu of answers

Thanks to *choose* method, we can provide user with a list of possible answers to our question. For example:

```javascript
choose('Select a color: ', ['red', 'green', 'blue'], function (err, color, index) {
	// color is either "red", "green", "blue"
	// index is an index of answer
});
```

which will output this in console:

![](../../images/screenshots/asking-for-data.jpg)

For more information on *asking*, visit its [Github repository](https://github.com/vdemedes/asking).