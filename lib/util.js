/**
 * Dependencies
 */

var fs = require('fs');


/**
 * Expose utilities
 */

var exports = module.exports;

exports.extend = extend;
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