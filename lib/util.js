/**
 * Dependencies
 */

var fs = require('fs');


/**
 * Expose utilities
 */

var exports = module.exports;

exports.extend = extend;
exports.walk = walk;
exports.take = take;


/**
 * Utilities
 */

if (!Array.prototype.includes) {
	Array.prototype.includes = function (value) {
		return this.indexOf(value) > -1;
	};
}

function extend (dest, src) {
	Object.keys(src).forEach(function (key) {
		dest[key] = src[key];
	});
	
	return dest;
}

function walk (path) {
	var files = [];
	
	// readdir returns only file names
	// convert them to full path
	files = fs.readdirSync(path).map(function (file) {
		return path + '/' + file;
	});
	
	var index = 0;
	var file;
	
	while (file = files[index++]) {
		var stat = fs.lstatSync(file);
		// if directory append its contents
		// after current array item
		if (stat.isDirectory()) {
			var args = walk(file);
			args.unshift(index - 1, 1);
			files.splice.apply(files, args);
		}
	}
	
	return files;
}

function take (arr, n) {
	var result = [];
	var length = arr.length;
	
	if (n > length) {
		n = length;
	}
	
	for (var i = 0; i < n; i++) {
		result.push(arr[i]);
	}
	
	return result;
}