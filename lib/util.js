/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

exports.isBrowser = function isBrowser() {
  return !(typeof(process) !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1)
}

// From https://github.com/isaacs/inherits, license: ISC
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

if (exports.isBrowser()) {
    exports.inherits = inherits;
} else {
    exports.inherits = require('util').inherits;
}
