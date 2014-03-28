/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

exports.isBrowser = function isBrowser() {
  return !(typeof(process) !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1)
}

var Buffer = require('buffer').Buffer;

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

// From https://github.com/GoogleChrome/chrome-app-samples/, license: BSD
var arrayBufferToString = function(buffer) {
  var array = new Uint8Array(buffer);
  var str = '';
  for (var i = 0; i < array.length; ++i) {
    str += String.fromCharCode(array[i]);
  }
  return str;
};

var stringToArrayBuffer = function(string) {
  var buffer = new ArrayBuffer(string.length);
  var bufferView = new Uint8Array(buffer);
  for (var i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }
  return buffer;
};


var bufferToArrayBuffer = function(buffer) {
  var arrayBuffer = new ArrayBuffer(buffer.length);
  var arrayBufferView = new Uint8Array(arrayBuffer);
  for (var i = 0; i < buffer.length; i++) {
    arrayBufferView[i] = buffer[i];
  }
  return arrayBuffer;
};

var arrayBufferToBuffer = function(arrayBuffer) {
  var view = new Uint8Array(arrayBuffer);
  var buffer = new Buffer(view.length);
  for (var i = 0; i < view.length; i++) {
    buffer[i] = view[i];
  }
  return buffer;
};



if (exports.isBrowser()) {
    exports.inherits = inherits;
    exports.stringToArrayBuffer = stringToArrayBuffer;
    exports.arrayBufferToString = arrayBufferToString;
    exports.arrayBufferToBuffer = arrayBufferToBuffer;
    exports.bufferToArrayBuffer = bufferToArrayBuffer;
} else {
    exports.inherits = require('util').inherits;
}

