"use strict";

/**
 * Dependencies
 */

var fs = require("fs");


/**
 * Utilities
 */


/**
 * Object.assign polyfill
 *
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object}
 * @api public
 */

if (!Object.assign) {
  Object.assign = function (dest, src) {
    Object.keys(src).forEach(function (key) {
      return dest[key] = src[key];
    });
  };
}
