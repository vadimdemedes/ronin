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


/**
 * Array#includes polyfill
 *
 * @param {String} value
 * @returns {Boolean}
 * @api public
 */

if (!Array.prototype.includes) {
	Array.prototype.includes = function (value) {
		return this.indexOf(value) > -1;
	};
}


/**
 * extend one object with the other
 *
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object}
 * @api public
 */

function extend (dest, src) {
	Object.keys(src).forEach(function (key) {
		dest[key] = src[key];
	});
	
	return dest;
}


/**
 * Take n first elements
 * from the array
 *
 * @param {Array} arr
 * @param {Number} n
 * @returns {Array}
 * @api public
 */

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
