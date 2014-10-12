// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  throw 'NO_DYNAMIC_EXECUTION was set, cannot eval';
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      assert(sig.length == 1);
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    assert(ret % 2 === 0);
    table.push(func);
    for (var i = 0; i < 2-1; i++) table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    abort('NO_DYNAMIC_EXECUTION was set, cannot eval, so EM_ASM is not functional');
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8);(assert((STACKTOP|0) < (STACK_MAX|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((low>>>0)+((high>>>0)*4294967296)) : ((low>>>0)+((high|0)*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    abort('NO_DYNAMIC_EXECUTION was set, cannot eval - ccall/cwrap are not functional');
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var stack = 0;
  var JSfuncs = {
    'stackSave' : function() {
      stack = Runtime.stackSave();
    },
    'stackRestore' : function() {
      Runtime.stackRestore(stack);
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        ret = Runtime.stackAlloc(str.length + 1); // +1 for the trailing '\0'
        writeStringToMemory(str, ret);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface. A convenient way to call C functions (in C files, or
  // defined with extern "C").
  //
  // Note: ccall/cwrap use the C stack for temporary values. If you pass a string
  //       then it is only alive until the call is complete. If the code being
  //       called saves the pointer to be used later, it may point to invalid
  //       data. If you need a string to live forever, you can create it (and
  //       must later delete it manually!) using malloc and writeStringToMemory,
  //       for example.
  //
  // Note: LLVM optimizations can inline and remove functions, after which you will not be
  //       able to call them. Closure can also do so. To avoid that, add your function to
  //       the exports using something like
  //
  //         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
  //
  // @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
  // @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
  //                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
  // @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
  //                   except that 'array' is not possible (there is no way for us to know the length of the array)
  // @param args       An array of the arguments to the function, as native JS values (as in returnType)
  //                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
  // @return           The return value, as a native JS value (as in returnType)
  ccall = function ccallFunc(ident, returnType, argTypes, args) {
    var func = getCFunc(ident);
    var cArgs = [];
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) JSfuncs['stackRestore']();
    return ret;
  }

  var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }
  var JSsource = {};
  for (var fun in JSfuncs) {
    if (JSfuncs.hasOwnProperty(fun)) {
      // Elements of toCsource are arrays of three items:
      // the code, and the return value
      JSsource[fun] = parseJSFunc(JSfuncs[fun]);
    }
  }
  // Returns a native JS wrapper for a C function. This is similar to ccall, but
  // returns a function you can call repeatedly in a normal way. For example:
  //
  //   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
  //   alert(my_function(5, 22));
  //   alert(my_function(99, 12));
  //
  cwrap = function cwrap(ident, returnType, argTypes) {
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      funcstr += JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=' + convertCode.returnValue + ';';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    if (!numericArgs) {
      // If we had a stack, restore it
      funcstr += JSsource['stackRestore'].body + ';';
    }
    funcstr += 'return ret})';
    abort('NO_DYNAMIC_EXECUTION was set, cannot eval - ccall is not functional');
  };
})();
Module["cwrap"] = cwrap;
Module["ccall"] = ccall;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;


// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    Module.printErr('Exiting runtime. Any attempt to access the compiled C code may fail from now. If you want to keep the runtime alive, set Module["noExitRuntime"] = true or build with -s NO_EXIT_RUNTIME=1');
  }
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))>>0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))>>0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[(((buffer)+(i))>>0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))>>0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 4560;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });











var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,64,11,0,0,40,1,0,0,76,1,0,0,52,1,0,0,96,0,0,0,48,0,0,0,218,0,0,0,122,0,0,0,174,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,80,11,0,0,40,1,0,0,20,1,0,0,52,1,0,0,96,0,0,0,48,0,0,0,12,0,0,0,44,1,0,0,70,1,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;












































































































































































































var __ZTISt9exception;
var __ZTISt9exception=__ZTISt9exception=allocate([allocate([1,0,0,0,0,0,0], "i8", ALLOC_STATIC)+8, 0], "i32", ALLOC_STATIC);
















































































































var __ZN17HostCommunicationC1Ev;
var __ZN7NetworkC1EP2IO;
var __ZN8SubGraphC1Ev;
var __ZNSt9bad_allocC1Ev;
var __ZNSt9bad_allocD1Ev;
/* memory initializer */ allocate([115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,19,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,111,0,0,0,0,0,0,0,0,0,0,0,48,11,0,0,132,0,0,0,244,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,11,0,0,16,0,0,0,110,0,0,0,178,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,11,0,0,26,1,0,0,74,0,0,0,88,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,11,0,0,138,0,0,0,72,0,0,0,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,11,0,0,228,0,0,0,164,0,0,0,130,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,11,0,0,200,0,0,0,120,0,0,0,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,11,0,0,238,0,0,0,28,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,11,0,0,66,0,0,0,48,1,0,0,166,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,11,0,0,140,0,0,0,142,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,11,0,0,134,0,0,0,188,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,11,0,0,196,0,0,0,42,1,0,0,30,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,12,0,0,242,0,0,0,184,0,0,0,34,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,12,0,0,152,0,0,0,246,0,0,0,12,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,12,0,0,78,0,0,0,216,0,0,0,34,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,12,0,0,104,0,0,0,32,0,0,0,172,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,12,0,0,32,1,0,0,46,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,12,0,0,6,1,0,0,198,0,0,0,60,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,12,0,0,82,0,0,0,154,0,0,0,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,12,0,0,202,0,0,0,46,1,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,12,0,0,42,0,0,0,214,0,0,0,170,0,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,118,0,0,0,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,12,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,12,0,0,208,0,0,0,100,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,12,0,0,18,1,0,0,4,0,0,0,8,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,12,0,0,94,0,0,0,168,0,0,0,240,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,12,0,0,176,0,0,0,126,0,0,0,156,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,12,0,0,80,0,0,0,146,0,0,0,28,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,12,0,0,98,0,0,0,180,0,0,0,58,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,0,0,62,1,0,0,60,0,0,0,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,13,0,0,106,0,0,0,24,0,0,0,34,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,13,0,0,54,0,0,0,82,1,0,0,34,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,13,0,0,2,0,0,0,224,0,0,0,226,0,0,0,50,0,0,0,206,0,0,0,212,0,0,0,70,0,0,0,158,0,0,0,232,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,13,0,0,204,0,0,0,148,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,13,0,0,18,0,0,0,252,0,0,0,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,13,0,0,44,0,0,0,190,0,0,0,86,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,13,0,0,22,0,0,0,10,1,0,0,64,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,13,0,0,186,0,0,0,16,1,0,0,34,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,13,0,0,76,0,0,0,136,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,13,0,0,112,0,0,0,210,0,0,0,230,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,13,0,0,2,1,0,0,2,1,0,0,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,13,0,0,80,1,0,0,102,0,0,0,162,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,13,0,0,54,1,0,0,6,0,0,0,38,1,0,0,128,0,0,0,14,1,0,0,20,0,0,0,114,0,0,0,66,1,0,0,92,0,0,0,222,0,0,0,56,1,0,0,40,0,0,0,36,1,0,0,236,0,0,0,118,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,13,0,0,24,1,0,0,22,1,0,0,50,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,13,0,0,2,1,0,0,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,13,0,0,150,0,0,0,182,0,0,0,34,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,78,1,0,0,90,0,0,0,220,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,14,0,0,144,0,0,0,38,0,0,0,108,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,14,0,0,250,0,0,0,72,1,0,0,234,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,14,0,0,34,0,0,0,124,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,14,0,0,194,0,0,0,116,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,57,83,101,114,105,97,108,79,117,116,0,0,0,0,0,0,57,77,97,112,76,105,110,101,97,114,0,0,0,0,0,0,57,70,111,114,119,97,114,100,73,102,0,0,0,0,0,0,57,67,111,110,115,116,114,97,105,110,0,0,0,0,0,0,57,67,111,109,112,111,110,101,110,116,0,0,0,0,0,0,57,66,111,111,108,84,111,73,110,116,0,0,0,0,0,0,56,83,117,98,71,114,97,112,104,0,0,0,0,0,0,0,56,83,101,114,105,97,108,73,110,0,0,0,0,0,0,0,56,80,119,109,87,114,105,116,101,0,0,0,0,0,0,0,56,65,84,85,83,66,75,69,89,0,0,0,0,0,0,0,55,77,98,101,100,76,80,67,0,0,0,0,0,0,0,0,55,70,111,114,119,97,114,100,0,0,0,0,0,0,0,0,53,84,105,118,97,67,0,0,53,84,105,109,101,114,0,0,53,83,112,108,105,116,0,0,53,82,111,117,116,101,0,0,53,67,111,117,110,116,0,0,52,71,97,116,101,0,0,0,50,73,79,0,0,0,0,0,50,54,78,101,116,119,111,114,107,78,111,116,105,102,105,99,97,116,105,111,110,72,97,110,100,108,101,114,0,0,0,0,50,51,69,109,115,99,114,105,112,116,101,110,72,111,115,116,84,114,97,110,115,112,111,114,116,0,0,0,0,0,0,0,50,50,80,117,114,101,70,117,110,99,116,105,111,110,67,111,109,112,111,110,101,110,116,50,73,57,66,111,111,108,101,97,110,79,114,98,98,69,0,0,50,50,80,117,114,101,70,117,110,99,116,105,111,110,67,111,109,112,111,110,101,110,116,50,73,51,77,105,110,108,108,69,0,0,0,0,0,0,0,0,50,50,80,117,114,101,70,117,110,99,116,105,111,110,67,111,109,112,111,110,101,110,116,50,73,51,77,97,120,108,108,69,0,0,0,0,0,0,0,0,50,50,80,117,114,101,70,117,110,99,116,105,111,110,67,111,109,112,111,110,101,110,116,50,73,49,50,78,117,109,98,101,114,69,113,117,97,108,115,108,108,69,0,0,0,0,0,0,50,50,80,117,114,101,70,117,110,99,116,105,111,110,67,111,109,112,111,110,101,110,116,50,73,49,48,66,111,111,108,101,97,110,65,110,100,98,98,69,0,0,0,0,0,0,0,0,50,49,83,105,110,103,108,101,79,117,116,112,117,116,67,111,109,112,111,110,101,110,116,0,50,49,82,101,97,100,68,97,108,108,97,115,84,101,109,112,101,114,97,116,117,114,101,0,49,55,82,101,97,100,67,97,112,97,99,105,116,105,118,101,80,105,110,0,0,0,0,0,49,55,72,111,115,116,67,111,109,109,117,110,105,99,97,116,105,111,110,0,0,0,0,0,49,54,76,101,100,67,104,97,105,110,78,101,111,80,105,120,101,108,0,0,0,0,0,0,49,53,72,121,115,116,101,114,101,115,105,115,76,97,116,99,104,0,0,0,0,0,0,0,49,53,66,114,101,97,107,66,101,102,111,114,101,77,97,107,101,0,0,0,0,0,0,0,49,52,80,115,101,117,100,111,80,119,109,87,114,105,116,101,0,0,0,0,0,0,0,0,49,52,68,117,109,109,121,67,111,109,112,111,110,101,110,116,0,0,0,0,0,0,0,0,49,51,84,111,103,103,108,101,66,111,111,108,101,97,110,0,49,51,73,110,118,101,114,116,66,111,111,108,101,97,110,0,49,51,72,111,115,116,84,114,97,110,115,112,111,114,116,0,49,50,76,101,100,77,97,116,114,105,120,77,97,120,0,0,49,50,69,109,115,99,114,105,112,116,101,110,73,79,0,0,49,50,68,105,103,105,116,97,108,87,114,105,116,101,0,0,49,50,68,101,98,117,103,72,97,110,100,108,101,114,0,0,49,49,82,97,115,112,98,101,114,114,121,80,105,0,0,0,49,49,68,105,103,105,116,97,108,82,101,97,100,0,0,0,49,48,77,111,110,105,116,111,114,80,105,110,0,0,0,0,49,48,76,101,100,67,104,97,105,110,87,83,0,0,0,0,49,48,65,114,100,117,105,110,111,85,110,111,0,0,0,0,49,48,65,110,97,108,111,103,82,101,97,100,0,0,0,0,0,0,0,0,216,6,0,0,0,0,0,0,232,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,6,0,0,80,11,0,0,0,0,0,0,0,0,0,0,32,7,0,0,96,11,0,0,0,0,0,0,0,0,0,0,72,7,0,0,40,11,0,0,0,0,0,0,0,0,0,0,112,7,0,0,0,13,0,0,0,0,0,0,0,0,0,0,128,7,0,0,0,13,0,0,0,0,0,0,0,0,0,0,144,7,0,0,0,13,0,0,0,0,0,0,0,0,0,0,160,7,0,0,0,13,0,0,0,0,0,0,0,0,0,0,176,7,0,0,0,0,0,0,192,7,0,0,0,13,0,0,0,0,0,0,0,0,0,0,208,7,0,0,176,11,0,0,0,0,0,0,0,0,0,0,224,7,0,0,0,13,0,0,0,0,0,0,0,0,0,0,240,7,0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,8,0,0,176,11,0,0,0,0,0,0,0,0,0,0,16,8,0,0,128,13,0,0,0,0,0,0,0,0,0,0,32,8,0,0,0,13,0,0,0,0,0,0,0,0,0,0,48,8,0,0,128,13,0,0,0,0,0,0,0,0,0,0,56,8,0,0,0,13,0,0,0,0,0,0,0,0,0,0,64,8,0,0,176,11,0,0,0,0,0,0,0,0,0,0,72,8,0,0,0,13,0,0,0,0,0,0,0,0,0,0,80,8,0,0,0,13,0,0,0,0,0,0,0,0,0,0,88,8,0,0,0,13,0,0,0,0,0,0,0,0,0,0,96,8,0,0,0,0,0,0,104,8,0,0,232,13,0,0,0,0,0,0,0,0,0,0,136,8,0,0,176,13,0,0,0,0,0,0,0,0,0,0,168,8,0,0,176,11,0,0,0,0,0,0,0,0,0,0,208,8,0,0,176,11,0,0,0,0,0,0,0,0,0,0,248,8,0,0,176,11,0,0,0,0,0,0,0,0,0,0,32,9,0,0,176,11,0,0,0,0,0,0,0,0,0,0,80,9,0,0,176,11,0,0,0,0,0,0,0,0,0,0,128,9,0,0,176,11,0,0,0,0,0,0,0,0,0,0,152,9,0,0,128,13,0,0,0,0,0,0,0,0,0,0,176,9,0,0,128,13,0,0,0,0,0,0,0,0,0,0,200,9,0,0,144,12,0,0,0,0,0,0,0,0,0,0,224,9,0,0,176,11,0,0,0,0,0,0,0,0,0,0,248,9,0,0,0,13,0,0,0,0,0,0,0,0,0,0,16,10,0,0,176,11,0,0,0,0,0,0,0,0,0,0,40,10,0,0,0,13,0,0,0,0,0,0,0,0,0,0,64,10,0,0,176,11,0,0,0,0,0,0,0,0,0,0,88,10,0,0,0,13,0,0,0,0,0,0,0,0,0,0,104,10,0,0,0,13,0,0,0,0,0,0,0,0,0,0,120,10,0,0,0,0,0,0,136,10,0,0,0,13,0,0,0,0,0,0,0,0,0,0,152,10,0,0,136,12,0,0,0,0,0,0,0,0,0,0,168,10,0,0,0,13,0,0,0,0,0,0,0,0,0,0,184,10,0,0,0,0,0,0,200,10,0,0,128,13,0,0,0,0,0,0,0,0,0,0,216,10,0,0,0,13,0,0,0,0,0,0,0,0,0,0,232,10,0,0,0,13,0,0,0,0,0,0,0,0,0,0,248,10,0,0,176,11,0,0,0,0,0,0,0,0,0,0,8,11,0,0,176,11,0,0,0,0,0,0,0,0,0,0,24,11,0,0,0,13,0,0,0,0,0,0,117,67,47,70,108,111,48,49,10,0,0,0,0,0,0,0,15,1,0,0,0,0,0,0,11,7,0,0,0,0,0,0,11,11,0,0,0,0,0,0,11,5,0,0,0,0,0,0,12,1,2,0,0,0,0,0,12,2,3,0,0,0,0,0,13,1,0,7,44,1,0,0,13,3,1,7,13,0,0,0,20,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,117,67,47,70,108,111,48,49,60,66,66,66,66,66,66,60,16,24,20,16,16,16,16,16,126,2,2,126,64,64,64,126,62,2,2,62,2,2,62,0,8,24,40,72,254,8,8,8,60,32,32,60,4,4,60,0,60,32,32,60,36,36,60,0,62,34,4,8,8,8,8,8,0,62,34,34,62,34,34,62,62,34,34,62,2,2,2,62,8,20,34,62,34,34,34,34,60,34,34,62,34,34,60,0,60,64,64,64,64,64,60,0,124,66,66,66,66,66,124,0,124,64,64,124,64,64,64,124,124,64,64,124,64,64,64,64,60,64,64,64,64,68,68,60,68,68,68,124,68,68,68,68,124,16,16,16,16,16,16,124,60,8,8,8,8,8,72,48,0,36,40,48,32,48,40,36,64,64,64,64,64,64,64,124,129,195,165,153,129,129,129,129,0,66,98,82,74,70,66,0,60,66,66,66,66,66,66,60,60,34,34,34,60,32,32,32,28,34,34,34,34,38,34,29,60,34,34,34,60,36,34,33,0,30,32,32,62,2,2,60,0,62,8,8,8,8,8,8,66,66,66,66,66,66,34,28,66,66,66,66,66,66,36,24,0,73,73,73,73,42,28,0,0,65,34,20,8,20,34,65,65,34,20,8,8,8,8,8,0,127,2,4,8,16,32,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
function runPostSets() {

HEAP32[((2856 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((2864 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2872 )>>2)]=__ZTISt9exception;
HEAP32[((2880 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2896 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2912 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2928 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2944 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2960 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2976 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2992 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((3000 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3016 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3032 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3048 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3064 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3080 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3096 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3112 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3128 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3144 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3160 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3176 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3192 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3208 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((3216 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3232 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3248 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3264 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3280 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3296 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3312 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3328 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3344 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3360 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3376 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3392 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3408 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3424 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3440 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3456 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3472 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3488 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3504 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((3512 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3528 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3544 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3560 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((3568 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3584 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3600 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3616 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3632 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((3648 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
}

var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    }function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[((dest)>>0)]=HEAP8[((src)>>0)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[((dest)>>0)]=HEAP8[((src)>>0)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  
  
  
  var ___cxa_last_thrown_exception=0;function ___resumeException(ptr) {
      if (!___cxa_last_thrown_exception) { ___cxa_last_thrown_exception = ptr; }
      throw ptr;
    }
  
  var ___cxa_exception_header_size=8;function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = ___cxa_last_thrown_exception;
      header = thrown - ___cxa_exception_header_size;
      if (throwntype == -1) throwntype = HEAP32[((header)>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
  
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return tempRet0 = typeArray[i],thrown;
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return tempRet0 = throwntype,thrown;
    }function ___gxx_personality_v0() {
    }

  function ___cxa_allocate_exception(size) {
      var ptr = _malloc(size + ___cxa_exception_header_size);
      return ptr + ___cxa_exception_header_size;
    }

  function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      var header = ptr - ___cxa_exception_header_size;
      HEAP32[((header)>>2)]=type;
      HEAP32[(((header)+(4))>>2)]=destructor;
      ___cxa_last_thrown_exception = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr;
    }

  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }

  
  var ___cxa_caught_exceptions=[];function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      ___cxa_caught_exceptions.push(___cxa_last_thrown_exception);
      return ptr;
    }

  
  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }

  function ___cxa_pure_virtual() {
      ABORT = true;
      throw 'Pure virtual function called!';
    }

  function __ZNSt9exceptionD2Ev() {}

  function _llvm_lifetime_start() {}

  
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[((ptr)>>0)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[((ptr)>>0)]=value;
        ptr = (ptr+1)|0;
      }
      return (ptr-num)|0;
    }var _llvm_memset_p0i8_i64=_memset;

  function _llvm_lifetime_end() {}

  function _abort() {
      Module['abort']();
    }

  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }function ___errno_location() {
      return ___errno_state;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }





  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[((curr)>>0)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }

  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            assert(buffer.length);
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          if (this.stack) this.stack = demangleAll(this.stack);
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = Math.floor(idx / this.chunkSize);
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (function(from, to) {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              } else {
                return intArrayFromString(xhr.responseText || '', true);
              }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
          function pointerLockChange() {
            Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                  document['mozPointerLockElement'] === canvas ||
                                  document['webkitPointerLockElement'] === canvas ||
                                  document['msPointerLockElement'] === canvas;
          }
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll': 
            delta = event.detail;
            break;
          case 'mousewheel': 
            delta = -event.wheelDelta;
            break;
          case 'wheel': 
            delta = event.deltaY;
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return Math.max(-1, Math.min(1, delta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      }};
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");



var FUNCTION_TABLE = [0,0,__ZN17HostCommunication9emitDebugE10DebugLevel7DebugId,0,__ZN22PureFunctionComponent2I9BooleanOrbbED0Ev,0,__ZN12EmscriptenIOD0Ev,0,__ZN10MonitorPin9interruptEPv,0,__ZN5Split7processE6Packeta,0,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZN4Gate7processE6Packeta,0,__ZN9SerialOutD1Ev,0,__ZN15HysteresisLatchD1Ev,0,__ZN12EmscriptenIO10SerialReadEh,0,__ZN14PseudoPwmWriteD1Ev,0,__ZN21ReadDallasTemperatureD0Ev,0,__ZN8SerialIn7processE6Packeta,0,__ZN9BoolToIntD0Ev,0,__ZNKSt9bad_alloc4whatEv,0,__ZN5TimerD0Ev,0,__ZN10ArduinoUnoD1Ev,0,__ZN16LedChainNeoPixel7processE6Packeta,0,__ZN10MonitorPinD0Ev,0,__ZN12EmscriptenIO10AnalogReadEa,0,__ZN2IOD1Ev,0,__ZN15BreakBeforeMakeD1Ev,0,__ZN5SplitD0Ev,0,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZN17HostCommunication15packetDeliveredEi7Message,0,__ZN13ToggleBoolean7processE6Packeta,0,__ZN17ReadCapacitivePinD1Ev,0,__ZN8PwmWrite7processE6Packeta,0,__ZN10AnalogRead7processE6Packeta,0,__ZN21SingleOutputComponentD0Ev,0,__ZN9ForwardIf7processE6Packeta,0,__ZN9BoolToInt7processE6Packeta,0,__ZN8SubGraphD1Ev,0,__ZN23EmscriptenHostTransport11sendCommandEPKhh,0,__ZN17HostCommunication19networkStateChangedEN7Network5StateE,0,__ZN9ForwardIfD0Ev,0,__ZN9MapLinearD0Ev,0,__ZN13ToggleBooleanD1Ev,0,__ZN5TivaCD1Ev,0,__ZN22PureFunctionComponent2I12NumberEqualsllED1Ev,0,__ZN5CountD1Ev,0,__ZNSt9bad_allocC2Ev,0,__ZN15BreakBeforeMake7processE6Packeta,0,__ZN9MapLinear7processE6Packeta,0,__ZN11DigitalReadD0Ev,0,__ZN12EmscriptenIO12PinSetPullupEaN2IO10PullupModeE,0,__ZN22PureFunctionComponent2I3MinllED1Ev,0,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,0,__ZN22PureFunctionComponent2I10BooleanAndbbED1Ev,0,__ZN23EmscriptenHostTransport7runTickEv,0,__ZN12LedMatrixMaxD0Ev,0,__ZN5TimerD1Ev,0,__ZN21ReadDallasTemperatureD1Ev,0,__ZN10MonitorPin7processE6Packeta,0,__ZN9SerialOutD0Ev,0,__ZN13InvertBooleanD1Ev,0,__ZN12EmscriptenIO11SerialWriteEhh,0,__ZN10AnalogReadD0Ev,0,__ZN2IO18TimerCurrentMicrosEv,0,__ZN9ComponentD0Ev,0,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZN10ArduinoUnoD0Ev,0,__ZN22PureFunctionComponent2I3MaxllED0Ev,0,__ZN12EmscriptenIO11SerialBeginEhi,0,__ZN9Constrain7processE6Packeta,0,__ZNSt9bad_allocD2Ev,0,__ZN8PwmWriteD1Ev,0,__ZN13ToggleBooleanD0Ev,0,__ZN9ForwardIfD1Ev,0,__ZN8SerialInD1Ev,0,__ZN8SerialInD0Ev,0,__ZN10MonitorPinD1Ev,0,__ZN22PureFunctionComponent2I12NumberEqualsllED0Ev,0,__ZN16LedChainNeoPixelD0Ev,0,__ZN11RaspberryPiD1Ev,0,__ZN7ForwardD1Ev,0,__ZN5CountD0Ev,0,__ZN22PureFunctionComponent2I3MaxllE7processE6Packeta,0,__ZN17HostCommunication17subgraphConnectedEbhaha,0,__ZN15HysteresisLatch7processE6Packeta,0,__ZN12LedMatrixMax7processE6Packeta,0,__ZN9ConstrainD0Ev,0,__ZN8SubGraph7processE6Packeta,0,__ZN22PureFunctionComponent2I3MinllED0Ev,0,__ZN2IO10setIoValueEPKhh,0,__ZN5Timer7processE6Packeta,0,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZN22PureFunctionComponent2I3MaxllED1Ev,0,__ZN9SerialOut7processE6Packeta,0,__ZN22PureFunctionComponent2I10BooleanAndbbED0Ev,0,__ZN11RaspberryPiD0Ev,0,__ZN7MbedLPCD0Ev,0,__ZN14DummyComponentD1Ev,0,__ZN8PwmWriteD0Ev,0,__ZN15BreakBeforeMakeD0Ev,0,__ZN12EmscriptenIO23AttachExternalInterruptEhN2IO9Interrupt4ModeEPFvPvES3_,0,__ZN10AnalogReadD1Ev,0,__ZN8ATUSBKEYD1Ev,0,__ZN5RouteD0Ev,0,__ZN9ComponentD1Ev,0,__ZN4GateD1Ev,0,__ZN16LedChainNeoPixelD1Ev,0,__ZN17HostCommunication9nodeAddedEP9Componenth,0,__ZN23EmscriptenHostTransport5setupEP2IOP17HostCommunication,0,__ZN13InvertBooleanD0Ev,0,__ZN17HostCommunication14nodesConnectedEP9ComponentaS1_a,0,__ZN2IOD0Ev,0,__ZN5TivaCD0Ev,0,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZN11DigitalRead7processE6Packeta,0,__ZN12EmscriptenIO12DigitalWriteEab,0,__ZN17HostCommunication12debugChangedE10DebugLevel,0,__ZN17HostCommunication10packetSentEi7MessageP9Componenta,0,__ZN9ConstrainD1Ev,0,__ZN13InvertBoolean7processE6Packeta,0,__ZN17HostCommunication23portSubscriptionChangedEhab,0,__ZN10LedChainWS7processE6Packeta,0,__ZN12EmscriptenIO14TimerCurrentMsEv,0,__ZN9BoolToIntD1Ev,0,__ZN22PureFunctionComponent2I3MinllE7processE6Packeta,0,__ZN7MbedLPCD1Ev,0,__ZNSt9bad_allocD0Ev,0,__ZN7ForwardD0Ev,0,__ZN8SubGraphC2Ev,0,__ZN10LedChainWSD1Ev,0,__ZN15HysteresisLatchD0Ev,0,__ZN5Count7processE6Packeta,0,__ZN10ArduinoUno7processE6Packeta,0,___cxa_pure_virtual,0,__ZN7NetworkC2EP2IO,0,__ZN5RouteD1Ev,0,__ZN22PureFunctionComponent2I9BooleanOrbbE7processE6Packeta,0,__ZN14PseudoPwmWriteD0Ev,0,__ZN7Forward7processE6Packeta,0,__ZN12EmscriptenIO19SerialDataAvailableEh,0,__ZN14DummyComponentD0Ev,0,__ZN22PureFunctionComponent2I9BooleanOrbbED1Ev,0,__ZN10__cxxabiv117__class_type_infoD0Ev,0,__ZN12DigitalWriteD0Ev,0,__ZN12DigitalWriteD1Ev,0,__ZN9MapLinearD1Ev,0,__ZN22PureFunctionComponent2I12NumberEqualsllE7processE6Packeta,0,__ZN8ATUSBKEY7processE6Packeta,0,__ZN5SplitD1Ev,0,__ZN14DummyComponent7processE6Packeta,0,__ZN12EmscriptenIO8PwmWriteEal,0,__ZN12EmscriptenIO10setIoValueEPKhh,0,__ZN10__cxxabiv116__shim_type_infoD2Ev,0,__ZN8ATUSBKEYD0Ev,0,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZN4GateD0Ev,0,__ZN8SubGraphD0Ev,0,__ZN12DigitalWrite7processE6Packeta,0,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,0,__ZN12EmscriptenIOD1Ev,0,__ZN12EmscriptenIO11DigitalReadEa,0,__ZN22PureFunctionComponent2I10BooleanAndbbE7processE6Packeta,0,__ZN5Route7processE6Packeta,0,__ZN21SingleOutputComponentD1Ev,0,__ZN14PseudoPwmWrite7processE6Packeta,0,__ZN12EmscriptenIO10PinSetModeEaN2IO7PinModeE,0,__ZNSt9bad_allocD2Ev,0,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZN10LedChainWSD0Ev,0,__ZN17HostCommunicationC2Ev,0,__ZN10__cxxabiv120__si_class_type_infoD0Ev,0,__ZN11DigitalReadD1Ev,0,__ZN12LedMatrixMaxD1Ev,0,__ZN17ReadCapacitivePinD0Ev,0];

// EMSCRIPTEN_START_FUNCS

function __ZNK6Packet6asBoolEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $2=$this;
 var $3=$2;
 var $4=(($3+4)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=($5|0)==3;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 $1=1;
 label=4;break;
 case 3: 
 var $9=(($3)|0);
 var $10=$9;
 var $11=HEAP8[(($10)>>0)];
 var $12=(($11)&1);
 $1=$12;
 label=4;break;
 case 4: 
 var $14=$1;
 STACKTOP=sp;return $14;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet9asIntegerEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $2=$this;
 var $3=$2;
 var $4=(($3+4)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=($5|0)==3;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 $1=0;
 label=4;break;
 case 3: 
 var $9=(($3)|0);
 var $10=$9;
 var $11=HEAP32[(($10)>>2)];
 $1=$11;
 label=4;break;
 case 4: 
 var $13=$1;
 STACKTOP=sp;return $13;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet7asFloatEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $2=$this;
 var $3=$2;
 var $4=(($3+4)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=($5|0)==3;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 $1=0;
 label=4;break;
 case 3: 
 var $9=(($3)|0);
 var $10=$9;
 var $11=HEAPF32[(($10)>>2)];
 $1=$11;
 label=4;break;
 case 4: 
 var $13=$1;
 STACKTOP=sp;return $13;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet6asByteEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $2=$this;
 var $3=$2;
 var $4=(($3+4)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=($5|0)==3;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 $1=0;
 label=4;break;
 case 3: 
 var $9=(($3)|0);
 var $10=$9;
 var $11=HEAP8[(($10)>>0)];
 $1=$11;
 label=4;break;
 case 4: 
 var $13=$1;
 STACKTOP=sp;return $13;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN17HostCommunicationC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN26NetworkNotificationHandlerC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1088;
 var $5=(($2+4)|0);
 HEAP32[(($5)>>2)]=0;
 var $6=(($2+8)|0);
 HEAP32[(($6)>>2)]=0;
 var $7=(($2+12)|0);
 HEAP8[(($7)>>0)]=0;
 var $8=(($2+24)|0);
 HEAP32[(($8)>>2)]=2;
 var $9=(($2+28)|0);
 HEAP32[(($9)>>2)]=1;
 STACKTOP=sp;return;
}


function __ZN26NetworkNotificationHandlerC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN12DebugHandlerC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=744;
 STACKTOP=sp;return;
}


function __ZN17HostCommunication5setupEP7NetworkP13HostTransport($this,$net,$t){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$net;
 $3=$t;
 var $4=$1;
 var $5=$2;
 var $6=(($4+4)|0);
 HEAP32[(($6)>>2)]=$5;
 var $7=$3;
 var $8=(($4+8)|0);
 HEAP32[(($8)>>2)]=$7;
 label=2;break;
 case 2: 
 var $10=$4;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($10,2,1);
 label=3;break;
 case 3: 
 var $12=(($4+4)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=$4;
 __ZN7Network22setNotificationHandlerEP26NetworkNotificationHandler($13,$14);
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($handler,$level,$code){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$handler;
 $2=$level;
 $3=$code;
 var $4=$1;
 var $5=($4|0)!=0;
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 var $7=$1;
 var $8=$7;
 var $9=HEAP32[(($8)>>2)];
 var $10=(($9)|0);
 var $11=HEAP32[(($10)>>2)];
 var $12=$2;
 var $13=$3;
 FUNCTION_TABLE[$11]($7,$12,$13);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network22setNotificationHandlerEP26NetworkNotificationHandler($this,$handler){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$handler;
 var $3=$1;
 var $4=$2;
 var $5=(($3+1008)|0);
 HEAP32[(($5)>>2)]=$4;
 var $6=$2;
 var $7=$6;
 var $8=(($3+1012)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=(($9+4)|0);
 HEAP32[(($10)>>2)]=$7;
 STACKTOP=sp;return;
}


function __ZN17HostCommunication9parseByteEc($this,$b){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$b;
 var $3=$1;
 var $4=$2;
 var $5=(($3+12)|0);
 var $6=HEAP8[(($5)>>0)];
 var $7=((($6)+(1))&255);
 HEAP8[(($5)>>0)]=$7;
 var $8=($6&255);
 var $9=(($3+13)|0);
 var $10=(($9+$8)|0);
 HEAP8[(($10)>>0)]=$4;
 var $11=(($3+24)|0);
 var $12=HEAP32[(($11)>>2)];
 var $13=($12|0)==0;
 if($13){label=2;break;}else{label=14;break;}
 case 2: 
 label=3;break;
 case 3: 
 var $16=$3;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($16,4,6);
 label=4;break;
 case 4: 
 var $18=(($3+12)|0);
 var $19=HEAP8[(($18)>>0)];
 var $20=($19&255);
 var $21=($20|0)==8;
 if($21){label=5;break;}else{label=13;break;}
 case 5: 
 var $23=(($3+13)|0);
 var $24=(($23)|0);
 var $25=_memcmp($24,3760,8);
 var $26=($25|0)==0;
 if($26){label=6;break;}else{label=9;break;}
 case 6: 
 label=7;break;
 case 7: 
 var $29=$3;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($29,3,31);
 label=8;break;
 case 8: 
 var $31=(($3+8)|0);
 var $32=HEAP32[(($31)>>2)];
 var $33=$32;
 var $34=HEAP32[(($33)>>2)];
 var $35=(($34+8)|0);
 var $36=HEAP32[(($35)>>2)];
 FUNCTION_TABLE[$36]($32,24,1);
 var $37=(($3+24)|0);
 HEAP32[(($37)>>2)]=1;
 label=12;break;
 case 9: 
 label=10;break;
 case 10: 
 var $40=$3;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($40,1,18);
 label=11;break;
 case 11: 
 var $42=(($3+24)|0);
 HEAP32[(($42)>>2)]=-1;
 label=12;break;
 case 12: 
 var $44=(($3+12)|0);
 HEAP8[(($44)>>0)]=0;
 label=13;break;
 case 13: 
 label=37;break;
 case 14: 
 var $47=(($3+24)|0);
 var $48=HEAP32[(($47)>>2)];
 var $49=($48|0)==1;
 if($49){label=15;break;}else{label=20;break;}
 case 15: 
 label=16;break;
 case 16: 
 var $52=$3;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($52,4,7);
 label=17;break;
 case 17: 
 var $54=(($3+12)|0);
 var $55=HEAP8[(($54)>>0)];
 var $56=($55&255);
 var $57=($56|0)==8;
 if($57){label=18;break;}else{label=19;break;}
 case 18: 
 __ZN17HostCommunication8parseCmdEv($3);
 var $59=(($3+12)|0);
 HEAP8[(($59)>>0)]=0;
 label=19;break;
 case 19: 
 label=36;break;
 case 20: 
 var $62=(($3+24)|0);
 var $63=HEAP32[(($62)>>2)];
 var $64=($63|0)==2;
 if($64){label=21;break;}else{label=27;break;}
 case 21: 
 label=22;break;
 case 22: 
 var $67=$3;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($67,4,17);
 label=23;break;
 case 23: 
 var $69=$2;
 var $70=(($69<<24)>>24);
 var $71=HEAP8[((3760)>>0)];
 var $72=(($71<<24)>>24);
 var $73=($70|0)==($72|0);
 if($73){label=24;break;}else{label=25;break;}
 case 24: 
 var $75=(($3+24)|0);
 HEAP32[(($75)>>2)]=0;
 var $76=$2;
 var $77=(($3+13)|0);
 var $78=(($77)|0);
 HEAP8[(($78)>>0)]=$76;
 var $79=(($3+12)|0);
 HEAP8[(($79)>>0)]=1;
 label=26;break;
 case 25: 
 var $81=(($3+12)|0);
 HEAP8[(($81)>>0)]=0;
 label=26;break;
 case 26: 
 label=35;break;
 case 27: 
 var $84=(($3+24)|0);
 var $85=HEAP32[(($84)>>2)];
 var $86=($85|0)==-1;
 if($86){label=28;break;}else{label=31;break;}
 case 28: 
 label=29;break;
 case 29: 
 var $89=$3;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($89,1,4);
 label=30;break;
 case 30: 
 var $91=(($3+12)|0);
 HEAP8[(($91)>>0)]=0;
 var $92=(($3+24)|0);
 HEAP32[(($92)>>2)]=2;
 label=34;break;
 case 31: 
 label=32;break;
 case 32: 
 var $95=$3;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($95,1,5);
 label=33;break;
 case 33: 
 var $97=(($3+12)|0);
 HEAP8[(($97)>>0)]=0;
 var $98=(($3+24)|0);
 HEAP32[(($98)>>2)]=2;
 label=34;break;
 case 34: 
 label=35;break;
 case 35: 
 label=36;break;
 case 36: 
 label=37;break;
 case 37: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN17HostCommunication8parseCmdEv($this){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+48)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $cmd;
 var $c;
 var $packetType;
 var $p=sp;
 var $2=(sp)+(8);
 var $val;
 var $3=(sp)+(16);
 var $4=(sp)+(24);
 var $5=(sp)+(32);
 var $isOutput;
 var $subgraphNode;
 var $subgraphPort;
 var $childNode;
 var $childPort;
 var $cmd1=(sp)+(40);
 $1=$this;
 var $6=$1;
 var $7=(($6+13)|0);
 var $8=(($7)|0);
 var $9=HEAP8[(($8)>>0)];
 var $10=($9&255);
 $cmd=$10;
 var $11=$cmd;
 var $12=($11|0)==14;
 if($12){label=2;break;}else{label=5;break;}
 case 2: 
 label=3;break;
 case 3: 
 var $15=$6;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($15,3,32);
 label=4;break;
 case 4: 
 var $17=(($6+8)|0);
 var $18=HEAP32[(($17)>>2)];
 var $19=$18;
 var $20=HEAP32[(($19)>>2)];
 var $21=(($20+8)|0);
 var $22=HEAP32[(($21)>>2)];
 FUNCTION_TABLE[$22]($18,40,1);
 var $23=(($6+24)|0);
 HEAP32[(($23)>>2)]=2;
 label=69;break;
 case 5: 
 var $25=$cmd;
 var $26=($25|0)==10;
 if($26){label=6;break;}else{label=7;break;}
 case 6: 
 var $28=(($6+4)|0);
 var $29=HEAP32[(($28)>>2)];
 __ZN7Network5resetEv($29);
 label=68;break;
 case 7: 
 var $31=$cmd;
 var $32=($31|0)==20;
 if($32){label=8;break;}else{label=9;break;}
 case 8: 
 var $34=(($6+4)|0);
 var $35=HEAP32[(($34)>>2)];
 __ZN7Network5startEv($35);
 label=67;break;
 case 9: 
 var $37=$cmd;
 var $38=($37|0)==11;
 if($38){label=10;break;}else{label=15;break;}
 case 10: 
 label=11;break;
 case 11: 
 var $41=$6;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($41,3,2);
 label=12;break;
 case 12: 
 var $43=(($6+13)|0);
 var $44=(($43+1)|0);
 var $45=HEAP8[(($44)>>0)];
 var $46=($45&255);
 var $47=__ZN9Component6createE11ComponentId($46);
 $c=$47;
 label=13;break;
 case 13: 
 var $49=$6;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($49,3,3);
 label=14;break;
 case 14: 
 var $51=(($6+4)|0);
 var $52=HEAP32[(($51)>>2)];
 var $53=$c;
 var $54=(($6+13)|0);
 var $55=(($54+2)|0);
 var $56=HEAP8[(($55)>>0)];
 var $57=__ZN7Network7addNodeEP9Componenth($52,$53,$56);
 label=66;break;
 case 15: 
 var $59=$cmd;
 var $60=($59|0)==12;
 if($60){label=16;break;}else{label=19;break;}
 case 16: 
 label=17;break;
 case 17: 
 var $63=$6;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($63,3,13);
 label=18;break;
 case 18: 
 var $65=(($6+4)|0);
 var $66=HEAP32[(($65)>>2)];
 var $67=(($6+13)|0);
 var $68=(($67+1)|0);
 var $69=HEAP8[(($68)>>0)];
 var $70=(($6+13)|0);
 var $71=(($70+3)|0);
 var $72=HEAP8[(($71)>>0)];
 var $73=(($6+13)|0);
 var $74=(($73+2)|0);
 var $75=HEAP8[(($74)>>0)];
 var $76=(($6+13)|0);
 var $77=(($76+4)|0);
 var $78=HEAP8[(($77)>>0)];
 __ZN7Network7connectEhaha($66,$69,$72,$75,$78);
 label=65;break;
 case 19: 
 var $80=$cmd;
 var $81=($80|0)==13;
 if($81){label=20;break;}else{label=39;break;}
 case 20: 
 var $83=(($6+13)|0);
 var $84=(($83+3)|0);
 var $85=HEAP8[(($84)>>0)];
 var $86=($85&255);
 $packetType=$86;
 __ZN6PacketC1Ev($p);
 var $87=$packetType;
 var $88=($87|0)==9;
 if($88){label=23;break;}else{label=21;break;}
 case 21: 
 var $90=$packetType;
 var $91=($90|0)==10;
 if($91){label=23;break;}else{label=22;break;}
 case 22: 
 var $93=$packetType;
 var $94=($93|0)==3;
 if($94){label=23;break;}else{label=24;break;}
 case 23: 
 var $96=$packetType;
 __ZN6PacketC1E3Msg($2,$96);
 var $97=$p;
 var $98=$2;
 assert(8 % 1 === 0);HEAP32[(($97)>>2)]=HEAP32[(($98)>>2)];HEAP32[((($97)+(4))>>2)]=HEAP32[((($98)+(4))>>2)];
 label=33;break;
 case 24: 
 var $100=$packetType;
 var $101=($100|0)==7;
 if($101){label=25;break;}else{label=26;break;}
 case 25: 
 var $103=(($6+13)|0);
 var $104=(($103+4)|0);
 var $105=HEAP8[(($104)>>0)];
 var $106=($105&255);
 var $107=(($6+13)|0);
 var $108=(($107+5)|0);
 var $109=HEAP8[(($108)>>0)];
 var $110=($109&255);
 var $111=($110<<8);
 var $112=((($106)+($111))|0);
 var $113=(($6+13)|0);
 var $114=(($113+6)|0);
 var $115=HEAP8[(($114)>>0)];
 var $116=($115&255);
 var $117=($116<<16);
 var $118=((($112)+($117))|0);
 var $119=(($6+13)|0);
 var $120=(($119+7)|0);
 var $121=HEAP8[(($120)>>0)];
 var $122=($121&255);
 var $123=($122<<24);
 var $124=((($118)+($123))|0);
 $val=$124;
 var $125=$val;
 __ZN6PacketC1El($3,$125);
 var $126=$p;
 var $127=$3;
 assert(8 % 1 === 0);HEAP32[(($126)>>2)]=HEAP32[(($127)>>2)];HEAP32[((($126)+(4))>>2)]=HEAP32[((($127)+(4))>>2)];
 label=32;break;
 case 26: 
 var $129=$packetType;
 var $130=($129|0)==4;
 if($130){label=27;break;}else{label=28;break;}
 case 27: 
 var $132=(($6+13)|0);
 var $133=(($132+4)|0);
 var $134=HEAP8[(($133)>>0)];
 __ZN6PacketC1Eh($4,$134);
 var $135=$p;
 var $136=$4;
 assert(8 % 1 === 0);HEAP32[(($135)>>2)]=HEAP32[(($136)>>2)];HEAP32[((($135)+(4))>>2)]=HEAP32[((($136)+(4))>>2)];
 label=31;break;
 case 28: 
 var $138=$packetType;
 var $139=($138|0)==6;
 if($139){label=29;break;}else{label=30;break;}
 case 29: 
 var $141=(($6+13)|0);
 var $142=(($141+4)|0);
 var $143=HEAP8[(($142)>>0)];
 var $144=($143&255);
 var $145=($144|0)==0;
 var $146=$145^1;
 __ZN6PacketC1Eb($5,$146);
 var $147=$p;
 var $148=$5;
 assert(8 % 1 === 0);HEAP32[(($147)>>2)]=HEAP32[(($148)>>2)];HEAP32[((($147)+(4))>>2)]=HEAP32[((($148)+(4))>>2)];
 label=30;break;
 case 30: 
 label=31;break;
 case 31: 
 label=32;break;
 case 32: 
 label=33;break;
 case 33: 
 var $153=__ZNK6Packet7isValidEv($p);
 if($153){label=34;break;}else{label=35;break;}
 case 34: 
 var $155=(($6+4)|0);
 var $156=HEAP32[(($155)>>2)];
 var $157=(($6+13)|0);
 var $158=(($157+1)|0);
 var $159=HEAP8[(($158)>>0)];
 var $160=(($6+13)|0);
 var $161=(($160+2)|0);
 var $162=HEAP8[(($161)>>0)];
 __ZN7Network11sendMessageEhaRK6Packet($156,$159,$162,$p);
 var $163=(($6+8)|0);
 var $164=HEAP32[(($163)>>2)];
 var $165=$164;
 var $166=HEAP32[(($165)>>2)];
 var $167=(($166+8)|0);
 var $168=HEAP32[(($167)>>2)];
 FUNCTION_TABLE[$168]($164,32,1);
 label=38;break;
 case 35: 
 label=36;break;
 case 36: 
 var $171=$6;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($171,1,11);
 label=37;break;
 case 37: 
 label=38;break;
 case 38: 
 label=64;break;
 case 39: 
 var $175=$cmd;
 var $176=($175|0)==15;
 if($176){label=40;break;}else{label=41;break;}
 case 40: 
 var $178=(($6+4)|0);
 var $179=HEAP32[(($178)>>2)];
 var $180=(($6+13)|0);
 var $181=(($180+1)|0);
 var $182=HEAP8[(($181)>>0)];
 var $183=($182&255);
 __ZN7Network13setDebugLevelE10DebugLevel($179,$183);
 label=63;break;
 case 41: 
 var $185=$cmd;
 var $186=($185|0)==16;
 if($186){label=42;break;}else{label=43;break;}
 case 42: 
 var $188=(($6+4)|0);
 var $189=HEAP32[(($188)>>2)];
 var $190=(($6+13)|0);
 var $191=(($190+1)|0);
 var $192=HEAP8[(($191)>>0)];
 var $193=(($6+13)|0);
 var $194=(($193+2)|0);
 var $195=HEAP8[(($194)>>0)];
 var $196=(($6+13)|0);
 var $197=(($196+3)|0);
 var $198=HEAP8[(($197)>>0)];
 var $199=(($198<<24)>>24)!=0;
 __ZN7Network15subscribeToPortEhab($189,$192,$195,$199);
 label=62;break;
 case 43: 
 var $201=$cmd;
 var $202=($201|0)==17;
 if($202){label=44;break;}else{label=45;break;}
 case 44: 
 var $204=(($6+13)|0);
 var $205=(($204+1)|0);
 var $206=HEAP8[(($205)>>0)];
 var $207=($206&255);
 var $208=($207|0)!=0;
 var $209=($208&1);
 $isOutput=$209;
 var $210=(($6+13)|0);
 var $211=(($210+2)|0);
 var $212=HEAP8[(($211)>>0)];
 var $213=($212&255);
 $subgraphNode=$213;
 var $214=(($6+13)|0);
 var $215=(($214+3)|0);
 var $216=HEAP8[(($215)>>0)];
 var $217=($216&255);
 $subgraphPort=$217;
 var $218=(($6+13)|0);
 var $219=(($218+4)|0);
 var $220=HEAP8[(($219)>>0)];
 var $221=($220&255);
 $childNode=$221;
 var $222=(($6+13)|0);
 var $223=(($222+5)|0);
 var $224=HEAP8[(($223)>>0)];
 var $225=($224&255);
 $childPort=$225;
 var $226=(($6+4)|0);
 var $227=HEAP32[(($226)>>2)];
 var $228=$isOutput;
 var $229=(($228)&1);
 var $230=$subgraphNode;
 var $231=(($230)&255);
 var $232=$subgraphPort;
 var $233=(($232)&255);
 var $234=$childNode;
 var $235=(($234)&255);
 var $236=$childPort;
 var $237=(($236)&255);
 __ZN7Network15connectSubgraphEbhaha($227,$229,$231,$233,$235,$237);
 label=61;break;
 case 45: 
 var $239=$cmd;
 var $240=($239|0)==18;
 if($240){label=46;break;}else{label=47;break;}
 case 46: 
 var $242=(($cmd1)|0);
 HEAP8[(($242)>>0)]=109;
 var $243=(($242+1)|0);
 var $244=(($cmd1+1)|0);
 var $245=HEAP8[(($244)>>0)];
 HEAP8[(($243)>>0)]=$245;
 var $246=(($243+1)|0);
 var $247=(($cmd1+2)|0);
 var $248=HEAP8[(($247)>>0)];
 HEAP8[(($246)>>0)]=$248;
 var $249=(($246+1)|0);
 var $250=(($cmd1+3)|0);
 var $251=HEAP8[(($250)>>0)];
 HEAP8[(($249)>>0)]=$251;
 var $252=(($249+1)|0);
 var $253=(($cmd1+4)|0);
 var $254=HEAP8[(($253)>>0)];
 HEAP8[(($252)>>0)]=$254;
 var $255=(($252+1)|0);
 var $256=(($cmd1+5)|0);
 var $257=HEAP8[(($256)>>0)];
 HEAP8[(($255)>>0)]=$257;
 var $258=(($255+1)|0);
 var $259=(($cmd1+6)|0);
 var $260=HEAP8[(($259)>>0)];
 HEAP8[(($258)>>0)]=$260;
 var $261=(($258+1)|0);
 var $262=(($cmd1+7)|0);
 var $263=HEAP8[(($262)>>0)];
 HEAP8[(($261)>>0)]=$263;
 var $264=(($6+8)|0);
 var $265=HEAP32[(($264)>>2)];
 var $266=$265;
 var $267=HEAP32[(($266)>>2)];
 var $268=(($267+8)|0);
 var $269=HEAP32[(($268)>>2)];
 var $270=(($cmd1)|0);
 FUNCTION_TABLE[$269]($265,$270,8);
 label=60;break;
 case 47: 
 var $272=$cmd;
 var $273=($272|0)==21;
 if($273){label=48;break;}else{label=49;break;}
 case 48: 
 var $275=(($6+4)|0);
 var $276=HEAP32[(($275)>>2)];
 var $277=(($6+13)|0);
 var $278=(($277)|0);
 __ZN7Network10setIoValueEPKhh($276,$278,8);
 label=59;break;
 case 49: 
 var $280=$cmd;
 var $281=($280|0)>=115;
 if($281){label=50;break;}else{label=55;break;}
 case 50: 
 label=51;break;
 case 51: 
 var $284=(($6+13)|0);
 var $285=(($284)|0);
 var $286=_memcmp($285,3760,8);
 var $287=($286|0)==0;
 if($287){label=53;break;}else{label=52;break;}
 case 52: 
 var $289=$6;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($289,1,10);
 label=53;break;
 case 53: 
 label=54;break;
 case 54: 
 label=58;break;
 case 55: 
 label=56;break;
 case 56: 
 var $294=$6;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($294,1,9);
 label=57;break;
 case 57: 
 label=58;break;
 case 58: 
 label=59;break;
 case 59: 
 label=60;break;
 case 60: 
 label=61;break;
 case 61: 
 label=62;break;
 case 62: 
 label=63;break;
 case 63: 
 label=64;break;
 case 64: 
 label=65;break;
 case 65: 
 label=66;break;
 case 66: 
 label=67;break;
 case 67: 
 label=68;break;
 case 68: 
 label=69;break;
 case 69: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network5resetEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $i;
 $1=$this;
 var $2=$1;
 var $3=(($2+1016)|0);
 HEAP32[(($3)>>2)]=0;
 var $4=(($2+1008)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=($5|0)!=0;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 var $8=(($2+1008)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=$9;
 var $11=HEAP32[(($10)>>2)];
 var $12=(($11+24)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=(($2+1016)|0);
 var $15=HEAP32[(($14)>>2)];
 FUNCTION_TABLE[$13]($9,$15);
 label=3;break;
 case 3: 
 $i=0;
 label=4;break;
 case 4: 
 var $18=$i;
 var $19=($18|0)<50;
 if($19){label=5;break;}else{label=11;break;}
 case 5: 
 var $21=$i;
 var $22=(($2)|0);
 var $23=(($22+($21<<2))|0);
 var $24=HEAP32[(($23)>>2)];
 var $25=($24|0)!=0;
 if($25){label=6;break;}else{label=9;break;}
 case 6: 
 var $27=$i;
 var $28=(($2)|0);
 var $29=(($28+($27<<2))|0);
 var $30=HEAP32[(($29)>>2)];
 var $31=($30|0)==0;
 if($31){label=8;break;}else{label=7;break;}
 case 7: 
 var $33=$30;
 var $34=HEAP32[(($33)>>2)];
 var $35=(($34+4)|0);
 var $36=HEAP32[(($35)>>2)];
 FUNCTION_TABLE[$36]($30);
 label=8;break;
 case 8: 
 var $38=$i;
 var $39=(($2)|0);
 var $40=(($39+($38<<2))|0);
 HEAP32[(($40)>>2)]=0;
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 var $43=$i;
 var $44=((($43)+(1))|0);
 $i=$44;
 label=4;break;
 case 11: 
 var $46=(($2+200)|0);
 HEAP8[(($46)>>0)]=1;
 var $47=(($2+1004)|0);
 HEAP8[(($47)>>0)]=0;
 var $48=(($2+1005)|0);
 HEAP8[(($48)>>0)]=0;
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network5startEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+1016)|0);
 HEAP32[(($3)>>2)]=1;
 var $4=(($2+1008)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=($5|0)!=0;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 var $8=(($2+1008)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=$9;
 var $11=HEAP32[(($10)>>2)];
 var $12=(($11+24)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=(($2+1016)|0);
 var $15=HEAP32[(($14)>>2)];
 FUNCTION_TABLE[$13]($9,$15);
 label=3;break;
 case 3: 
 __ZN7Network8runSetupEv($2);
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9Component6createE11ComponentId($id){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $c;
 var $3;
 var $4;
 $2=$id;
 var $5=$2;
 switch(($5|0)){case 52:{ label=101;break;}case 53:{ label=104;break;}case 54:{ label=107;break;}case 4:{ label=11;break;}case 55:{ label=110;break;}case 100:{ label=113;break;}case 5:{ label=14;break;}case 6:{ label=17;break;}case 1:{ label=2;break;}case 7:{ label=20;break;}case 8:{ label=23;break;}case 9:{ label=26;break;}case 10:{ label=29;break;}case 11:{ label=32;break;}case 12:{ label=35;break;}case 13:{ label=38;break;}case 14:{ label=41;break;}case 16:{ label=44;break;}case 17:{ label=47;break;}case 2:{ label=5;break;}case 18:{ label=50;break;}case 19:{ label=53;break;}case 20:{ label=56;break;}case 21:{ label=59;break;}case 22:{ label=62;break;}case 23:{ label=65;break;}case 24:{ label=68;break;}case 25:{ label=71;break;}case 26:{ label=74;break;}case 27:{ label=77;break;}case 3:{ label=8;break;}case 28:{ label=80;break;}case 29:{ label=83;break;}case 30:{ label=86;break;}case 31:{ label=89;break;}case 32:{ label=92;break;}case 50:{ label=95;break;}case 51:{ label=98;break;}default:{label=116;break;}}break;
 case 2: 
 var $7=__Znwj(36);
 var $8=$7;
 (function() { try { __THREW__ = 0; return __ZN8PwmWriteC1Ev($8) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=3;break; } else { label=4;break; }
 case 3: 
 var $10=$8;
 $c=$10;
 var $11=$2;
 var $12=(($11)&255);
 var $13=$c;
 var $14=(($13+21)|0);
 HEAP8[(($14)>>0)]=$12;
 var $15=$c;
 $1=$15;
 label=117;break;
 case 4: 
 var $17$0 = ___cxa_find_matching_catch(-1, -1); var $17$1 = tempRet0;
 var $18=$17$0;
 $3=$18;
 var $19=$17$1;
 $4=$19;
 __ZdlPv($7);
 label=118;break;
 case 5: 
 var $21=__Znwj(36);
 var $22=$21;
 (function() { try { __THREW__ = 0; return __ZN10AnalogReadC1Ev($22) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=6;break; } else { label=7;break; }
 case 6: 
 var $24=$22;
 $c=$24;
 var $25=$2;
 var $26=(($25)&255);
 var $27=$c;
 var $28=(($27+21)|0);
 HEAP8[(($28)>>0)]=$26;
 var $29=$c;
 $1=$29;
 label=117;break;
 case 7: 
 var $31$0 = ___cxa_find_matching_catch(-1, -1); var $31$1 = tempRet0;
 var $32=$31$0;
 $3=$32;
 var $33=$31$1;
 $4=$33;
 __ZdlPv($21);
 label=118;break;
 case 8: 
 var $35=__Znwj(32);
 var $36=$35;
 (function() { try { __THREW__ = 0; return __ZN7ForwardC1Ev($36) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=9;break; } else { label=10;break; }
 case 9: 
 var $38=$36;
 $c=$38;
 var $39=$2;
 var $40=(($39)&255);
 var $41=$c;
 var $42=(($41+21)|0);
 HEAP8[(($42)>>0)]=$40;
 var $43=$c;
 $1=$43;
 label=117;break;
 case 10: 
 var $45$0 = ___cxa_find_matching_catch(-1, -1); var $45$1 = tempRet0;
 var $46=$45$0;
 $3=$46;
 var $47=$45$1;
 $4=$47;
 __ZdlPv($35);
 label=118;break;
 case 11: 
 var $49=__Znwj(40);
 var $50=$49;
 (function() { try { __THREW__ = 0; return __ZN5CountC1Ev($50) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=12;break; } else { label=13;break; }
 case 12: 
 var $52=$50;
 $c=$52;
 var $53=$2;
 var $54=(($53)&255);
 var $55=$c;
 var $56=(($55+21)|0);
 HEAP8[(($56)>>0)]=$54;
 var $57=$c;
 $1=$57;
 label=117;break;
 case 13: 
 var $59$0 = ___cxa_find_matching_catch(-1, -1); var $59$1 = tempRet0;
 var $60=$59$0;
 $3=$60;
 var $61=$59$1;
 $4=$61;
 __ZdlPv($49);
 label=118;break;
 case 14: 
 var $63=__Znwj(36);
 var $64=$63;
 (function() { try { __THREW__ = 0; return __ZN12DigitalWriteC1Ev($64) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=15;break; } else { label=16;break; }
 case 15: 
 var $66=$64;
 $c=$66;
 var $67=$2;
 var $68=(($67)&255);
 var $69=$c;
 var $70=(($69+21)|0);
 HEAP8[(($70)>>0)]=$68;
 var $71=$c;
 $1=$71;
 label=117;break;
 case 16: 
 var $73$0 = ___cxa_find_matching_catch(-1, -1); var $73$1 = tempRet0;
 var $74=$73$0;
 $3=$74;
 var $75=$73$1;
 $4=$75;
 __ZdlPv($63);
 label=118;break;
 case 17: 
 var $77=__Znwj(36);
 var $78=$77;
 (function() { try { __THREW__ = 0; return __ZN11DigitalReadC1Ev($78) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=18;break; } else { label=19;break; }
 case 18: 
 var $80=$78;
 $c=$80;
 var $81=$2;
 var $82=(($81)&255);
 var $83=$c;
 var $84=(($83+21)|0);
 HEAP8[(($84)>>0)]=$82;
 var $85=$c;
 $1=$85;
 label=117;break;
 case 19: 
 var $87$0 = ___cxa_find_matching_catch(-1, -1); var $87$1 = tempRet0;
 var $88=$87$0;
 $3=$88;
 var $89=$87$1;
 $4=$89;
 __ZdlPv($77);
 label=118;break;
 case 20: 
 var $91=__Znwj(40);
 var $92=$91;
 (function() { try { __THREW__ = 0; return __ZN5TimerC1Ev($92) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=21;break; } else { label=22;break; }
 case 21: 
 var $94=$92;
 $c=$94;
 var $95=$2;
 var $96=(($95)&255);
 var $97=$c;
 var $98=(($97+21)|0);
 HEAP8[(($98)>>0)]=$96;
 var $99=$c;
 $1=$99;
 label=117;break;
 case 22: 
 var $101$0 = ___cxa_find_matching_catch(-1, -1); var $101$1 = tempRet0;
 var $102=$101$0;
 $3=$102;
 var $103=$101$1;
 $4=$103;
 __ZdlPv($91);
 label=118;break;
 case 23: 
 var $105=__Znwj(32);
 var $106=$105;
 (function() { try { __THREW__ = 0; return __ZN8SerialInC1Ev($106) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=24;break; } else { label=25;break; }
 case 24: 
 var $108=$106;
 $c=$108;
 var $109=$2;
 var $110=(($109)&255);
 var $111=$c;
 var $112=(($111+21)|0);
 HEAP8[(($112)>>0)]=$110;
 var $113=$c;
 $1=$113;
 label=117;break;
 case 25: 
 var $115$0 = ___cxa_find_matching_catch(-1, -1); var $115$1 = tempRet0;
 var $116=$115$0;
 $3=$116;
 var $117=$115$1;
 $4=$117;
 __ZdlPv($105);
 label=118;break;
 case 26: 
 var $119=__Znwj(32);
 var $120=$119;
 (function() { try { __THREW__ = 0; return __ZN9SerialOutC1Ev($120) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=27;break; } else { label=28;break; }
 case 27: 
 var $122=$120;
 $c=$122;
 var $123=$2;
 var $124=(($123)&255);
 var $125=$c;
 var $126=(($125+21)|0);
 HEAP8[(($126)>>0)]=$124;
 var $127=$c;
 $1=$127;
 label=117;break;
 case 28: 
 var $129$0 = ___cxa_find_matching_catch(-1, -1); var $129$1 = tempRet0;
 var $130=$129$0;
 $3=$130;
 var $131=$129$1;
 $4=$131;
 __ZdlPv($119);
 label=118;break;
 case 29: 
 var $133=__Znwj(32);
 var $134=$133;
 (function() { try { __THREW__ = 0; return __ZN13InvertBooleanC1Ev($134) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=30;break; } else { label=31;break; }
 case 30: 
 var $136=$134;
 $c=$136;
 var $137=$2;
 var $138=(($137)&255);
 var $139=$c;
 var $140=(($139+21)|0);
 HEAP8[(($140)>>0)]=$138;
 var $141=$c;
 $1=$141;
 label=117;break;
 case 31: 
 var $143$0 = ___cxa_find_matching_catch(-1, -1); var $143$1 = tempRet0;
 var $144=$143$0;
 $3=$144;
 var $145=$143$1;
 $4=$145;
 __ZdlPv($133);
 label=118;break;
 case 32: 
 var $147=__Znwj(36);
 var $148=$147;
 (function() { try { __THREW__ = 0; return __ZN13ToggleBooleanC1Ev($148) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=33;break; } else { label=34;break; }
 case 33: 
 var $150=$148;
 $c=$150;
 var $151=$2;
 var $152=(($151)&255);
 var $153=$c;
 var $154=(($153+21)|0);
 HEAP8[(($154)>>0)]=$152;
 var $155=$c;
 $1=$155;
 label=117;break;
 case 34: 
 var $157$0 = ___cxa_find_matching_catch(-1, -1); var $157$1 = tempRet0;
 var $158=$157$0;
 $3=$158;
 var $159=$157$1;
 $4=$159;
 __ZdlPv($147);
 label=118;break;
 case 35: 
 var $161=__Znwj(44);
 var $162=$161;
 (function() { try { __THREW__ = 0; return __ZN15HysteresisLatchC1Ev($162) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=36;break; } else { label=37;break; }
 case 36: 
 var $164=$162;
 $c=$164;
 var $165=$2;
 var $166=(($165)&255);
 var $167=$c;
 var $168=(($167+21)|0);
 HEAP8[(($168)>>0)]=$166;
 var $169=$c;
 $1=$169;
 label=117;break;
 case 37: 
 var $171$0 = ___cxa_find_matching_catch(-1, -1); var $171$1 = tempRet0;
 var $172=$171$0;
 $3=$172;
 var $173=$171$1;
 $4=$173;
 __ZdlPv($161);
 label=118;break;
 case 38: 
 var $175=__Znwj(24);
 var $176=$175;
 (function() { try { __THREW__ = 0; return __ZN21ReadDallasTemperatureC1Ev($176) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=39;break; } else { label=40;break; }
 case 39: 
 var $178=$176;
 $c=$178;
 var $179=$2;
 var $180=(($179)&255);
 var $181=$c;
 var $182=(($181+21)|0);
 HEAP8[(($182)>>0)]=$180;
 var $183=$c;
 $1=$183;
 label=117;break;
 case 40: 
 var $185$0 = ___cxa_find_matching_catch(-1, -1); var $185$1 = tempRet0;
 var $186=$185$0;
 $3=$186;
 var $187=$185$1;
 $4=$187;
 __ZdlPv($175);
 label=118;break;
 case 41: 
 var $189=__Znwj(108);
 var $190=$189;
 (function() { try { __THREW__ = 0; return __ZN5RouteC1Ev($190) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=42;break; } else { label=43;break; }
 case 42: 
 var $192=$190;
 $c=$192;
 var $193=$2;
 var $194=(($193)&255);
 var $195=$c;
 var $196=(($195+21)|0);
 HEAP8[(($196)>>0)]=$194;
 var $197=$c;
 $1=$197;
 label=117;break;
 case 43: 
 var $199$0 = ___cxa_find_matching_catch(-1, -1); var $199$1 = tempRet0;
 var $200=$199$0;
 $3=$200;
 var $201=$199$1;
 $4=$201;
 __ZdlPv($189);
 label=118;break;
 case 44: 
 var $203=__Znwj(44);
 var $204=$203;
 (function() { try { __THREW__ = 0; return __ZN15BreakBeforeMakeC1Ev($204) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=45;break; } else { label=46;break; }
 case 45: 
 var $206=$204;
 $c=$206;
 var $207=$2;
 var $208=(($207)&255);
 var $209=$c;
 var $210=(($209+21)|0);
 HEAP8[(($210)>>0)]=$208;
 var $211=$c;
 $1=$211;
 label=117;break;
 case 46: 
 var $213$0 = ___cxa_find_matching_catch(-1, -1); var $213$1 = tempRet0;
 var $214=$213$0;
 $3=$214;
 var $215=$213$1;
 $4=$215;
 __ZdlPv($203);
 label=118;break;
 case 47: 
 var $217=__Znwj(48);
 var $218=$217;
 (function() { try { __THREW__ = 0; return __ZN9MapLinearC1Ev($218) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=48;break; } else { label=49;break; }
 case 48: 
 var $220=$218;
 $c=$220;
 var $221=$2;
 var $222=(($221)&255);
 var $223=$c;
 var $224=(($223+21)|0);
 HEAP8[(($224)>>0)]=$222;
 var $225=$c;
 $1=$225;
 label=117;break;
 case 49: 
 var $227$0 = ___cxa_find_matching_catch(-1, -1); var $227$1 = tempRet0;
 var $228=$227$0;
 $3=$228;
 var $229=$227$1;
 $4=$229;
 __ZdlPv($217);
 label=118;break;
 case 50: 
 var $231=__Znwj(36);
 var $232=$231;
 (function() { try { __THREW__ = 0; return __ZN10MonitorPinC1Ev($232) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=51;break; } else { label=52;break; }
 case 51: 
 var $234=$232;
 $c=$234;
 var $235=$2;
 var $236=(($235)&255);
 var $237=$c;
 var $238=(($237+21)|0);
 HEAP8[(($238)>>0)]=$236;
 var $239=$c;
 $1=$239;
 label=117;break;
 case 52: 
 var $241$0 = ___cxa_find_matching_catch(-1, -1); var $241$1 = tempRet0;
 var $242=$241$0;
 $3=$242;
 var $243=$241$1;
 $4=$243;
 __ZdlPv($231);
 label=118;break;
 case 53: 
 var $245=__Znwj(96);
 var $246=$245;
 (function() { try { __THREW__ = 0; return __ZN5SplitC1Ev($246) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=54;break; } else { label=55;break; }
 case 54: 
 var $248=$246;
 $c=$248;
 var $249=$2;
 var $250=(($249)&255);
 var $251=$c;
 var $252=(($251+21)|0);
 HEAP8[(($252)>>0)]=$250;
 var $253=$c;
 $1=$253;
 label=117;break;
 case 55: 
 var $255$0 = ___cxa_find_matching_catch(-1, -1); var $255$1 = tempRet0;
 var $256=$255$0;
 $3=$256;
 var $257=$255$1;
 $4=$257;
 __ZdlPv($245);
 label=118;break;
 case 56: 
 var $259=__Znwj(44);
 var $260=$259;
 (function() { try { __THREW__ = 0; return __ZN4GateC1Ev($260) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=57;break; } else { label=58;break; }
 case 57: 
 var $262=$260;
 $c=$262;
 var $263=$2;
 var $264=(($263)&255);
 var $265=$c;
 var $266=(($265+21)|0);
 HEAP8[(($266)>>0)]=$264;
 var $267=$c;
 $1=$267;
 label=117;break;
 case 58: 
 var $269$0 = ___cxa_find_matching_catch(-1, -1); var $269$1 = tempRet0;
 var $270=$269$0;
 $3=$270;
 var $271=$269$1;
 $4=$271;
 __ZdlPv($259);
 label=118;break;
 case 59: 
 var $273=__Znwj(36);
 var $274=$273;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I9BooleanOrbbEC1Ev($274) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=60;break; } else { label=61;break; }
 case 60: 
 var $276=$274;
 $c=$276;
 var $277=$2;
 var $278=(($277)&255);
 var $279=$c;
 var $280=(($279+21)|0);
 HEAP8[(($280)>>0)]=$278;
 var $281=$c;
 $1=$281;
 label=117;break;
 case 61: 
 var $283$0 = ___cxa_find_matching_catch(-1, -1); var $283$1 = tempRet0;
 var $284=$283$0;
 $3=$284;
 var $285=$283$1;
 $4=$285;
 __ZdlPv($273);
 label=118;break;
 case 62: 
 var $287=__Znwj(36);
 var $288=$287;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I10BooleanAndbbEC1Ev($288) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=63;break; } else { label=64;break; }
 case 63: 
 var $290=$288;
 $c=$290;
 var $291=$2;
 var $292=(($291)&255);
 var $293=$c;
 var $294=(($293+21)|0);
 HEAP8[(($294)>>0)]=$292;
 var $295=$c;
 $1=$295;
 label=117;break;
 case 64: 
 var $297$0 = ___cxa_find_matching_catch(-1, -1); var $297$1 = tempRet0;
 var $298=$297$0;
 $3=$298;
 var $299=$297$1;
 $4=$299;
 __ZdlPv($287);
 label=118;break;
 case 65: 
 var $301=__Znwj(24);
 var $302=$301;
 (function() { try { __THREW__ = 0; return __ZN17ReadCapacitivePinC1Ev($302) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=66;break; } else { label=67;break; }
 case 66: 
 var $304=$302;
 $c=$304;
 var $305=$2;
 var $306=(($305)&255);
 var $307=$c;
 var $308=(($307+21)|0);
 HEAP8[(($308)>>0)]=$306;
 var $309=$c;
 $1=$309;
 label=117;break;
 case 67: 
 var $311$0 = ___cxa_find_matching_catch(-1, -1); var $311$1 = tempRet0;
 var $312=$311$0;
 $3=$312;
 var $313=$311$1;
 $4=$313;
 __ZdlPv($301);
 label=118;break;
 case 68: 
 var $315=__Znwj(44);
 var $316=$315;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I12NumberEqualsllEC1Ev($316) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=69;break; } else { label=70;break; }
 case 69: 
 var $318=$316;
 $c=$318;
 var $319=$2;
 var $320=(($319)&255);
 var $321=$c;
 var $322=(($321+21)|0);
 HEAP8[(($322)>>0)]=$320;
 var $323=$c;
 $1=$323;
 label=117;break;
 case 70: 
 var $325$0 = ___cxa_find_matching_catch(-1, -1); var $325$1 = tempRet0;
 var $326=$325$0;
 $3=$326;
 var $327=$325$1;
 $4=$327;
 __ZdlPv($315);
 label=118;break;
 case 71: 
 var $329=__Znwj(44);
 var $330=$329;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I3MinllEC1Ev($330) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=72;break; } else { label=73;break; }
 case 72: 
 var $332=$330;
 $c=$332;
 var $333=$2;
 var $334=(($333)&255);
 var $335=$c;
 var $336=(($335+21)|0);
 HEAP8[(($336)>>0)]=$334;
 var $337=$c;
 $1=$337;
 label=117;break;
 case 73: 
 var $339$0 = ___cxa_find_matching_catch(-1, -1); var $339$1 = tempRet0;
 var $340=$339$0;
 $3=$340;
 var $341=$339$1;
 $4=$341;
 __ZdlPv($329);
 label=118;break;
 case 74: 
 var $343=__Znwj(44);
 var $344=$343;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I3MaxllEC1Ev($344) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=75;break; } else { label=76;break; }
 case 75: 
 var $346=$344;
 $c=$346;
 var $347=$2;
 var $348=(($347)&255);
 var $349=$c;
 var $350=(($349+21)|0);
 HEAP8[(($350)>>0)]=$348;
 var $351=$c;
 $1=$351;
 label=117;break;
 case 76: 
 var $353$0 = ___cxa_find_matching_catch(-1, -1); var $353$1 = tempRet0;
 var $354=$353$0;
 $3=$354;
 var $355=$353$1;
 $4=$355;
 __ZdlPv($343);
 label=118;break;
 case 77: 
 var $357=__Znwj(44);
 var $358=$357;
 (function() { try { __THREW__ = 0; return __ZN9ConstrainC1Ev($358) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=78;break; } else { label=79;break; }
 case 78: 
 var $360=$358;
 $c=$360;
 var $361=$2;
 var $362=(($361)&255);
 var $363=$c;
 var $364=(($363+21)|0);
 HEAP8[(($364)>>0)]=$362;
 var $365=$c;
 $1=$365;
 label=117;break;
 case 79: 
 var $367$0 = ___cxa_find_matching_catch(-1, -1); var $367$1 = tempRet0;
 var $368=$367$0;
 $3=$368;
 var $369=$367$1;
 $4=$369;
 __ZdlPv($357);
 label=118;break;
 case 80: 
 var $371=__Znwj(48);
 var $372=$371;
 (function() { try { __THREW__ = 0; return __ZN12LedMatrixMaxC1Ev($372) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=81;break; } else { label=82;break; }
 case 81: 
 var $374=$372;
 $c=$374;
 var $375=$2;
 var $376=(($375)&255);
 var $377=$c;
 var $378=(($377+21)|0);
 HEAP8[(($378)>>0)]=$376;
 var $379=$c;
 $1=$379;
 label=117;break;
 case 82: 
 var $381$0 = ___cxa_find_matching_catch(-1, -1); var $381$1 = tempRet0;
 var $382=$381$0;
 $3=$382;
 var $383=$381$1;
 $4=$383;
 __ZdlPv($371);
 label=118;break;
 case 83: 
 var $385=__Znwj(48);
 var $386=$385;
 (function() { try { __THREW__ = 0; return __ZN16LedChainNeoPixelC1Ev($386) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=84;break; } else { label=85;break; }
 case 84: 
 var $388=$386;
 $c=$388;
 var $389=$2;
 var $390=(($389)&255);
 var $391=$c;
 var $392=(($391+21)|0);
 HEAP8[(($392)>>0)]=$390;
 var $393=$c;
 $1=$393;
 label=117;break;
 case 85: 
 var $395$0 = ___cxa_find_matching_catch(-1, -1); var $395$1 = tempRet0;
 var $396=$395$0;
 $3=$396;
 var $397=$395$1;
 $4=$397;
 __ZdlPv($385);
 label=118;break;
 case 86: 
 var $399=__Znwj(52);
 var $400=$399;
 (function() { try { __THREW__ = 0; return __ZN14PseudoPwmWriteC1Ev($400) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=87;break; } else { label=88;break; }
 case 87: 
 var $402=$400;
 $c=$402;
 var $403=$2;
 var $404=(($403)&255);
 var $405=$c;
 var $406=(($405+21)|0);
 HEAP8[(($406)>>0)]=$404;
 var $407=$c;
 $1=$407;
 label=117;break;
 case 88: 
 var $409$0 = ___cxa_find_matching_catch(-1, -1); var $409$1 = tempRet0;
 var $410=$409$0;
 $3=$410;
 var $411=$409$1;
 $4=$411;
 __ZdlPv($399);
 label=118;break;
 case 89: 
 var $413=__Znwj(48);
 var $414=$413;
 (function() { try { __THREW__ = 0; return __ZN10LedChainWSC1Ev($414) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=90;break; } else { label=91;break; }
 case 90: 
 var $416=$414;
 $c=$416;
 var $417=$2;
 var $418=(($417)&255);
 var $419=$c;
 var $420=(($419+21)|0);
 HEAP8[(($420)>>0)]=$418;
 var $421=$c;
 $1=$421;
 label=117;break;
 case 91: 
 var $423$0 = ___cxa_find_matching_catch(-1, -1); var $423$1 = tempRet0;
 var $424=$423$0;
 $3=$424;
 var $425=$423$1;
 $4=$425;
 __ZdlPv($413);
 label=118;break;
 case 92: 
 var $427=__Znwj(32);
 var $428=$427;
 (function() { try { __THREW__ = 0; return __ZN9BoolToIntC1Ev($428) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=93;break; } else { label=94;break; }
 case 93: 
 var $430=$428;
 $c=$430;
 var $431=$2;
 var $432=(($431)&255);
 var $433=$c;
 var $434=(($433+21)|0);
 HEAP8[(($434)>>0)]=$432;
 var $435=$c;
 $1=$435;
 label=117;break;
 case 94: 
 var $437$0 = ___cxa_find_matching_catch(-1, -1); var $437$1 = tempRet0;
 var $438=$437$0;
 $3=$438;
 var $439=$437$1;
 $4=$439;
 __ZdlPv($427);
 label=118;break;
 case 95: 
 var $441=__Znwj(184);
 var $442=$441;
 (function() { try { __THREW__ = 0; return __ZN10ArduinoUnoC1Ev($442) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=96;break; } else { label=97;break; }
 case 96: 
 var $444=$442;
 $c=$444;
 var $445=$2;
 var $446=(($445)&255);
 var $447=$c;
 var $448=(($447+21)|0);
 HEAP8[(($448)>>0)]=$446;
 var $449=$c;
 $1=$449;
 label=117;break;
 case 97: 
 var $451$0 = ___cxa_find_matching_catch(-1, -1); var $451$1 = tempRet0;
 var $452=$451$0;
 $3=$452;
 var $453=$451$1;
 $4=$453;
 __ZdlPv($441);
 label=118;break;
 case 98: 
 var $455=__Znwj(400);
 var $456=$455;
 (function() { try { __THREW__ = 0; return __ZN8ATUSBKEYC1Ev($456) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=99;break; } else { label=100;break; }
 case 99: 
 var $458=$456;
 $c=$458;
 var $459=$2;
 var $460=(($459)&255);
 var $461=$c;
 var $462=(($461+21)|0);
 HEAP8[(($462)>>0)]=$460;
 var $463=$c;
 $1=$463;
 label=117;break;
 case 100: 
 var $465$0 = ___cxa_find_matching_catch(-1, -1); var $465$1 = tempRet0;
 var $466=$465$0;
 $3=$466;
 var $467=$465$1;
 $4=$467;
 __ZdlPv($455);
 label=118;break;
 case 101: 
 var $469=__Znwj(24);
 var $470=$469;
 (function() { try { __THREW__ = 0; return __ZN7MbedLPCC1Ev($470) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=102;break; } else { label=103;break; }
 case 102: 
 var $472=$470;
 $c=$472;
 var $473=$2;
 var $474=(($473)&255);
 var $475=$c;
 var $476=(($475+21)|0);
 HEAP8[(($476)>>0)]=$474;
 var $477=$c;
 $1=$477;
 label=117;break;
 case 103: 
 var $479$0 = ___cxa_find_matching_catch(-1, -1); var $479$1 = tempRet0;
 var $480=$479$0;
 $3=$480;
 var $481=$479$1;
 $4=$481;
 __ZdlPv($469);
 label=118;break;
 case 104: 
 var $483=__Znwj(24);
 var $484=$483;
 (function() { try { __THREW__ = 0; return __ZN11RaspberryPiC1Ev($484) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=105;break; } else { label=106;break; }
 case 105: 
 var $486=$484;
 $c=$486;
 var $487=$2;
 var $488=(($487)&255);
 var $489=$c;
 var $490=(($489+21)|0);
 HEAP8[(($490)>>0)]=$488;
 var $491=$c;
 $1=$491;
 label=117;break;
 case 106: 
 var $493$0 = ___cxa_find_matching_catch(-1, -1); var $493$1 = tempRet0;
 var $494=$493$0;
 $3=$494;
 var $495=$493$1;
 $4=$495;
 __ZdlPv($483);
 label=118;break;
 case 107: 
 var $497=__Znwj(24);
 var $498=$497;
 (function() { try { __THREW__ = 0; return __ZN5TivaCC1Ev($498) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=108;break; } else { label=109;break; }
 case 108: 
 var $500=$498;
 $c=$500;
 var $501=$2;
 var $502=(($501)&255);
 var $503=$c;
 var $504=(($503+21)|0);
 HEAP8[(($504)>>0)]=$502;
 var $505=$c;
 $1=$505;
 label=117;break;
 case 109: 
 var $507$0 = ___cxa_find_matching_catch(-1, -1); var $507$1 = tempRet0;
 var $508=$507$0;
 $3=$508;
 var $509=$507$1;
 $4=$509;
 __ZdlPv($497);
 label=118;break;
 case 110: 
 var $511=__Znwj(32);
 var $512=$511;
 (function() { try { __THREW__ = 0; return __ZN9ForwardIfC1Ev($512) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=111;break; } else { label=112;break; }
 case 111: 
 var $514=$512;
 $c=$514;
 var $515=$2;
 var $516=(($515)&255);
 var $517=$c;
 var $518=(($517+21)|0);
 HEAP8[(($518)>>0)]=$516;
 var $519=$c;
 $1=$519;
 label=117;break;
 case 112: 
 var $521$0 = ___cxa_find_matching_catch(-1, -1); var $521$1 = tempRet0;
 var $522=$521$0;
 $3=$522;
 var $523=$521$1;
 $4=$523;
 __ZdlPv($511);
 label=118;break;
 case 113: 
 var $525=__Znwj(184);
 var $526=$525;
 (function() { try { __THREW__ = 0; return __ZN8SubGraphC2Ev($526) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=114;break; } else { label=115;break; }
 case 114: 
 var $528=$526;
 $c=$528;
 var $529=$2;
 var $530=(($529)&255);
 var $531=$c;
 var $532=(($531+21)|0);
 HEAP8[(($532)>>0)]=$530;
 var $533=$c;
 $1=$533;
 label=117;break;
 case 115: 
 var $535$0 = ___cxa_find_matching_catch(-1, -1); var $535$1 = tempRet0;
 var $536=$535$0;
 $3=$536;
 var $537=$535$1;
 $4=$537;
 __ZdlPv($525);
 label=118;break;
 case 116: 
 $1=0;
 label=117;break;
 case 117: 
 var $540=$1;
 STACKTOP=sp;return $540;
 case 118: 
 var $542=$3;
 var $543=$4;
 var $544$0=$542;
 var $544$1=0;
 var $545$0=$544$0;
 var $545$1=$543;
 ___resumeException($545$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network7addNodeEP9Componenth($this,$node,$parentId){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 var $nodeId;
 $2=$this;
 $3=$node;
 $4=$parentId;
 var $5=$2;
 label=2;break;
 case 2: 
 var $7=$3;
 var $8=($7|0)!=0;
 if($8){label=4;break;}else{label=3;break;}
 case 3: 
 var $10=(($5+1008)|0);
 var $11=HEAP32[(($10)>>2)];
 var $12=$11;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($12,1,15);
 $1=0;
 label=14;break;
 case 4: 
 label=5;break;
 case 5: 
 label=6;break;
 case 6: 
 var $16=$4;
 var $17=($16&255);
 var $18=(($5+200)|0);
 var $19=HEAP8[(($18)>>0)];
 var $20=($19&255);
 var $21=($17|0)<=($20|0);
 if($21){label=8;break;}else{label=7;break;}
 case 7: 
 var $23=(($5+1008)|0);
 var $24=HEAP32[(($23)>>2)];
 var $25=$24;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($25,1,24);
 $1=0;
 label=14;break;
 case 8: 
 label=9;break;
 case 9: 
 var $28=(($5+200)|0);
 var $29=HEAP8[(($28)>>0)];
 var $30=($29&255);
 $nodeId=$30;
 var $31=$3;
 var $32=$nodeId;
 var $33=(($5)|0);
 var $34=(($33+($32<<2))|0);
 HEAP32[(($34)>>2)]=$31;
 var $35=$3;
 var $36=$nodeId;
 var $37=(($5+1012)|0);
 var $38=HEAP32[(($37)>>2)];
 __ZN9Component10setNetworkEP7NetworkiP2IO($35,$5,$36,$38);
 var $39=$4;
 var $40=($39&255);
 var $41=($40|0)>0;
 if($41){label=10;break;}else{label=11;break;}
 case 10: 
 var $43=$3;
 var $44=$4;
 var $45=($44&255);
 __ZN9Component9setParentEi($43,$45);
 label=11;break;
 case 11: 
 var $47=(($5+1008)|0);
 var $48=HEAP32[(($47)>>2)];
 var $49=($48|0)!=0;
 if($49){label=12;break;}else{label=13;break;}
 case 12: 
 var $51=(($5+1008)|0);
 var $52=HEAP32[(($51)>>2)];
 var $53=$52;
 var $54=HEAP32[(($53)>>2)];
 var $55=(($54+16)|0);
 var $56=HEAP32[(($55)>>2)];
 var $57=$3;
 var $58=$4;
 FUNCTION_TABLE[$56]($52,$57,$58);
 label=13;break;
 case 13: 
 var $60=(($5+200)|0);
 var $61=HEAP8[(($60)>>0)];
 var $62=((($61)+(1))&255);
 HEAP8[(($60)>>0)]=$62;
 var $63=$nodeId;
 var $64=(($63)&255);
 $1=$64;
 label=14;break;
 case 14: 
 var $66=$1;
 STACKTOP=sp;return $66;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network7connectEhaha($this,$srcId,$srcPort,$targetId,$targetPort){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 var $5;
 $1=$this;
 $2=$srcId;
 $3=$srcPort;
 $4=$targetId;
 $5=$targetPort;
 var $6=$1;
 label=2;break;
 case 2: 
 var $8=$2;
 var $9=($8&255);
 var $10=($9|0)>=1;
 if($10){label=3;break;}else{label=6;break;}
 case 3: 
 var $12=$2;
 var $13=($12&255);
 var $14=(($6+200)|0);
 var $15=HEAP8[(($14)>>0)];
 var $16=($15&255);
 var $17=($13|0)<=($16|0);
 if($17){label=4;break;}else{label=6;break;}
 case 4: 
 var $19=$4;
 var $20=($19&255);
 var $21=($20|0)>=1;
 if($21){label=5;break;}else{label=6;break;}
 case 5: 
 var $23=$4;
 var $24=($23&255);
 var $25=(($6+200)|0);
 var $26=HEAP8[(($25)>>0)];
 var $27=($26&255);
 var $28=($24|0)<=($27|0);
 if($28){label=7;break;}else{label=6;break;}
 case 6: 
 var $30=(($6+1008)|0);
 var $31=HEAP32[(($30)>>2)];
 var $32=$31;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($32,1,12);
 label=9;break;
 case 7: 
 label=8;break;
 case 8: 
 var $35=$2;
 var $36=($35&255);
 var $37=(($6)|0);
 var $38=(($37+($36<<2))|0);
 var $39=HEAP32[(($38)>>2)];
 var $40=$3;
 var $41=$4;
 var $42=($41&255);
 var $43=(($6)|0);
 var $44=(($43+($42<<2))|0);
 var $45=HEAP32[(($44)>>2)];
 var $46=$5;
 __ZN7Network7connectEP9ComponentaS1_a($6,$39,$40,$45,$46);
 label=9;break;
 case 9: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN6PacketC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN6PacketC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN6PacketC1E3Msg($this,$m){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$m;
 var $3=$1;
 var $4=$2;
 __ZN6PacketC2E3Msg($3,$4);
 STACKTOP=sp;return;
}


function __ZN6PacketC1El($this,$l){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$l;
 var $3=$1;
 var $4=$2;
 __ZN6PacketC2El($3,$4);
 STACKTOP=sp;return;
}


function __ZN6PacketC1Eh($this,$by){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$by;
 var $3=$1;
 var $4=$2;
 __ZN6PacketC2Eh($3,$4);
 STACKTOP=sp;return;
}


function __ZN6PacketC1Eb($this,$b){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 var $3=($b&1);
 $2=$3;
 var $4=$1;
 var $5=$2;
 var $6=(($5)&1);
 __ZN6PacketC2Eb($4,$6);
 STACKTOP=sp;return;
}


function __ZNK6Packet7isValidEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)>0;
 if($5){label=2;break;}else{var $11=0;label=3;break;}
 case 2: 
 var $7=(($2+4)|0);
 var $8=HEAP32[(($7)>>2)];
 var $9=($8|0)<11;
 var $11=$9;label=3;break;
 case 3: 
 var $11;
 STACKTOP=sp;return $11;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network11sendMessageEhaRK6Packet($this,$targetId,$targetPort,$pkg){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 $1=$this;
 $2=$targetId;
 $3=$targetPort;
 $4=$pkg;
 var $5=$1;
 label=2;break;
 case 2: 
 var $7=$2;
 var $8=($7&255);
 var $9=($8|0)>=1;
 if($9){label=3;break;}else{label=4;break;}
 case 3: 
 var $11=$2;
 var $12=($11&255);
 var $13=(($5+200)|0);
 var $14=HEAP8[(($13)>>0)];
 var $15=($14&255);
 var $16=($12|0)<=($15|0);
 if($16){label=5;break;}else{label=4;break;}
 case 4: 
 var $18=(($5+1008)|0);
 var $19=HEAP32[(($18)>>2)];
 var $20=$19;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($20,1,23);
 label=7;break;
 case 5: 
 label=6;break;
 case 6: 
 var $23=$2;
 var $24=($23&255);
 var $25=(($5)|0);
 var $26=(($25+($24<<2))|0);
 var $27=HEAP32[(($26)>>2)];
 var $28=$3;
 var $29=$4;
 __ZN7Network11sendMessageEP9ComponentaRK6PacketS1_a($5,$27,$28,$29,0,-1);
 label=7;break;
 case 7: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network13setDebugLevelE10DebugLevel($this,$level){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$level;
 var $3=$1;
 var $4=(($3+1008)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=($5|0)!=0;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 var $8=(($3+1008)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=$9;
 var $11=$10;
 var $12=HEAP32[(($11)>>2)];
 var $13=(($12+4)|0);
 var $14=HEAP32[(($13)>>2)];
 var $15=$2;
 FUNCTION_TABLE[$14]($10,$15);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network15subscribeToPortEhab($this,$nodeId,$portId,$enable){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 var $c;
 $1=$this;
 $2=$nodeId;
 $3=$portId;
 var $5=($enable&1);
 $4=$5;
 var $6=$1;
 label=2;break;
 case 2: 
 var $8=$2;
 var $9=($8&255);
 var $10=($9|0)>=1;
 if($10){label=3;break;}else{label=4;break;}
 case 3: 
 var $12=$2;
 var $13=($12&255);
 var $14=(($6+200)|0);
 var $15=HEAP8[(($14)>>0)];
 var $16=($15&255);
 var $17=($13|0)<=($16|0);
 if($17){label=5;break;}else{label=4;break;}
 case 4: 
 var $19=(($6+1008)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=$20;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($21,1,25);
 label=10;break;
 case 5: 
 label=6;break;
 case 6: 
 var $24=$2;
 var $25=($24&255);
 var $26=(($6)|0);
 var $27=(($26+($25<<2))|0);
 var $28=HEAP32[(($27)>>2)];
 $c=$28;
 var $29=$3;
 var $30=(($29<<24)>>24);
 var $31=$c;
 var $32=(($31+12)|0);
 var $33=HEAP8[(($32)>>0)];
 var $34=(($33<<24)>>24);
 var $35=($30|0)>=($34|0);
 if($35){label=7;break;}else{label=8;break;}
 case 7: 
 label=10;break;
 case 8: 
 var $38=$4;
 var $39=(($38)&1);
 var $40=$3;
 var $41=(($40<<24)>>24);
 var $42=$c;
 var $43=(($42+8)|0);
 var $44=HEAP32[(($43)>>2)];
 var $45=(($44+($41<<3))|0);
 var $46=(($45+5)|0);
 var $47=($39&1);
 HEAP8[(($46)>>0)]=$47;
 var $48=(($6+1008)|0);
 var $49=HEAP32[(($48)>>2)];
 var $50=($49|0)!=0;
 if($50){label=9;break;}else{label=10;break;}
 case 9: 
 var $52=(($6+1008)|0);
 var $53=HEAP32[(($52)>>2)];
 var $54=$53;
 var $55=HEAP32[(($54)>>2)];
 var $56=(($55+32)|0);
 var $57=HEAP32[(($56)>>2)];
 var $58=$2;
 var $59=$3;
 var $60=$4;
 var $61=(($60)&1);
 FUNCTION_TABLE[$57]($53,$58,$59,$61);
 label=10;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network15connectSubgraphEbhaha($this,$isOutput,$subgraphNode,$subgraphPort,$childNode,$childPort){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 var $5;
 var $6;
 var $comp;
 var $child;
 var $subgraph;
 $1=$this;
 var $7=($isOutput&1);
 $2=$7;
 $3=$subgraphNode;
 $4=$subgraphPort;
 $5=$childNode;
 $6=$childPort;
 var $8=$1;
 label=2;break;
 case 2: 
 var $10=$3;
 var $11=($10&255);
 var $12=($11|0)>=1;
 if($12){label=3;break;}else{label=6;break;}
 case 3: 
 var $14=$3;
 var $15=($14&255);
 var $16=(($8+200)|0);
 var $17=HEAP8[(($16)>>0)];
 var $18=($17&255);
 var $19=($15|0)<=($18|0);
 if($19){label=4;break;}else{label=6;break;}
 case 4: 
 var $21=$5;
 var $22=($21&255);
 var $23=($22|0)>=1;
 if($23){label=5;break;}else{label=6;break;}
 case 5: 
 var $25=$5;
 var $26=($25&255);
 var $27=(($8+200)|0);
 var $28=HEAP8[(($27)>>0)];
 var $29=($28&255);
 var $30=($26|0)<=($29|0);
 if($30){label=7;break;}else{label=6;break;}
 case 6: 
 var $32=(($8+1008)|0);
 var $33=HEAP32[(($32)>>2)];
 var $34=$33;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($34,1,21);
 label=18;break;
 case 7: 
 label=8;break;
 case 8: 
 var $37=$3;
 var $38=($37&255);
 var $39=(($8)|0);
 var $40=(($39+($38<<2))|0);
 var $41=HEAP32[(($40)>>2)];
 $comp=$41;
 var $42=$5;
 var $43=($42&255);
 var $44=(($8)|0);
 var $45=(($44+($43<<2))|0);
 var $46=HEAP32[(($45)>>2)];
 $child=$46;
 label=9;break;
 case 9: 
 var $48=$comp;
 var $49=__ZNK9Component9componentEv($48);
 var $50=($49&255);
 var $51=($50|0)==100;
 if($51){label=10;break;}else{label=11;break;}
 case 10: 
 var $53=$child;
 var $54=(($53+22)|0);
 var $55=HEAP8[(($54)>>0)];
 var $56=($55&255);
 var $57=($56|0)>=1;
 if($57){label=12;break;}else{label=11;break;}
 case 11: 
 var $59=(($8+1008)|0);
 var $60=HEAP32[(($59)>>2)];
 var $61=$60;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($61,1,20);
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 var $64=$comp;
 var $65=$64;
 $subgraph=$65;
 var $66=$2;
 var $67=(($66)&1);
 if($67){label=14;break;}else{label=15;break;}
 case 14: 
 var $69=$subgraph;
 var $70=$4;
 var $71=$child;
 var $72=$6;
 __ZN8SubGraph14connectOutportEaP9Componenta($69,$70,$71,$72);
 label=16;break;
 case 15: 
 var $74=$subgraph;
 var $75=$4;
 var $76=$child;
 var $77=$6;
 __ZN8SubGraph13connectInportEaP9Componenta($74,$75,$76,$77);
 label=16;break;
 case 16: 
 var $79=(($8+1008)|0);
 var $80=HEAP32[(($79)>>2)];
 var $81=($80|0)!=0;
 if($81){label=17;break;}else{label=18;break;}
 case 17: 
 var $83=(($8+1008)|0);
 var $84=HEAP32[(($83)>>2)];
 var $85=$84;
 var $86=HEAP32[(($85)>>2)];
 var $87=(($86+28)|0);
 var $88=HEAP32[(($87)>>2)];
 var $89=$2;
 var $90=(($89)&1);
 var $91=$3;
 var $92=$4;
 var $93=$5;
 var $94=$6;
 FUNCTION_TABLE[$88]($84,$90,$91,$92,$93,$94);
 label=18;break;
 case 18: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network10setIoValueEPKhh($this,$buf,$len){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$buf;
 $3=$len;
 var $4=$1;
 var $5=(($4+1012)|0);
 var $6=HEAP32[(($5)>>2)];
 var $7=$6;
 var $8=HEAP32[(($7)>>2)];
 var $9=(($8+8)|0);
 var $10=HEAP32[(($9)>>2)];
 var $11=$2;
 var $12=$3;
 FUNCTION_TABLE[$10]($6,$11,$12);
 STACKTOP=sp;return;
}


function __ZN9Component4sendE6Packeta($this,$out,$port){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $out; $out=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($out)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($out)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$port;
 var $3=$1;
 label=2;break;
 case 2: 
 var $5=$2;
 var $6=(($5<<24)>>24);
 var $7=(($3+12)|0);
 var $8=HEAP8[(($7)>>0)];
 var $9=(($8<<24)>>24);
 var $10=($6|0)<($9|0);
 if($10){label=4;break;}else{label=3;break;}
 case 3: 
 var $12=(($3+16)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=(($13+1008)|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=$15;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($16,1,16);
 label=8;break;
 case 4: 
 label=5;break;
 case 5: 
 var $19=$2;
 var $20=(($19<<24)>>24);
 var $21=(($3+8)|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=(($22+($20<<3))|0);
 var $24=(($23)|0);
 var $25=HEAP32[(($24)>>2)];
 var $26=($25|0)!=0;
 if($26){label=6;break;}else{label=8;break;}
 case 6: 
 var $28=$2;
 var $29=(($28<<24)>>24);
 var $30=(($3+8)|0);
 var $31=HEAP32[(($30)>>2)];
 var $32=(($31+($29<<3))|0);
 var $33=(($32+4)|0);
 var $34=HEAP8[(($33)>>0)];
 var $35=(($34<<24)>>24);
 var $36=($35|0)>=0;
 if($36){label=7;break;}else{label=8;break;}
 case 7: 
 var $38=(($3+16)|0);
 var $39=HEAP32[(($38)>>2)];
 var $40=$2;
 var $41=(($40<<24)>>24);
 var $42=(($3+8)|0);
 var $43=HEAP32[(($42)>>2)];
 var $44=(($43+($41<<3))|0);
 var $45=(($44)|0);
 var $46=HEAP32[(($45)>>2)];
 var $47=$2;
 var $48=(($47<<24)>>24);
 var $49=(($3+8)|0);
 var $50=HEAP32[(($49)>>2)];
 var $51=(($50+($48<<3))|0);
 var $52=(($51+4)|0);
 var $53=HEAP8[(($52)>>0)];
 var $54=$2;
 __ZN7Network11sendMessageEP9ComponentaRK6PacketS1_a($39,$46,$53,$out,$3,$54);
 label=8;break;
 case 8: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network11sendMessageEP9ComponentaRK6PacketS1_a($this,$target,$targetPort,$pkg,$sender,$senderPort){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 var $5;
 var $6;
 var $msgIndex;
 var $senderIsChild;
 var $parent;
 var $targetIsSubGraph;
 var $targetSubGraph;
 var $msg;
 var $sendNotification;
 var $7=sp;
 $1=$this;
 $2=$target;
 $3=$targetPort;
 $4=$pkg;
 $5=$sender;
 $6=$senderPort;
 var $8=$1;
 var $9=$2;
 var $10=($9|0)!=0;
 if($10){label=3;break;}else{label=2;break;}
 case 2: 
 label=19;break;
 case 3: 
 var $13=(($8+1004)|0);
 var $14=HEAP8[(($13)>>0)];
 var $15=($14&255);
 var $16=($15|0)>49;
 if($16){label=4;break;}else{label=5;break;}
 case 4: 
 var $18=(($8+1004)|0);
 HEAP8[(($18)>>0)]=0;
 label=5;break;
 case 5: 
 var $20=(($8+1004)|0);
 var $21=HEAP8[(($20)>>0)];
 var $22=((($21)+(1))&255);
 HEAP8[(($20)>>0)]=$22;
 $msgIndex=$21;
 var $23=$5;
 var $24=($23|0)!=0;
 if($24){label=6;break;}else{var $32=0;label=7;break;}
 case 6: 
 var $26=$5;
 var $27=(($26+22)|0);
 var $28=HEAP8[(($27)>>0)];
 var $29=($28&255);
 var $30=($29|0)>=1;
 var $32=$30;label=7;break;
 case 7: 
 var $32;
 var $33=($32&1);
 $senderIsChild=$33;
 var $34=$senderIsChild;
 var $35=(($34)&1);
 if($35){label=8;break;}else{label=11;break;}
 case 8: 
 var $37=$5;
 var $38=(($37+22)|0);
 var $39=HEAP8[(($38)>>0)];
 var $40=($39&255);
 var $41=(($8)|0);
 var $42=(($41+($40<<2))|0);
 var $43=HEAP32[(($42)>>2)];
 var $44=$43;
 $parent=$44;
 var $45=$2;
 var $46=$parent;
 var $47=$46;
 var $48=($45|0)==($47|0);
 if($48){label=9;break;}else{label=10;break;}
 case 9: 
 var $50=$3;
 var $51=(($50<<24)>>24);
 var $52=$parent;
 var $53=(($52+104)|0);
 var $54=(($53+($51<<3))|0);
 var $55=(($54)|0);
 var $56=HEAP32[(($55)>>2)];
 $2=$56;
 var $57=$3;
 var $58=(($57<<24)>>24);
 var $59=$parent;
 var $60=(($59+104)|0);
 var $61=(($60+($58<<3))|0);
 var $62=(($61+4)|0);
 var $63=HEAP8[(($62)>>0)];
 $3=$63;
 label=10;break;
 case 10: 
 label=11;break;
 case 11: 
 var $66=$2;
 var $67=(($66+21)|0);
 var $68=HEAP8[(($67)>>0)];
 var $69=($68&255);
 var $70=($69|0)==100;
 var $71=($70&1);
 $targetIsSubGraph=$71;
 var $72=$targetIsSubGraph;
 var $73=(($72)&1);
 if($73){label=12;break;}else{label=13;break;}
 case 12: 
 var $75=$2;
 var $76=$75;
 $targetSubGraph=$76;
 var $77=$3;
 var $78=(($77<<24)>>24);
 var $79=$targetSubGraph;
 var $80=(($79+24)|0);
 var $81=(($80+($78<<3))|0);
 var $82=(($81)|0);
 var $83=HEAP32[(($82)>>2)];
 $2=$83;
 var $84=$3;
 var $85=(($84<<24)>>24);
 var $86=$targetSubGraph;
 var $87=(($86+24)|0);
 var $88=(($87+($85<<3))|0);
 var $89=(($88+4)|0);
 var $90=HEAP8[(($89)>>0)];
 $3=$90;
 label=13;break;
 case 13: 
 var $92=$msgIndex;
 var $93=($92&255);
 var $94=(($8+204)|0);
 var $95=(($94+($93<<4))|0);
 $msg=$95;
 var $96=$2;
 var $97=$msg;
 var $98=(($97)|0);
 HEAP32[(($98)>>2)]=$96;
 var $99=$3;
 var $100=$msg;
 var $101=(($100+4)|0);
 HEAP8[(($101)>>0)]=$99;
 var $102=$msg;
 var $103=(($102+8)|0);
 var $104=$4;
 var $105=$103;
 var $106=$104;
 assert(8 % 1 === 0);HEAP32[(($105)>>2)]=HEAP32[(($106)>>2)];HEAP32[((($105)+(4))>>2)]=HEAP32[((($106)+(4))>>2)];
 var $107=$5;
 var $108=($107|0)!=0;
 if($108){label=14;break;}else{label=15;break;}
 case 14: 
 var $110=$6;
 var $111=(($110<<24)>>24);
 var $112=$5;
 var $113=(($112+8)|0);
 var $114=HEAP32[(($113)>>2)];
 var $115=(($114+($111<<3))|0);
 var $116=(($115+5)|0);
 var $117=HEAP8[(($116)>>0)];
 var $118=(($117)&1);
 var $121=$118;label=16;break;
 case 15: 
 var $121=0;label=16;break;
 case 16: 
 var $121;
 var $122=($121&1);
 $sendNotification=$122;
 var $123=$sendNotification;
 var $124=(($123)&1);
 if($124){label=17;break;}else{label=19;break;}
 case 17: 
 var $126=(($8+1008)|0);
 var $127=HEAP32[(($126)>>2)];
 var $128=($127|0)!=0;
 if($128){label=18;break;}else{label=19;break;}
 case 18: 
 var $130=(($8+1008)|0);
 var $131=HEAP32[(($130)>>2)];
 var $132=$131;
 var $133=HEAP32[(($132)>>2)];
 var $134=(($133+8)|0);
 var $135=HEAP32[(($134)>>2)];
 var $136=$msgIndex;
 var $137=($136&255);
 var $138=$msg;
 var $139=$7;
 var $140=$138;
 assert(16 % 1 === 0);HEAP32[(($139)>>2)]=HEAP32[(($140)>>2)];HEAP32[((($139)+(4))>>2)]=HEAP32[((($140)+(4))>>2)];HEAP32[((($139)+(8))>>2)]=HEAP32[((($140)+(8))>>2)];HEAP32[((($139)+(12))>>2)]=HEAP32[((($140)+(12))>>2)];
 var $141=$5;
 var $142=$6;
 FUNCTION_TABLE[$135]($131,$137,$7,$141,$142);
 label=19;break;
 case 19: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9Component7connectEaPS_a($this,$outPort,$target,$targetPort){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 var $4;
 $1=$this;
 $2=$outPort;
 $3=$target;
 $4=$targetPort;
 var $5=$1;
 var $6=$3;
 var $7=$2;
 var $8=(($7<<24)>>24);
 var $9=(($5+8)|0);
 var $10=HEAP32[(($9)>>2)];
 var $11=(($10+($8<<3))|0);
 var $12=(($11)|0);
 HEAP32[(($12)>>2)]=$6;
 var $13=$4;
 var $14=$2;
 var $15=(($14<<24)>>24);
 var $16=(($5+8)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=(($17+($15<<3))|0);
 var $19=(($18+4)|0);
 HEAP8[(($19)>>0)]=$13;
 STACKTOP=sp;return;
}


function __ZN9Component10setNetworkEP7NetworkiP2IO($this,$net,$n,$i){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 var $i1;
 $1=$this;
 $2=$net;
 $3=$n;
 $4=$i;
 var $5=$1;
 var $6=(($5+22)|0);
 HEAP8[(($6)>>0)]=0;
 var $7=$2;
 var $8=(($5+16)|0);
 HEAP32[(($8)>>2)]=$7;
 var $9=$3;
 var $10=(($9)&255);
 var $11=(($5+20)|0);
 HEAP8[(($11)>>0)]=$10;
 var $12=$4;
 var $13=(($5+4)|0);
 HEAP32[(($13)>>2)]=$12;
 $i1=0;
 label=2;break;
 case 2: 
 var $15=$i1;
 var $16=(($5+12)|0);
 var $17=HEAP8[(($16)>>0)];
 var $18=(($17<<24)>>24);
 var $19=($15|0)<($18|0);
 if($19){label=3;break;}else{label=5;break;}
 case 3: 
 var $21=$i1;
 var $22=(($5+8)|0);
 var $23=HEAP32[(($22)>>2)];
 var $24=(($23+($21<<3))|0);
 var $25=(($24)|0);
 HEAP32[(($25)>>2)]=0;
 var $26=$i1;
 var $27=(($5+8)|0);
 var $28=HEAP32[(($27)>>2)];
 var $29=(($28+($26<<3))|0);
 var $30=(($29+4)|0);
 HEAP8[(($30)>>0)]=-1;
 var $31=$i1;
 var $32=(($5+8)|0);
 var $33=HEAP32[(($32)>>2)];
 var $34=(($33+($31<<3))|0);
 var $35=(($34+5)|0);
 HEAP8[(($35)>>0)]=0;
 label=4;break;
 case 4: 
 var $37=$i1;
 var $38=((($37)+(1))|0);
 $i1=$38;
 label=2;break;
 case 5: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7NetworkC2EP2IO($this,$io){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $i;
 $1=$this;
 $2=$io;
 var $3=$1;
 var $4=(($3+200)|0);
 HEAP8[(($4)>>0)]=1;
 var $5=(($3+204)|0);
 var $6=(($5)|0);
 var $7=(($6+800)|0);
 var $9=$6;label=2;break;
 case 2: 
 var $9;
 __ZN7MessageC1Ev($9);
 var $10=(($9+16)|0);
 var $11=($10|0)==($7|0);
 if($11){label=3;break;}else{var $9=$10;label=2;break;}
 case 3: 
 var $13=(($3+1004)|0);
 HEAP8[(($13)>>0)]=0;
 var $14=(($3+1005)|0);
 HEAP8[(($14)>>0)]=0;
 var $15=(($3+1008)|0);
 HEAP32[(($15)>>2)]=0;
 var $16=(($3+1012)|0);
 var $17=$2;
 HEAP32[(($16)>>2)]=$17;
 var $18=(($3+1016)|0);
 HEAP32[(($18)>>2)]=0;
 $i=0;
 label=4;break;
 case 4: 
 var $20=$i;
 var $21=($20|0)<50;
 if($21){label=5;break;}else{label=7;break;}
 case 5: 
 var $23=$i;
 var $24=(($3)|0);
 var $25=(($24+($23<<2))|0);
 HEAP32[(($25)>>2)]=0;
 label=6;break;
 case 6: 
 var $27=$i;
 var $28=((($27)+(1))|0);
 $i=$28;
 label=4;break;
 case 7: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7MessageC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN7MessageC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN7Network15deliverMessagesEhh($this,$firstIndex,$lastIndex){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+24)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $i;
 var $target;
 var $4=sp;
 var $5=(sp)+(8);
 $1=$this;
 $2=$firstIndex;
 $3=$lastIndex;
 var $6=$1;
 label=2;break;
 case 2: 
 var $8=$2;
 var $9=($8&255);
 var $10=($9|0)<50;
 if($10){label=3;break;}else{label=4;break;}
 case 3: 
 var $12=$3;
 var $13=($12&255);
 var $14=($13|0)<50;
 if($14){label=5;break;}else{label=4;break;}
 case 4: 
 var $16=(($6+1008)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=$17;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($18,1,29);
 label=14;break;
 case 5: 
 label=6;break;
 case 6: 
 var $21=$2;
 $i=$21;
 label=7;break;
 case 7: 
 var $23=$i;
 var $24=($23&255);
 var $25=$3;
 var $26=($25&255);
 var $27=($24|0)<=($26|0);
 if($27){label=8;break;}else{label=14;break;}
 case 8: 
 var $29=$i;
 var $30=($29&255);
 var $31=(($6+204)|0);
 var $32=(($31+($30<<4))|0);
 var $33=(($32)|0);
 var $34=HEAP32[(($33)>>2)];
 $target=$34;
 var $35=$target;
 var $36=($35|0)!=0;
 if($36){label=10;break;}else{label=9;break;}
 case 9: 
 label=13;break;
 case 10: 
 var $39=$target;
 var $40=$39;
 var $41=HEAP32[(($40)>>2)];
 var $42=(($41+8)|0);
 var $43=HEAP32[(($42)>>2)];
 var $44=$i;
 var $45=($44&255);
 var $46=(($6+204)|0);
 var $47=(($46+($45<<4))|0);
 var $48=(($47+8)|0);
 var $49=$4;
 var $50=$48;
 assert(8 % 1 === 0);HEAP32[(($49)>>2)]=HEAP32[(($50)>>2)];HEAP32[((($49)+(4))>>2)]=HEAP32[((($50)+(4))>>2)];
 var $51=$i;
 var $52=($51&255);
 var $53=(($6+204)|0);
 var $54=(($53+($52<<4))|0);
 var $55=(($54+4)|0);
 var $56=HEAP8[(($55)>>0)];
 FUNCTION_TABLE[$43]($39,$4,$56);
 var $57=(($6+1008)|0);
 var $58=HEAP32[(($57)>>2)];
 var $59=($58|0)!=0;
 if($59){label=11;break;}else{label=12;break;}
 case 11: 
 var $61=(($6+1008)|0);
 var $62=HEAP32[(($61)>>2)];
 var $63=$62;
 var $64=HEAP32[(($63)>>2)];
 var $65=(($64+12)|0);
 var $66=HEAP32[(($65)>>2)];
 var $67=$i;
 var $68=($67&255);
 var $69=$i;
 var $70=($69&255);
 var $71=(($6+204)|0);
 var $72=(($71+($70<<4))|0);
 var $73=$5;
 var $74=$72;
 assert(16 % 1 === 0);HEAP32[(($73)>>2)]=HEAP32[(($74)>>2)];HEAP32[((($73)+(4))>>2)]=HEAP32[((($74)+(4))>>2)];HEAP32[((($73)+(8))>>2)]=HEAP32[((($74)+(8))>>2)];HEAP32[((($73)+(12))>>2)]=HEAP32[((($74)+(12))>>2)];
 FUNCTION_TABLE[$66]($62,$68,$5);
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 var $77=$i;
 var $78=((($77)+(1))&255);
 $i=$78;
 label=7;break;
 case 14: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network15processMessagesEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $readIndex;
 var $writeIndex;
 $1=$this;
 var $2=$1;
 var $3=(($2+1005)|0);
 var $4=HEAP8[(($3)>>0)];
 $readIndex=$4;
 var $5=(($2+1004)|0);
 var $6=HEAP8[(($5)>>0)];
 $writeIndex=$6;
 var $7=$readIndex;
 var $8=($7&255);
 var $9=$writeIndex;
 var $10=($9&255);
 var $11=($8|0)>($10|0);
 if($11){label=2;break;}else{label=3;break;}
 case 2: 
 var $13=$readIndex;
 __ZN7Network15deliverMessagesEhh($2,$13,49);
 var $14=$writeIndex;
 var $15=($14&255);
 var $16=((($15)-(1))|0);
 var $17=(($16)&255);
 __ZN7Network15deliverMessagesEhh($2,0,$17);
 label=7;break;
 case 3: 
 var $19=$readIndex;
 var $20=($19&255);
 var $21=$writeIndex;
 var $22=($21&255);
 var $23=($20|0)<($22|0);
 if($23){label=4;break;}else{label=5;break;}
 case 4: 
 var $25=$readIndex;
 var $26=$writeIndex;
 var $27=($26&255);
 var $28=((($27)-(1))|0);
 var $29=(($28)&255);
 __ZN7Network15deliverMessagesEhh($2,$25,$29);
 label=6;break;
 case 5: 
 label=6;break;
 case 6: 
 label=7;break;
 case 7: 
 var $33=$writeIndex;
 var $34=(($2+1005)|0);
 HEAP8[(($34)>>0)]=$33;
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network16distributePacketERK6Packeta($this,$packet,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $i;
 var $4=sp;
 $1=$this;
 $2=$packet;
 $3=$port;
 var $5=$1;
 $i=0;
 label=2;break;
 case 2: 
 var $7=$i;
 var $8=($7&255);
 var $9=($8|0)<50;
 if($9){label=3;break;}else{label=7;break;}
 case 3: 
 var $11=$i;
 var $12=($11&255);
 var $13=(($5)|0);
 var $14=(($13+($12<<2))|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=($15|0)!=0;
 if($16){label=4;break;}else{label=5;break;}
 case 4: 
 var $18=$i;
 var $19=($18&255);
 var $20=(($5)|0);
 var $21=(($20+($19<<2))|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=$22;
 var $24=HEAP32[(($23)>>2)];
 var $25=(($24+8)|0);
 var $26=HEAP32[(($25)>>2)];
 var $27=$2;
 var $28=$4;
 var $29=$27;
 assert(8 % 1 === 0);HEAP32[(($28)>>2)]=HEAP32[(($29)>>2)];HEAP32[((($28)+(4))>>2)]=HEAP32[((($29)+(4))>>2)];
 var $30=$3;
 FUNCTION_TABLE[$26]($22,$4,$30);
 label=5;break;
 case 5: 
 label=6;break;
 case 6: 
 var $33=$i;
 var $34=((($33)+(1))&255);
 $i=$34;
 label=2;break;
 case 7: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network8runSetupEv($this){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2=sp;
 $1=$this;
 var $3=$1;
 var $4=(($3+1016)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=($5|0)!=1;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 label=4;break;
 case 3: 
 __ZN6PacketC1E3Msg($2,1);
 __ZN7Network16distributePacketERK6Packeta($3,$2,-1);
 label=4;break;
 case 4: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network7runTickEv($this){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2=sp;
 $1=$this;
 var $3=$1;
 var $4=(($3+1016)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=($5|0)!=1;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 label=4;break;
 case 3: 
 __ZN7Network15processMessagesEv($3);
 __ZN6PacketC1E3Msg($2,2);
 __ZN7Network16distributePacketERK6Packeta($3,$2,-1);
 label=4;break;
 case 4: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Network7connectEP9ComponentaS1_a($this,$src,$srcPort,$target,$targetPort){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 var $5;
 $1=$this;
 $2=$src;
 $3=$srcPort;
 $4=$target;
 $5=$targetPort;
 var $6=$1;
 var $7=$2;
 var $8=$3;
 var $9=$4;
 var $10=$5;
 __ZN9Component7connectEaPS_a($7,$8,$9,$10);
 var $11=(($6+1008)|0);
 var $12=HEAP32[(($11)>>2)];
 var $13=($12|0)!=0;
 if($13){label=2;break;}else{label=3;break;}
 case 2: 
 var $15=(($6+1008)|0);
 var $16=HEAP32[(($15)>>2)];
 var $17=$16;
 var $18=HEAP32[(($17)>>2)];
 var $19=(($18+20)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=$2;
 var $22=$3;
 var $23=$4;
 var $24=$5;
 FUNCTION_TABLE[$20]($16,$21,$22,$23,$24);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9Component9setParentEi($this,$parentId){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$parentId;
 var $3=$1;
 var $4=$2;
 var $5=(($4)&255);
 var $6=(($3+22)|0);
 HEAP8[(($6)>>0)]=$5;
 STACKTOP=sp;return;
}


function __ZNK9Component9componentEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+21)|0);
 var $4=HEAP8[(($3)>>0)];
 STACKTOP=sp;return $4;
}


function __ZN8SubGraph14connectOutportEaP9Componenta($this,$outPort,$child,$childOutPort){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 $1=$this;
 $2=$outPort;
 $3=$child;
 $4=$childOutPort;
 var $5=$1;
 var $6=$2;
 var $7=(($6<<24)>>24);
 var $8=($7|0)<0;
 if($8){label=3;break;}else{label=2;break;}
 case 2: 
 var $10=$2;
 var $11=(($10<<24)>>24);
 var $12=($11|0)>=10;
 if($12){label=3;break;}else{label=4;break;}
 case 3: 
 label=5;break;
 case 4: 
 var $15=$3;
 var $16=$2;
 var $17=(($16<<24)>>24);
 var $18=(($5+104)|0);
 var $19=(($18+($17<<3))|0);
 var $20=(($19)|0);
 HEAP32[(($20)>>2)]=$15;
 var $21=$4;
 var $22=$2;
 var $23=(($22<<24)>>24);
 var $24=(($5+104)|0);
 var $25=(($24+($23<<3))|0);
 var $26=(($25+4)|0);
 HEAP8[(($26)>>0)]=$21;
 label=5;break;
 case 5: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN8SubGraph13connectInportEaP9Componenta($this,$inPort,$child,$childInPort){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 $1=$this;
 $2=$inPort;
 $3=$child;
 $4=$childInPort;
 var $5=$1;
 var $6=$2;
 var $7=(($6<<24)>>24);
 var $8=($7|0)<0;
 if($8){label=3;break;}else{label=2;break;}
 case 2: 
 var $10=$2;
 var $11=(($10<<24)>>24);
 var $12=($11|0)>=10;
 if($12){label=3;break;}else{label=4;break;}
 case 3: 
 label=5;break;
 case 4: 
 var $15=$3;
 var $16=$2;
 var $17=(($16<<24)>>24);
 var $18=(($5+24)|0);
 var $19=(($18+($17<<3))|0);
 var $20=(($19)|0);
 HEAP32[(($20)>>2)]=$15;
 var $21=$4;
 var $22=$2;
 var $23=(($22<<24)>>24);
 var $24=(($5+24)|0);
 var $25=(($24+($23<<3))|0);
 var $26=(($25+4)|0);
 HEAP8[(($26)>>0)]=$21;
 label=5;break;
 case 5: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN17HostCommunication9nodeAddedEP9Componenth($this,$c,$parentId){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 var $cmd=sp;
 $1=$this;
 $2=$c;
 $3=$parentId;
 var $4=$1;
 var $5=(($cmd)|0);
 HEAP8[(($5)>>0)]=101;
 var $6=(($5+1)|0);
 var $7=$2;
 var $8=__ZNK9Component9componentEv($7);
 HEAP8[(($6)>>0)]=$8;
 var $9=(($6+1)|0);
 var $10=$2;
 var $11=__ZNK9Component2idEv($10);
 HEAP8[(($9)>>0)]=$11;
 var $12=(($9+1)|0);
 var $13=$3;
 HEAP8[(($12)>>0)]=$13;
 var $14=(($4+8)|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=$15;
 var $17=HEAP32[(($16)>>2)];
 var $18=(($17+8)|0);
 var $19=HEAP32[(($18)>>2)];
 var $20=(($cmd)|0);
 FUNCTION_TABLE[$19]($15,$20,4);
 STACKTOP=sp;return;
}


function __ZNK9Component2idEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+20)|0);
 var $4=HEAP8[(($3)>>0)];
 STACKTOP=sp;return $4;
}


function __ZN17HostCommunication14nodesConnectedEP9ComponentaS1_a($this,$src,$srcPort,$target,$targetPort){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 var $4;
 var $5;
 var $cmd=sp;
 $1=$this;
 $2=$src;
 $3=$srcPort;
 $4=$target;
 $5=$targetPort;
 var $6=$1;
 var $7=(($cmd)|0);
 HEAP8[(($7)>>0)]=102;
 var $8=(($7+1)|0);
 var $9=$2;
 var $10=__ZNK9Component2idEv($9);
 HEAP8[(($8)>>0)]=$10;
 var $11=(($8+1)|0);
 var $12=$3;
 HEAP8[(($11)>>0)]=$12;
 var $13=(($11+1)|0);
 var $14=$4;
 var $15=__ZNK9Component2idEv($14);
 HEAP8[(($13)>>0)]=$15;
 var $16=(($13+1)|0);
 var $17=$5;
 HEAP8[(($16)>>0)]=$17;
 var $18=(($6+8)|0);
 var $19=HEAP32[(($18)>>2)];
 var $20=$19;
 var $21=HEAP32[(($20)>>2)];
 var $22=(($21+8)|0);
 var $23=HEAP32[(($22)>>2)];
 var $24=(($cmd)|0);
 FUNCTION_TABLE[$23]($19,$24,5);
 STACKTOP=sp;return;
}


function __ZN17HostCommunication19networkStateChangedEN7Network5StateE($this,$s){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $cmd=sp;
 $1=$this;
 $2=$s;
 var $3=$1;
 HEAP32[(($cmd)>>2)]=115;
 var $4=$2;
 var $5=($4|0)==1;
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 HEAP32[(($cmd)>>2)]=104;
 label=6;break;
 case 3: 
 var $8=$2;
 var $9=($8|0)==0;
 if($9){label=4;break;}else{label=5;break;}
 case 4: 
 HEAP32[(($cmd)>>2)]=100;
 label=5;break;
 case 5: 
 label=6;break;
 case 6: 
 var $13=(($3+8)|0);
 var $14=HEAP32[(($13)>>2)];
 var $15=$14;
 var $16=HEAP32[(($15)>>2)];
 var $17=(($16+8)|0);
 var $18=HEAP32[(($17)>>2)];
 var $19=$cmd;
 FUNCTION_TABLE[$18]($14,$19,1);
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN17HostCommunication10packetSentEi7MessageP9Componenta($this,$index,$m,$src,$srcPort){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $m; $m=STACKTOP;STACKTOP = (STACKTOP + 16)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($m)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($m)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];HEAP32[((($m)+(8))>>2)]=HEAP32[(((tempParam)+(8))>>2)];HEAP32[((($m)+(12))>>2)]=HEAP32[(((tempParam)+(12))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 var $cmd=sp;
 var $i;
 $1=$this;
 $2=$index;
 $3=$src;
 $4=$srcPort;
 var $5=$1;
 var $6=$3;
 var $7=($6|0)!=0;
 if($7){label=3;break;}else{label=2;break;}
 case 2: 
 label=14;break;
 case 3: 
 var $10=(($cmd)|0);
 HEAP8[(($10)>>0)]=103;
 var $11=(($10+1)|0);
 var $12=$3;
 var $13=__ZNK9Component2idEv($12);
 HEAP8[(($11)>>0)]=$13;
 var $14=(($11+1)|0);
 var $15=$4;
 HEAP8[(($14)>>0)]=$15;
 var $16=(($14+1)|0);
 var $17=(($m)|0);
 var $18=HEAP32[(($17)>>2)];
 var $19=__ZNK9Component2idEv($18);
 HEAP8[(($16)>>0)]=$19;
 var $20=(($16+1)|0);
 var $21=(($m+4)|0);
 var $22=HEAP8[(($21)>>0)];
 HEAP8[(($20)>>0)]=$22;
 var $23=(($20+1)|0);
 var $24=(($m+8)|0);
 var $25=__ZNK6Packet4typeEv($24);
 var $26=(($25)&255);
 HEAP8[(($23)>>0)]=$26;
 var $27=(($23+1)|0);
 HEAP8[(($27)>>0)]=0;
 var $28=(($27+1)|0);
 HEAP8[(($28)>>0)]=0;
 var $29=(($m+8)|0);
 var $30=__ZNK6Packet6isDataEv($29);
 if($30){label=4;break;}else{label=13;break;}
 case 4: 
 var $32=(($m+8)|0);
 var $33=__ZNK6Packet6isBoolEv($32);
 if($33){label=5;break;}else{label=6;break;}
 case 5: 
 var $35=(($m+8)|0);
 var $36=__ZNK6Packet6asBoolEv($35);
 var $37=($36&1);
 var $38=(($cmd+6)|0);
 HEAP8[(($38)>>0)]=$37;
 label=12;break;
 case 6: 
 var $40=(($m+8)|0);
 var $41=__ZNK6Packet8isNumberEv($40);
 if($41){label=7;break;}else{label=8;break;}
 case 7: 
 var $43=(($m+8)|0);
 var $44=__ZNK6Packet9asIntegerEv($43);
 $i=$44;
 var $45=$i;
 var $46=$45>>0;
 var $47=(($46)&255);
 var $48=(($cmd+6)|0);
 HEAP8[(($48)>>0)]=$47;
 var $49=$i;
 var $50=$49>>8;
 var $51=(($50)&255);
 var $52=(($cmd+7)|0);
 HEAP8[(($52)>>0)]=$51;
 label=11;break;
 case 8: 
 label=9;break;
 case 9: 
 var $55=$5;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($55,1,19);
 label=10;break;
 case 10: 
 label=11;break;
 case 11: 
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 var $60=(($5+8)|0);
 var $61=HEAP32[(($60)>>2)];
 var $62=$61;
 var $63=HEAP32[(($62)>>2)];
 var $64=(($63+8)|0);
 var $65=HEAP32[(($64)>>2)];
 var $66=(($cmd)|0);
 FUNCTION_TABLE[$65]($61,$66,8);
 label=14;break;
 case 14: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet4typeEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 STACKTOP=sp;return $4;
}


function __ZNK6Packet6isDataEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 $1=$this;
 var $2=$1;
 var $3=__ZNK6Packet7isValidEv($2);
 if($3){label=2;break;}else{var $8=0;label=3;break;}
 case 2: 
 var $5=__ZNK6Packet9isSpecialEv($2);
 var $6=$5^1;
 var $8=$6;label=3;break;
 case 3: 
 var $8;
 STACKTOP=sp;return $8;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet6isBoolEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)==6;
 STACKTOP=sp;return $5;
}


function __ZNK6Packet8isNumberEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 $1=$this;
 var $2=$1;
 var $3=__ZNK6Packet9isIntegerEv($2);
 if($3){var $7=1;label=3;break;}else{label=2;break;}
 case 2: 
 var $5=__ZNK6Packet7isFloatEv($2);
 var $7=$5;label=3;break;
 case 3: 
 var $7;
 STACKTOP=sp;return $7;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN17HostCommunication15packetDeliveredEi7Message($this,$index,$m){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $m; $m=STACKTOP;STACKTOP = (STACKTOP + 16)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($m)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($m)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];HEAP32[((($m)+(8))>>2)]=HEAP32[(((tempParam)+(8))>>2)];HEAP32[((($m)+(12))>>2)]=HEAP32[(((tempParam)+(12))>>2)];

 var $1;
 var $2;
 $1=$this;
 $2=$index;
 var $3=$1;
 STACKTOP=sp;return;
}


function __ZN17HostCommunication9emitDebugE10DebugLevel7DebugId($this,$level,$id){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $cmd=sp;
 $1=$this;
 $2=$level;
 $3=$id;
 var $4=$1;
 var $5=$2;
 var $6=(($4+28)|0);
 var $7=HEAP32[(($6)>>2)];
 var $8=($5|0)<=($7|0);
 if($8){label=2;break;}else{label=3;break;}
 case 2: 
 var $10=(($cmd)|0);
 HEAP8[(($10)>>0)]=106;
 var $11=(($10+1)|0);
 var $12=$2;
 var $13=(($12)&255);
 HEAP8[(($11)>>0)]=$13;
 var $14=(($11+1)|0);
 var $15=$3;
 var $16=(($15)&255);
 HEAP8[(($14)>>0)]=$16;
 var $17=(($4+8)|0);
 var $18=HEAP32[(($17)>>2)];
 var $19=$18;
 var $20=HEAP32[(($19)>>2)];
 var $21=(($20+8)|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=(($cmd)|0);
 FUNCTION_TABLE[$22]($18,$23,3);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN17HostCommunication12debugChangedE10DebugLevel($this,$level){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $cmd=sp;
 $1=$this;
 $2=$level;
 var $3=$1;
 var $4=(($cmd)|0);
 HEAP8[(($4)>>0)]=105;
 var $5=(($4+1)|0);
 var $6=$2;
 var $7=(($6)&255);
 HEAP8[(($5)>>0)]=$7;
 var $8=(($3+8)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=$9;
 var $11=HEAP32[(($10)>>2)];
 var $12=(($11+8)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=(($cmd)|0);
 FUNCTION_TABLE[$13]($9,$14,2);
 STACKTOP=sp;return;
}


function __ZN17HostCommunication23portSubscriptionChangedEhab($this,$nodeId,$portId,$enable){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 var $4;
 var $cmd=sp;
 $1=$this;
 $2=$nodeId;
 $3=$portId;
 var $5=($enable&1);
 $4=$5;
 var $6=$1;
 var $7=(($cmd)|0);
 HEAP8[(($7)>>0)]=107;
 var $8=(($7+1)|0);
 var $9=$2;
 HEAP8[(($8)>>0)]=$9;
 var $10=(($8+1)|0);
 var $11=$3;
 HEAP8[(($10)>>0)]=$11;
 var $12=(($10+1)|0);
 var $13=$4;
 var $14=(($13)&1);
 var $15=($14&1);
 HEAP8[(($12)>>0)]=$15;
 var $16=(($6+8)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=$17;
 var $19=HEAP32[(($18)>>2)];
 var $20=(($19+8)|0);
 var $21=HEAP32[(($20)>>2)];
 var $22=(($cmd)|0);
 FUNCTION_TABLE[$21]($17,$22,4);
 STACKTOP=sp;return;
}


function __ZN17HostCommunication17subgraphConnectedEbhaha($this,$isOutput,$subgraphNode,$subgraphPort,$childNode,$childPort){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 var $4;
 var $5;
 var $6;
 var $cmd=sp;
 $1=$this;
 var $7=($isOutput&1);
 $2=$7;
 $3=$subgraphNode;
 $4=$subgraphPort;
 $5=$childNode;
 $6=$childPort;
 var $8=$1;
 var $9=(($cmd)|0);
 HEAP8[(($9)>>0)]=108;
 var $10=(($9+1)|0);
 var $11=$2;
 var $12=(($11)&1);
 var $13=($12&1);
 HEAP8[(($10)>>0)]=$13;
 var $14=(($10+1)|0);
 var $15=$3;
 HEAP8[(($14)>>0)]=$15;
 var $16=(($14+1)|0);
 var $17=$4;
 HEAP8[(($16)>>0)]=$17;
 var $18=(($16+1)|0);
 var $19=$5;
 HEAP8[(($18)>>0)]=$19;
 var $20=(($18+1)|0);
 var $21=$6;
 HEAP8[(($20)>>0)]=$21;
 var $22=(($8+8)|0);
 var $23=HEAP32[(($22)>>2)];
 var $24=$23;
 var $25=HEAP32[(($24)>>2)];
 var $26=(($25+8)|0);
 var $27=HEAP32[(($26)>>2)];
 var $28=(($cmd)|0);
 FUNCTION_TABLE[$27]($23,$28,6);
 STACKTOP=sp;return;
}


function __ZN13HostTransportC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=1368;
 STACKTOP=sp;return;
}


function __ZN8SubGraphC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=280;
 var $4=$2;
 var $5=(($2+104)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,10);
 var $7=$2;
 HEAP32[(($7)>>2)]=280;
 var $8=(($2+24)|0);
 var $9=(($2+104)|0);
 STACKTOP=sp;return;
}


function __ZN9ComponentC2EP10Connectioni($this,$outPorts,$ports){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$outPorts;
 $3=$ports;
 var $4=$1;
 var $5=$4;
 HEAP32[(($5)>>2)]=216;
 var $6=(($4+8)|0);
 var $7=$2;
 HEAP32[(($6)>>2)]=$7;
 var $8=(($4+12)|0);
 var $9=$3;
 var $10=(($9)&255);
 HEAP8[(($8)>>0)]=$10;
 STACKTOP=sp;return;
}


function __ZN8SubGraph7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$port;
 var $3=$1;
 label=2;break;
 case 2: 
 var $5=$2;
 var $6=(($5<<24)>>24);
 var $7=($6|0)<0;
 if($7){label=4;break;}else{label=3;break;}
 case 3: 
 var $9=$3;
 var $10=(($9+16)|0);
 var $11=HEAP32[(($10)>>2)];
 var $12=(($11+1008)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=$13;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($14,1,22);
 label=4;break;
 case 4: 
 label=5;break;
 case 5: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __Znwj($n){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $p;
 var $2;
 var $3;
 $1=$n;
 var $4=$1;
 var $5=(function() { try { __THREW__ = 0; return _malloc($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=4;break; }
 case 2: 
 $p=$5;
 var $7=$p;
 var $8=($7|0)!=0;
 if($8){label=7;break;}else{label=3;break;}
 case 3: 
 var $10=___cxa_allocate_exception(4);
 var $11=$10;
 __ZNSt9bad_allocC2Ev($11);
 (function() { try { __THREW__ = 0; return ___cxa_throw($10,2864,(324)) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=9;break; } else { label=4;break; }
 case 4: 
 var $13$0 = ___cxa_find_matching_catch(-1, -1); var $13$1 = tempRet0;
 var $14=$13$0;
 $2=$14;
 var $15=$13$1;
 $3=$15;
 label=5;break;
 case 5: 
 var $17=$3;
 var $18=($17|0)<0;
 if($18){label=6;break;}else{label=8;break;}
 case 6: 
 var $20=$2;
 ___cxa_call_unexpected($20);
 throw "Reached an unreachable!";
 case 7: 
 var $22=$p;
 STACKTOP=sp;return $22;
 case 8: 
 var $24=$2;
 var $25=$3;
 var $26$0=$24;
 var $26$1=0;
 var $27$0=$26$0;
 var $27$1=$25;
 ___resumeException($27$0)
 case 9: 
 throw "Reached an unreachable!";
  default: assert(0, "bad label: " + label);
 }

}


function __ZN8PwmWriteC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN8PwmWriteC2Ev($2);
 STACKTOP=sp;return;
}


function __ZdlPv($p){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$p;
 var $4=$1;
 (function() { try { __THREW__ = 0; return _free($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 STACKTOP=sp;return;
 case 3: 
 var $7$0 = ___cxa_find_matching_catch(-1, -1); var $7$1 = tempRet0;
 var $8=$7$0;
 $2=$8;
 var $9=$7$1;
 $3=$9;
 label=4;break;
 case 4: 
 var $11=$2;
 ___cxa_call_unexpected($11);
 throw "Reached an unreachable!";
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10AnalogReadC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN10AnalogReadC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN7ForwardC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN7ForwardC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5CountC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5CountC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN12DigitalWriteC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN12DigitalWriteC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN11DigitalReadC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN11DigitalReadC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5TimerC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5TimerC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN8SerialInC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN8SerialInC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9SerialOutC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9SerialOutC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN13InvertBooleanC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN13InvertBooleanC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN13ToggleBooleanC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN13ToggleBooleanC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN15HysteresisLatchC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN15HysteresisLatchC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN21ReadDallasTemperatureC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN21ReadDallasTemperatureC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5RouteC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5RouteC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN15BreakBeforeMakeC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN15BreakBeforeMakeC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9MapLinearC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9MapLinearC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN10MonitorPinC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN10MonitorPinC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5SplitC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5SplitC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN4GateC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN4GateC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I9BooleanOrbbEC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I9BooleanOrbbEC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I10BooleanAndbbEC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I10BooleanAndbbEC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN17ReadCapacitivePinC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN17ReadCapacitivePinC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I12NumberEqualsllEC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I12NumberEqualsllEC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I3MinllEC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I3MinllEC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I3MaxllEC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I3MaxllEC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9ConstrainC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9ConstrainC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN12LedMatrixMaxC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN12LedMatrixMaxC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN16LedChainNeoPixelC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN16LedChainNeoPixelC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN14PseudoPwmWriteC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN14PseudoPwmWriteC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN10LedChainWSC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN10LedChainWSC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9BoolToIntC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9BoolToIntC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN10ArduinoUnoC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN10ArduinoUnoC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN8ATUSBKEYC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN8ATUSBKEYC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN7MbedLPCC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN7MbedLPCC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN11RaspberryPiC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN11RaspberryPiC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5TivaCC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5TivaCC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9ForwardIfC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9ForwardIfC2Ev($2);
 STACKTOP=sp;return;
}


function __Z14loadFromEEPROMP17HostCommunication($controller){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $i;
 var $c;
 $1=$controller;
 $i=0;
 label=2;break;
 case 2: 
 var $3=$i;
 var $4=($3>>>0)<96;
 if($4){label=3;break;}else{label=5;break;}
 case 3: 
 var $6=$i;
 var $7=((3664+$6)|0);
 var $8=HEAP8[(($7)>>0)];
 $c=$8;
 var $9=$1;
 var $10=$c;
 __ZN17HostCommunication9parseByteEc($9,$10);
 label=4;break;
 case 4: 
 var $12=$i;
 var $13=((($12)+(1))|0);
 $i=$13;
 label=2;break;
 case 5: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN23EmscriptenHostTransport5setupEP2IOP17HostCommunication($this,$i,$c){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$i;
 $3=$c;
 var $4=$1;
 var $5=$2;
 var $6=(($4+12)|0);
 HEAP32[(($6)>>2)]=$5;
 var $7=$3;
 var $8=(($4+16)|0);
 HEAP32[(($8)>>2)]=$7;
 STACKTOP=sp;return;
}


function __ZN23EmscriptenHostTransport7runTickEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+8)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)!=0;
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 var $7=(($2+8)|0);
 var $8=HEAP32[(($7)>>2)];
 FUNCTION_TABLE[$8]();
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN23EmscriptenHostTransport13sendToRuntimeEh($this,$b){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$b;
 var $3=$1;
 var $4=(($3+16)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=$2;
 __ZN17HostCommunication9parseByteEc($5,$6);
 STACKTOP=sp;return;
}


function __ZN23EmscriptenHostTransport11sendCommandEPKhh($this,$b,$len){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $i;
 var $d;
 $1=$this;
 $2=$b;
 $3=$len;
 var $4=$1;
 $i=0;
 label=2;break;
 case 2: 
 var $6=$i;
 var $7=($6&255);
 var $8=($7>>>0)<8;
 if($8){label=3;break;}else{label=10;break;}
 case 3: 
 var $10=$i;
 var $11=($10&255);
 var $12=$3;
 var $13=($12&255);
 var $14=($11|0)<($13|0);
 if($14){label=4;break;}else{label=5;break;}
 case 4: 
 var $16=$i;
 var $17=($16&255);
 var $18=$2;
 var $19=(($18+$17)|0);
 var $20=HEAP8[(($19)>>0)];
 var $21=($20&255);
 var $24=$21;label=6;break;
 case 5: 
 var $24=0;label=6;break;
 case 6: 
 var $24;
 var $25=(($24)&255);
 $d=$25;
 var $26=(($4+4)|0);
 var $27=HEAP32[(($26)>>2)];
 var $28=($27|0)!=0;
 if($28){label=7;break;}else{label=8;break;}
 case 7: 
 var $30=(($4+4)|0);
 var $31=HEAP32[(($30)>>2)];
 var $32=$d;
 FUNCTION_TABLE[$31]($32);
 label=8;break;
 case 8: 
 label=9;break;
 case 9: 
 var $35=$i;
 var $36=((($35)+(1))&255);
 $i=$36;
 label=2;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function _emscripten_runtime_new(){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=__Znwj(1108);
 var $4=$3;
 (function() { try { __THREW__ = 0; return __ZN17EmscriptenRuntimeC1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 STACKTOP=sp;return $4;
 case 3: 
 var $7$0 = ___cxa_find_matching_catch(-1, -1); var $7$1 = tempRet0;
 var $8=$7$0;
 $1=$8;
 var $9=$7$1;
 $2=$9;
 __ZdlPv($3);
 label=4;break;
 case 4: 
 var $11=$1;
 var $12=$2;
 var $13$0=$11;
 var $13$1=0;
 var $14$0=$13$0;
 var $14$1=$12;
 ___resumeException($14$0)
  default: assert(0, "bad label: " + label);
 }

}
Module["_emscripten_runtime_new"] = _emscripten_runtime_new;

function __ZN17EmscriptenRuntimeC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN17EmscriptenRuntimeC2Ev($2);
 STACKTOP=sp;return;
}


function _emscripten_runtime_free($self){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$self;
 var $4=$1;
 var $5=($4|0)==0;
 if($5){label=4;break;}else{label=2;break;}
 case 2: 
 (function() { try { __THREW__ = 0; return __ZN17EmscriptenRuntimeD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=3;break; } else { label=5;break; }
 case 3: 
 var $8=$4;
 __ZdlPv($8);
 label=4;break;
 case 4: 
 STACKTOP=sp;return;
 case 5: 
 var $11$0 = ___cxa_find_matching_catch(-1, -1); var $11$1 = tempRet0;
 var $12=$11$0;
 $2=$12;
 var $13=$11$1;
 $3=$13;
 var $14=$4;
 __ZdlPv($14);
 label=6;break;
 case 6: 
 var $16=$2;
 var $17=$3;
 var $18$0=$16;
 var $18$1=0;
 var $19$0=$18$0;
 var $19$1=$17;
 ___resumeException($19$0)
  default: assert(0, "bad label: " + label);
 }

}
Module["_emscripten_runtime_free"] = _emscripten_runtime_free;

function __ZN17EmscriptenRuntimeD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN17EmscriptenRuntimeD2Ev($2);
 STACKTOP=sp;return;
}


function _emscripten_runtime_send($self,$b){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$self;
 $2=$b;
 var $3=$1;
 var $4=(($3+36)|0);
 var $5=$2;
 __ZN23EmscriptenHostTransport13sendToRuntimeEh($4,$5);
 STACKTOP=sp;return;
}
Module["_emscripten_runtime_send"] = _emscripten_runtime_send;

function _emscripten_runtime_setup($self,$sendFuncAddress,$pullFuncAddress){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 $1=$self;
 $2=$sendFuncAddress;
 $3=$pullFuncAddress;
 var $4=$2;
 var $5=$4;
 var $6=$1;
 var $7=(($6+36)|0);
 var $8=(($7+4)|0);
 HEAP32[(($8)>>2)]=$5;
 var $9=$3;
 var $10=$9;
 var $11=$1;
 var $12=(($11+36)|0);
 var $13=(($12+8)|0);
 HEAP32[(($13)>>2)]=$10;
 var $14=$1;
 __ZN17EmscriptenRuntime5setupEv($14);
 STACKTOP=sp;return;
}
Module["_emscripten_runtime_setup"] = _emscripten_runtime_setup;

function __ZN17EmscriptenRuntime5setupEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+36)|0);
 var $4=(($2)|0);
 var $5=$4;
 var $6=(($2+1076)|0);
 __ZN23EmscriptenHostTransport5setupEP2IOP17HostCommunication($3,$5,$6);
 var $7=(($2+1076)|0);
 var $8=(($2+56)|0);
 var $9=(($2+36)|0);
 var $10=$9;
 __ZN17HostCommunication5setupEP7NetworkP13HostTransport($7,$8,$10);
 var $11=(($2)|0);
 var $12=(($2+36)|0);
 var $13=$12;
 __ZN12EmscriptenIO5setupEP13HostTransport($11,$13);
 var $14=(($2+1076)|0);
 __Z14loadFromEEPROMP17HostCommunication($14);
 STACKTOP=sp;return;
}


function _emscripten_runtime_run($self,$timeIncrementMs){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$self;
 $2=$timeIncrementMs;
 var $3=$1;
 var $4=$2;
 __ZN17EmscriptenRuntime12runIterationEi($3,$4);
 STACKTOP=sp;return;
}
Module["_emscripten_runtime_run"] = _emscripten_runtime_run;

function __ZN17EmscriptenRuntime12runIterationEi($this,$timeIncrementMs){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$timeIncrementMs;
 var $3=$1;
 var $4=(($3+36)|0);
 __ZN23EmscriptenHostTransport7runTickEv($4);
 var $5=(($3+56)|0);
 __ZN7Network7runTickEv($5);
 var $6=$2;
 var $7=(($3)|0);
 var $8=(($7+8)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=((($9)+($6))|0);
 HEAP32[(($8)>>2)]=$10;
 STACKTOP=sp;return;
}


function __ZN8SubGraphD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN8SubGraphD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN8SubGraphD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN8SubGraphD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I3MaxllEC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=896;
 var $4=$2;
 var $5=(($2+24)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,1);
 var $7=$2;
 HEAP32[(($7)>>2)]=896;
 var $8=(($2+24)|0);
 var $9=(($2+32)|0);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I3MaxllED1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I3MaxllED2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I3MaxllED0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I3MaxllED1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I3MaxllE7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $ret=sp;
 var $3=(sp)+(8);
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet6isDataEv($in);
 if($5){label=2;break;}else{label=10;break;}
 case 2: 
 var $7=$2;
 var $8=(($7<<24)>>24);
 var $9=($8|0)==0;
 if($9){label=3;break;}else{label=4;break;}
 case 3: 
 var $11=__ZN6PacketcvlEv($in);
 var $12=(($4+36)|0);
 HEAP32[(($12)>>2)]=$11;
 label=7;break;
 case 4: 
 var $14=$2;
 var $15=(($14<<24)>>24);
 var $16=($15|0)==1;
 if($16){label=5;break;}else{label=6;break;}
 case 5: 
 var $18=__ZN6PacketcvlEv($in);
 var $19=(($4+40)|0);
 HEAP32[(($19)>>2)]=$18;
 label=6;break;
 case 6: 
 label=7;break;
 case 7: 
 var $22=(($4+32)|0);
 var $23=(($4+36)|0);
 var $24=HEAP32[(($23)>>2)];
 var $25=(($4+40)|0);
 var $26=HEAP32[(($25)>>2)];
 __ZN3MaxclEll($ret,$22,$24,$26);
 var $27=__ZNK6Packet7isValidEv($ret);
 if($27){label=8;break;}else{label=9;break;}
 case 8: 
 var $29=$4;
 var $30=$3;
 var $31=$ret;
 assert(8 % 1 === 0);HEAP32[(($30)>>2)]=HEAP32[(($31)>>2)];HEAP32[((($30)+(4))>>2)]=HEAP32[((($31)+(4))>>2)];
 __ZN9Component4sendE6Packeta($29,$3,0);
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN6PacketcvlEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2)|0);
 var $4=$3;
 var $5=HEAP32[(($4)>>2)];
 STACKTOP=sp;return $5;
}


function __ZN3MaxclEll($agg_result,$this,$input,$threshold){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$input;
 $3=$threshold;
 var $4=$1;
 var $5=$2;
 var $6=$3;
 var $7=($5|0)<=($6|0);
 if($7){label=2;break;}else{label=3;break;}
 case 2: 
 var $9=$3;
 __ZN6PacketC1El($agg_result,$9);
 label=4;break;
 case 3: 
 var $11=$2;
 __ZN6PacketC1El($agg_result,$11);
 label=4;break;
 case 4: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I3MaxllED2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN9ComponentD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I3MinllEC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=864;
 var $4=$2;
 var $5=(($2+24)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,1);
 var $7=$2;
 HEAP32[(($7)>>2)]=864;
 var $8=(($2+24)|0);
 var $9=(($2+32)|0);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I3MinllED1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I3MinllED2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I3MinllED0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I3MinllED1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I3MinllE7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $ret=sp;
 var $3=(sp)+(8);
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet6isDataEv($in);
 if($5){label=2;break;}else{label=10;break;}
 case 2: 
 var $7=$2;
 var $8=(($7<<24)>>24);
 var $9=($8|0)==0;
 if($9){label=3;break;}else{label=4;break;}
 case 3: 
 var $11=__ZN6PacketcvlEv($in);
 var $12=(($4+36)|0);
 HEAP32[(($12)>>2)]=$11;
 label=7;break;
 case 4: 
 var $14=$2;
 var $15=(($14<<24)>>24);
 var $16=($15|0)==1;
 if($16){label=5;break;}else{label=6;break;}
 case 5: 
 var $18=__ZN6PacketcvlEv($in);
 var $19=(($4+40)|0);
 HEAP32[(($19)>>2)]=$18;
 label=6;break;
 case 6: 
 label=7;break;
 case 7: 
 var $22=(($4+32)|0);
 var $23=(($4+36)|0);
 var $24=HEAP32[(($23)>>2)];
 var $25=(($4+40)|0);
 var $26=HEAP32[(($25)>>2)];
 __ZN3MinclEll($ret,$22,$24,$26);
 var $27=__ZNK6Packet7isValidEv($ret);
 if($27){label=8;break;}else{label=9;break;}
 case 8: 
 var $29=$4;
 var $30=$3;
 var $31=$ret;
 assert(8 % 1 === 0);HEAP32[(($30)>>2)]=HEAP32[(($31)>>2)];HEAP32[((($30)+(4))>>2)]=HEAP32[((($31)+(4))>>2)];
 __ZN9Component4sendE6Packeta($29,$3,0);
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN3MinclEll($agg_result,$this,$input,$threshold){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$input;
 $3=$threshold;
 var $4=$1;
 var $5=$2;
 var $6=$3;
 var $7=($5|0)>=($6|0);
 if($7){label=2;break;}else{label=3;break;}
 case 2: 
 var $9=$3;
 __ZN6PacketC1El($agg_result,$9);
 label=4;break;
 case 3: 
 var $11=$2;
 __ZN6PacketC1El($agg_result,$11);
 label=4;break;
 case 4: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I3MinllED2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I12NumberEqualsllEC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=928;
 var $4=$2;
 var $5=(($2+24)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,1);
 var $7=$2;
 HEAP32[(($7)>>2)]=928;
 var $8=(($2+24)|0);
 var $9=(($2+32)|0);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I12NumberEqualsllED1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I12NumberEqualsllED2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I12NumberEqualsllED0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I12NumberEqualsllED1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I12NumberEqualsllE7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $ret=sp;
 var $3=(sp)+(8);
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet6isDataEv($in);
 if($5){label=2;break;}else{label=10;break;}
 case 2: 
 var $7=$2;
 var $8=(($7<<24)>>24);
 var $9=($8|0)==0;
 if($9){label=3;break;}else{label=4;break;}
 case 3: 
 var $11=__ZN6PacketcvlEv($in);
 var $12=(($4+36)|0);
 HEAP32[(($12)>>2)]=$11;
 label=7;break;
 case 4: 
 var $14=$2;
 var $15=(($14<<24)>>24);
 var $16=($15|0)==1;
 if($16){label=5;break;}else{label=6;break;}
 case 5: 
 var $18=__ZN6PacketcvlEv($in);
 var $19=(($4+40)|0);
 HEAP32[(($19)>>2)]=$18;
 label=6;break;
 case 6: 
 label=7;break;
 case 7: 
 var $22=(($4+32)|0);
 var $23=(($4+36)|0);
 var $24=HEAP32[(($23)>>2)];
 var $25=(($4+40)|0);
 var $26=HEAP32[(($25)>>2)];
 __ZN12NumberEqualsclEll($ret,$22,$24,$26);
 var $27=__ZNK6Packet7isValidEv($ret);
 if($27){label=8;break;}else{label=9;break;}
 case 8: 
 var $29=$4;
 var $30=$3;
 var $31=$ret;
 assert(8 % 1 === 0);HEAP32[(($30)>>2)]=HEAP32[(($31)>>2)];HEAP32[((($30)+(4))>>2)]=HEAP32[((($31)+(4))>>2)];
 __ZN9Component4sendE6Packeta($29,$3,0);
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12NumberEqualsclEll($agg_result,$this,$a,$b){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$a;
 $3=$b;
 var $4=$1;
 var $5=$2;
 var $6=$3;
 var $7=($5|0)==($6|0);
 __ZN6PacketC1Eb($agg_result,$7);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I12NumberEqualsllED2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I10BooleanAndbbEC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=960;
 var $4=$2;
 var $5=(($2+24)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,1);
 var $7=$2;
 HEAP32[(($7)>>2)]=960;
 var $8=(($2+24)|0);
 var $9=(($2+32)|0);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I10BooleanAndbbED1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I10BooleanAndbbED2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I10BooleanAndbbED0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I10BooleanAndbbED1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I10BooleanAndbbE7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $ret=sp;
 var $3=(sp)+(8);
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet6isDataEv($in);
 if($5){label=2;break;}else{label=10;break;}
 case 2: 
 var $7=$2;
 var $8=(($7<<24)>>24);
 var $9=($8|0)==0;
 if($9){label=3;break;}else{label=4;break;}
 case 3: 
 var $11=__ZN6PacketcvbEv($in);
 var $12=(($4+33)|0);
 var $13=($11&1);
 HEAP8[(($12)>>0)]=$13;
 label=7;break;
 case 4: 
 var $15=$2;
 var $16=(($15<<24)>>24);
 var $17=($16|0)==1;
 if($17){label=5;break;}else{label=6;break;}
 case 5: 
 var $19=__ZN6PacketcvbEv($in);
 var $20=(($4+34)|0);
 var $21=($19&1);
 HEAP8[(($20)>>0)]=$21;
 label=6;break;
 case 6: 
 label=7;break;
 case 7: 
 var $24=(($4+32)|0);
 var $25=(($4+33)|0);
 var $26=HEAP8[(($25)>>0)];
 var $27=(($26)&1);
 var $28=(($4+34)|0);
 var $29=HEAP8[(($28)>>0)];
 var $30=(($29)&1);
 __ZN10BooleanAndclEbb($ret,$24,$27,$30);
 var $31=__ZNK6Packet7isValidEv($ret);
 if($31){label=8;break;}else{label=9;break;}
 case 8: 
 var $33=$4;
 var $34=$3;
 var $35=$ret;
 assert(8 % 1 === 0);HEAP32[(($34)>>2)]=HEAP32[(($35)>>2)];HEAP32[((($34)+(4))>>2)]=HEAP32[((($35)+(4))>>2)];
 __ZN9Component4sendE6Packeta($33,$3,0);
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN6PacketcvbEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2)|0);
 var $4=$3;
 var $5=HEAP8[(($4)>>0)];
 var $6=(($5)&1);
 STACKTOP=sp;return $6;
}


function __ZN10BooleanAndclEbb($agg_result,$this,$a,$b){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=($a&1);
 $2=$4;
 var $5=($b&1);
 $3=$5;
 var $6=$1;
 var $7=$2;
 var $8=(($7)&1);
 if($8){label=2;break;}else{var $13=0;label=3;break;}
 case 2: 
 var $10=$3;
 var $11=(($10)&1);
 var $13=$11;label=3;break;
 case 3: 
 var $13;
 __ZN6PacketC1Eb($agg_result,$13);
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I10BooleanAndbbED2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I9BooleanOrbbEC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=832;
 var $4=$2;
 var $5=(($2+24)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,1);
 var $7=$2;
 HEAP32[(($7)>>2)]=832;
 var $8=(($2+24)|0);
 var $9=(($2+32)|0);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I9BooleanOrbbED1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN22PureFunctionComponent2I9BooleanOrbbED2Ev($2);
 STACKTOP=sp;return;
}


function __ZN22PureFunctionComponent2I9BooleanOrbbED0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN22PureFunctionComponent2I9BooleanOrbbED1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I9BooleanOrbbE7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $ret=sp;
 var $3=(sp)+(8);
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet6isDataEv($in);
 if($5){label=2;break;}else{label=10;break;}
 case 2: 
 var $7=$2;
 var $8=(($7<<24)>>24);
 var $9=($8|0)==0;
 if($9){label=3;break;}else{label=4;break;}
 case 3: 
 var $11=__ZN6PacketcvbEv($in);
 var $12=(($4+33)|0);
 var $13=($11&1);
 HEAP8[(($12)>>0)]=$13;
 label=7;break;
 case 4: 
 var $15=$2;
 var $16=(($15<<24)>>24);
 var $17=($16|0)==1;
 if($17){label=5;break;}else{label=6;break;}
 case 5: 
 var $19=__ZN6PacketcvbEv($in);
 var $20=(($4+34)|0);
 var $21=($19&1);
 HEAP8[(($20)>>0)]=$21;
 label=6;break;
 case 6: 
 label=7;break;
 case 7: 
 var $24=(($4+32)|0);
 var $25=(($4+33)|0);
 var $26=HEAP8[(($25)>>0)];
 var $27=(($26)&1);
 var $28=(($4+34)|0);
 var $29=HEAP8[(($28)>>0)];
 var $30=(($29)&1);
 __ZN9BooleanOrclEbb($ret,$24,$27,$30);
 var $31=__ZNK6Packet7isValidEv($ret);
 if($31){label=8;break;}else{label=9;break;}
 case 8: 
 var $33=$4;
 var $34=$3;
 var $35=$ret;
 assert(8 % 1 === 0);HEAP32[(($34)>>2)]=HEAP32[(($35)>>2)];HEAP32[((($34)+(4))>>2)]=HEAP32[((($35)+(4))>>2)];
 __ZN9Component4sendE6Packeta($33,$3,0);
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9BooleanOrclEbb($agg_result,$this,$a,$b){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=($a&1);
 $2=$4;
 var $5=($b&1);
 $3=$5;
 var $6=$1;
 var $7=$2;
 var $8=(($7)&1);
 if($8){var $13=1;label=3;break;}else{label=2;break;}
 case 2: 
 var $10=$3;
 var $11=(($10)&1);
 var $13=$11;label=3;break;
 case 3: 
 var $13;
 __ZN6PacketC1Eb($agg_result,$13);
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN22PureFunctionComponent2I9BooleanOrbbED2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN8SubGraphD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN12EmscriptenIO5setupEP13HostTransport($this,$t){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$t;
 var $3=$1;
 var $4=$2;
 var $5=(($3+32)|0);
 HEAP32[(($5)>>2)]=$4;
 STACKTOP=sp;return;
}


function __ZN17EmscriptenRuntimeD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2)|0);
 __ZN12EmscriptenIOD1Ev($3);
 STACKTOP=sp;return;
}


function __ZN12EmscriptenIOD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN12EmscriptenIOD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN12EmscriptenIOD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN2IOD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN2IOD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 STACKTOP=sp;return;
}


function __ZN17EmscriptenRuntimeC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 var $5=(($4)|0);
 __ZN12EmscriptenIOC1Ev($5);
 var $6=(($4+36)|0);
 (function() { try { __THREW__ = 0; return __ZN23EmscriptenHostTransportC1Ev($6) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=5;break; }
 case 2: 
 var $8=(($4+56)|0);
 var $9=(($4)|0);
 var $10=$9;
 (function() { try { __THREW__ = 0; return __ZN7NetworkC2EP2IO($8,$10) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=3;break; } else { label=5;break; }
 case 3: 
 var $12=(($4+1076)|0);
 (function() { try { __THREW__ = 0; return __ZN17HostCommunicationC2Ev($12) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=4;break; } else { label=5;break; }
 case 4: 
 STACKTOP=sp;return;
 case 5: 
 var $15$0 = ___cxa_find_matching_catch(-1, -1); var $15$1 = tempRet0;
 var $16=$15$0;
 $2=$16;
 var $17=$15$1;
 $3=$17;
 (function() { try { __THREW__ = 0; return __ZN12EmscriptenIOD1Ev($5) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=6;break; } else { label=8;break; }
 case 6: 
 label=7;break;
 case 7: 
 var $20=$2;
 var $21=$3;
 var $22$0=$20;
 var $22$1=0;
 var $23$0=$22$0;
 var $23$1=$21;
 ___resumeException($23$0)
 case 8: 
 var $25$0 = ___cxa_find_matching_catch(-1, -1,0); var $25$1 = tempRet0;
 var $26=$25$0;
 ___clang_call_terminate($26);
 throw "Reached an unreachable!";
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIOC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN12EmscriptenIOC2Ev($2);
 STACKTOP=sp;return;
}


function __ZN23EmscriptenHostTransportC1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN23EmscriptenHostTransportC2Ev($2);
 STACKTOP=sp;return;
}


function ___clang_call_terminate($0){
 var label=0;


 var $2=___cxa_begin_catch($0);
 __ZSt9terminatev();
 throw "Reached an unreachable!";
}


function __ZN23EmscriptenHostTransportC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN13HostTransportC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=800;
 var $5=(($2+4)|0);
 HEAP32[(($5)>>2)]=0;
 var $6=(($2+8)|0);
 HEAP32[(($6)>>2)]=0;
 STACKTOP=sp;return;
}


function __ZN12EmscriptenIOC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $i;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN2IOC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1432;
 var $5=(($2+8)|0);
 HEAP32[(($5)>>2)]=0;
 var $6=(($2+32)|0);
 HEAP32[(($6)>>2)]=0;
 $i=0;
 label=2;break;
 case 2: 
 var $8=$i;
 var $9=($8&255);
 var $10=($9|0)<20;
 if($10){label=3;break;}else{label=5;break;}
 case 3: 
 var $12=$i;
 var $13=($12&255);
 var $14=(($2+12)|0);
 var $15=(($14+$13)|0);
 HEAP8[(($15)>>0)]=0;
 label=4;break;
 case 4: 
 var $17=$i;
 var $18=((($17)+(1))&255);
 $i=$18;
 label=2;break;
 case 5: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN2IOC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=664;
 STACKTOP=sp;return;
}


function __ZN12EmscriptenIOD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN12EmscriptenIOD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIO10setIoValueEPKhh($this,$buf,$len){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $type;
 var $pin;
 var $val;
 var $b=sp;
 var $b1=(sp)+(8);
 $1=$this;
 $2=$buf;
 $3=$len;
 var $4=$1;
 var $5=$2;
 var $6=(($5+1)|0);
 var $7=HEAP8[(($6)>>0)];
 var $8=($7&255);
 $type=$8;
 var $9=$type;
 var $10=($9|0)==1;
 if($10){label=2;break;}else{label=5;break;}
 case 2: 
 label=3;break;
 case 3: 
 var $13=$4;
 var $14=(($13+4)|0);
 var $15=HEAP32[(($14)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($15,1,34);
 label=4;break;
 case 4: 
 label=19;break;
 case 5: 
 var $18=$type;
 var $19=($18|0)==2;
 if($19){label=6;break;}else{label=12;break;}
 case 6: 
 var $21=$2;
 var $22=(($21+2)|0);
 var $23=HEAP8[(($22)>>0)];
 $pin=$23;
 var $24=$2;
 var $25=(($24+3)|0);
 var $26=HEAP8[(($25)>>0)];
 var $27=(($26<<24)>>24)!=0;
 var $28=($27&1);
 $val=$28;
 var $29=$pin;
 var $30=($29&255);
 var $31=($30|0)<20;
 if($31){label=7;break;}else{label=8;break;}
 case 7: 
 var $33=$val;
 var $34=(($33)&1);
 var $35=$pin;
 var $36=($35&255);
 var $37=(($4+12)|0);
 var $38=(($37+$36)|0);
 var $39=($34&1);
 HEAP8[(($38)>>0)]=$39;
 var $40=(($b)|0);
 HEAP8[(($40)>>0)]=112;
 var $41=(($40+1)|0);
 var $42=$2;
 var $43=(($42+1)|0);
 var $44=HEAP8[(($43)>>0)];
 HEAP8[(($41)>>0)]=$44;
 var $45=(($41+1)|0);
 var $46=$2;
 var $47=(($46+2)|0);
 var $48=HEAP8[(($47)>>0)];
 HEAP8[(($45)>>0)]=$48;
 var $49=(($45+1)|0);
 var $50=$2;
 var $51=(($50+3)|0);
 var $52=HEAP8[(($51)>>0)];
 HEAP8[(($49)>>0)]=$52;
 var $53=(($49+1)|0);
 var $54=$2;
 var $55=(($54+4)|0);
 var $56=HEAP8[(($55)>>0)];
 HEAP8[(($53)>>0)]=$56;
 var $57=(($4+32)|0);
 var $58=HEAP32[(($57)>>2)];
 var $59=$58;
 var $60=HEAP32[(($59)>>2)];
 var $61=(($60+8)|0);
 var $62=HEAP32[(($61)>>2)];
 var $63=(($b)|0);
 FUNCTION_TABLE[$62]($58,$63,5);
 label=11;break;
 case 8: 
 label=9;break;
 case 9: 
 var $66=$4;
 var $67=(($66+4)|0);
 var $68=HEAP32[(($67)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($68,1,33);
 label=10;break;
 case 10: 
 label=11;break;
 case 11: 
 label=18;break;
 case 12: 
 var $72=$type;
 var $73=($72|0)==3;
 if($73){label=13;break;}else{label=14;break;}
 case 13: 
 var $75=$2;
 var $76=(($75+2)|0);
 var $77=__ZL8readLongPKh($76);
 var $78=(($4+8)|0);
 HEAP32[(($78)>>2)]=$77;
 var $79=(($b1)|0);
 HEAP8[(($79)>>0)]=112;
 var $80=(($79+1)|0);
 var $81=$2;
 var $82=(($81+1)|0);
 var $83=HEAP8[(($82)>>0)];
 HEAP8[(($80)>>0)]=$83;
 var $84=(($80+1)|0);
 var $85=$2;
 var $86=(($85+2)|0);
 var $87=HEAP8[(($86)>>0)];
 HEAP8[(($84)>>0)]=$87;
 var $88=(($84+1)|0);
 var $89=$2;
 var $90=(($89+3)|0);
 var $91=HEAP8[(($90)>>0)];
 HEAP8[(($88)>>0)]=$91;
 var $92=(($88+1)|0);
 var $93=$2;
 var $94=(($93+4)|0);
 var $95=HEAP8[(($94)>>0)];
 HEAP8[(($92)>>0)]=$95;
 var $96=(($4+32)|0);
 var $97=HEAP32[(($96)>>2)];
 var $98=$97;
 var $99=HEAP32[(($98)>>2)];
 var $100=(($99+8)|0);
 var $101=HEAP32[(($100)>>2)];
 var $102=(($b1)|0);
 FUNCTION_TABLE[$101]($97,$102,5);
 label=17;break;
 case 14: 
 label=15;break;
 case 15: 
 var $105=$4;
 var $106=(($105+4)|0);
 var $107=HEAP32[(($106)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($107,1,34);
 label=16;break;
 case 16: 
 label=17;break;
 case 17: 
 label=18;break;
 case 18: 
 label=19;break;
 case 19: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIO11SerialBeginEhi($this,$serialDevice,$baudrate){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$serialDevice;
 $3=$baudrate;
 var $4=$1;
 label=2;break;
 case 2: 
 var $6=$4;
 var $7=(($6+4)|0);
 var $8=HEAP32[(($7)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($8,1,26);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIO19SerialDataAvailableEh($this,$serialDevice){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$serialDevice;
 var $3=$1;
 label=2;break;
 case 2: 
 var $5=$3;
 var $6=(($5+4)|0);
 var $7=HEAP32[(($6)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($7,1,26);
 label=3;break;
 case 3: 
 STACKTOP=sp;return 0;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIO10SerialReadEh($this,$serialDevice){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$serialDevice;
 var $3=$1;
 label=2;break;
 case 2: 
 var $5=$3;
 var $6=(($5+4)|0);
 var $7=HEAP32[(($6)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($7,1,26);
 label=3;break;
 case 3: 
 STACKTOP=sp;return 0;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIO11SerialWriteEhh($this,$serialDevice,$b){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$serialDevice;
 $3=$b;
 var $4=$1;
 label=2;break;
 case 2: 
 var $6=$4;
 var $7=(($6+4)|0);
 var $8=HEAP32[(($7)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($8,1,26);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIO10PinSetModeEaN2IO7PinModeE($this,$pin,$mode){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 var $b=sp;
 $1=$this;
 $2=$pin;
 $3=$mode;
 var $4=$1;
 var $5=(($b)|0);
 HEAP8[(($5)>>0)]=113;
 var $6=(($5+1)|0);
 HEAP8[(($6)>>0)]=4;
 var $7=(($6+1)|0);
 var $8=$2;
 HEAP8[(($7)>>0)]=$8;
 var $9=(($7+1)|0);
 var $10=$3;
 var $11=(($10)&255);
 HEAP8[(($9)>>0)]=$11;
 var $12=(($4+32)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=$13;
 var $15=HEAP32[(($14)>>2)];
 var $16=(($15+8)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=(($b)|0);
 FUNCTION_TABLE[$17]($13,$18,4);
 STACKTOP=sp;return;
}


function __ZN12EmscriptenIO12PinSetPullupEaN2IO10PullupModeE($this,$pin,$mode){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$pin;
 $3=$mode;
 var $4=$1;
 label=2;break;
 case 2: 
 var $6=$4;
 var $7=(($6+4)|0);
 var $8=HEAP32[(($7)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($8,1,26);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIO12DigitalWriteEab($this,$pin,$val){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 var $b=sp;
 $1=$this;
 $2=$pin;
 var $4=($val&1);
 $3=$4;
 var $5=$1;
 var $6=(($b)|0);
 HEAP8[(($6)>>0)]=113;
 var $7=(($6+1)|0);
 HEAP8[(($7)>>0)]=2;
 var $8=(($7+1)|0);
 var $9=$2;
 HEAP8[(($8)>>0)]=$9;
 var $10=(($8+1)|0);
 var $11=$3;
 var $12=(($11)&1);
 var $13=($12&1);
 HEAP8[(($10)>>0)]=$13;
 var $14=(($5+32)|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=$15;
 var $17=HEAP32[(($16)>>2)];
 var $18=(($17+8)|0);
 var $19=HEAP32[(($18)>>2)];
 var $20=(($b)|0);
 FUNCTION_TABLE[$19]($15,$20,4);
 STACKTOP=sp;return;
}


function __ZN12EmscriptenIO11DigitalReadEa($this,$pin){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$pin;
 var $3=$1;
 var $4=$2;
 var $5=(($4<<24)>>24);
 var $6=(($3+12)|0);
 var $7=(($6+$5)|0);
 var $8=HEAP8[(($7)>>0)];
 var $9=(($8)&1);
 STACKTOP=sp;return $9;
}


function __ZN12EmscriptenIO10AnalogReadEa($this,$pin){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$pin;
 var $3=$1;
 label=2;break;
 case 2: 
 var $5=$3;
 var $6=(($5+4)|0);
 var $7=HEAP32[(($6)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($7,1,26);
 label=3;break;
 case 3: 
 STACKTOP=sp;return 0;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIO8PwmWriteEal($this,$pin,$dutyPercent){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$pin;
 $3=$dutyPercent;
 var $4=$1;
 label=2;break;
 case 2: 
 var $6=$4;
 var $7=(($6+4)|0);
 var $8=HEAP32[(($7)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($8,1,26);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12EmscriptenIO14TimerCurrentMsEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+8)|0);
 var $4=HEAP32[(($3)>>2)];
 STACKTOP=sp;return $4;
}


function __ZN2IO18TimerCurrentMicrosEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 var $4=HEAP32[(($3)>>2)];
 var $5=(($4+52)|0);
 var $6=HEAP32[(($5)>>2)];
 var $7=FUNCTION_TABLE[$6]($2);
 var $8=((($7)*(1000))&-1);
 STACKTOP=sp;return $8;
}


function __ZN12EmscriptenIO23AttachExternalInterruptEhN2IO9Interrupt4ModeEPFvPvES3_($this,$interrupt,$mode,$func,$user){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $4;
 var $5;
 $1=$this;
 $2=$interrupt;
 $3=$mode;
 $4=$func;
 $5=$user;
 var $6=$1;
 label=2;break;
 case 2: 
 var $8=$6;
 var $9=(($8+4)|0);
 var $10=HEAP32[(($9)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($10,1,26);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZL8readLongPKh($buf){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$buf;
 var $2=$1;
 var $3=(($2)|0);
 var $4=HEAP8[(($3)>>0)];
 var $5=($4&255);
 var $6=$1;
 var $7=(($6+1)|0);
 var $8=HEAP8[(($7)>>0)];
 var $9=($8&255);
 var $10=($9<<8);
 var $11=((($5)+($10))|0);
 var $12=$1;
 var $13=(($12+2)|0);
 var $14=HEAP8[(($13)>>0)];
 var $15=($14&255);
 var $16=($15<<16);
 var $17=((($11)+($16))|0);
 var $18=$1;
 var $19=(($18+3)|0);
 var $20=HEAP8[(($19)>>0)];
 var $21=($20&255);
 var $22=($21<<24);
 var $23=((($17)+($22))|0);
 STACKTOP=sp;return $23;
}


function __ZN2IOD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN2IOD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN2IOD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN2IOD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN2IO10setIoValueEPKhh($this,$0,$1){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $3;
 var $4;
 var $5;
 $3=$this;
 $4=$0;
 $5=$1;
 var $6=$3;
 label=2;break;
 case 2: 
 var $8=(($6+4)|0);
 var $9=HEAP32[(($8)>>2)];
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($9,1,26);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9ForwardIfC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=152;
 STACKTOP=sp;return;
}


function __ZN21SingleOutputComponentC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=992;
 var $4=$2;
 var $5=(($2+24)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,1);
 var $7=$2;
 HEAP32[(($7)>>2)]=992;
 var $8=(($2+24)|0);
 STACKTOP=sp;return;
}


function __ZN9ForwardIfD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9ForwardIfD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9ForwardIfD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN9ForwardIfD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9ForwardIf7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $input;
 var $p=sp;
 var $3=(sp)+(8);
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet6isDataEv($in);
 if($5){label=2;break;}else{label=5;break;}
 case 2: 
 var $7=__ZNK6Packet6asBoolEv($in);
 var $8=($7&1);
 $input=$8;
 var $9=$input;
 var $10=(($9)&1);
 if($10){label=3;break;}else{label=4;break;}
 case 3: 
 var $12=$input;
 var $13=(($12)&1);
 __ZN6PacketC1Eb($p,$13);
 var $14=$4;
 var $15=$3;
 var $16=$p;
 assert(8 % 1 === 0);HEAP32[(($15)>>2)]=HEAP32[(($16)>>2)];HEAP32[((($15)+(4))>>2)]=HEAP32[((($16)+(4))>>2)];
 __ZN9Component4sendE6Packeta($14,$3,0);
 label=4;break;
 case 4: 
 label=5;break;
 case 5: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9ForwardIfD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN21SingleOutputComponentD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN21SingleOutputComponentD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN21SingleOutputComponentD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN21SingleOutputComponentD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN21SingleOutputComponentD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5TivaCC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=472;
 STACKTOP=sp;return;
}


function __ZN14DummyComponentC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentC2EP10Connectioni($3,0,0);
 var $4=$2;
 HEAP32[(($4)>>2)]=1272;
 STACKTOP=sp;return;
}


function __ZN5TivaCD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5TivaCD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5TivaCD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN5TivaCD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN14DummyComponent7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$port;
 var $3=$1;
 label=2;break;
 case 2: 
 var $5=$3;
 var $6=(($5+16)|0);
 var $7=HEAP32[(($6)>>2)];
 var $8=(($7+1008)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=$9;
 __ZL14microflo_debugP12DebugHandler10DebugLevel7DebugId($10,1,27);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5TivaCD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN14DummyComponentD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN14DummyComponentD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN14DummyComponentD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN14DummyComponentD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN14DummyComponentD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN11RaspberryPiC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1568;
 STACKTOP=sp;return;
}


function __ZN11RaspberryPiD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN11RaspberryPiD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN11RaspberryPiD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN11RaspberryPiD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN11RaspberryPiD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN7MbedLPCC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=408;
 STACKTOP=sp;return;
}


function __ZN7MbedLPCD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN7MbedLPCD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN7MbedLPCD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN7MbedLPCD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7MbedLPCD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN8ATUSBKEYC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=376;
 var $4=$2;
 var $5=(($2+24)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,47);
 var $7=$2;
 HEAP32[(($7)>>2)]=376;
 var $8=(($2+24)|0);
 STACKTOP=sp;return;
}


function __ZN8ATUSBKEYD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN8ATUSBKEYD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN8ATUSBKEYD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN8ATUSBKEYD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN8ATUSBKEY7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $outPort;
 var $val;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet7isSetupEv($in);
 if($5){label=2;break;}else{label=7;break;}
 case 2: 
 $outPort=0;
 label=3;break;
 case 3: 
 var $8=$outPort;
 var $9=($8|0)<47;
 if($9){label=4;break;}else{label=6;break;}
 case 4: 
 var $11=$outPort;
 $val=$11;
 var $12=$4;
 var $13=$val;
 __ZN6PacketC1El($3,$13);
 var $14=$outPort;
 var $15=(($14)&255);
 __ZN9Component4sendE6Packeta($12,$3,$15);
 label=5;break;
 case 5: 
 var $17=$outPort;
 var $18=((($17)+(1))|0);
 $outPort=$18;
 label=3;break;
 case 6: 
 label=7;break;
 case 7: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet7isSetupEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)==1;
 STACKTOP=sp;return $5;
}


function __ZN8ATUSBKEYD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN10ArduinoUnoC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=1696;
 var $4=$2;
 var $5=(($2+24)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,20);
 var $7=$2;
 HEAP32[(($7)>>2)]=1696;
 var $8=(($2+24)|0);
 STACKTOP=sp;return;
}


function __ZN10ArduinoUnoD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN10ArduinoUnoD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN10ArduinoUnoD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN10ArduinoUnoD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10ArduinoUno7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $digitalPins;
 var $analogPins;
 var $outPort;
 var $val;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 $digitalPins=14;
 $analogPins=6;
 var $5=__ZNK6Packet7isSetupEv($in);
 if($5){label=2;break;}else{label=10;break;}
 case 2: 
 $outPort=0;
 label=3;break;
 case 3: 
 var $8=$outPort;
 var $9=(($8<<24)>>24);
 var $10=($9|0)<20;
 if($10){label=4;break;}else{label=9;break;}
 case 4: 
 var $12=$outPort;
 var $13=(($12<<24)>>24);
 var $14=($13|0)<14;
 if($14){label=5;break;}else{label=6;break;}
 case 5: 
 var $16=$outPort;
 var $17=(($16<<24)>>24);
 var $23=$17;label=7;break;
 case 6: 
 var $19=$outPort;
 var $20=(($19<<24)>>24);
 var $21=((($20)-(14))|0);
 var $23=$21;label=7;break;
 case 7: 
 var $23;
 $val=$23;
 var $24=$4;
 var $25=$val;
 __ZN6PacketC1El($3,$25);
 var $26=$outPort;
 __ZN9Component4sendE6Packeta($24,$3,$26);
 label=8;break;
 case 8: 
 var $28=$outPort;
 var $29=((($28)+(1))&255);
 $outPort=$29;
 label=3;break;
 case 9: 
 label=10;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10ArduinoUnoD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN9BoolToIntC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=248;
 STACKTOP=sp;return;
}


function __ZN9BoolToIntD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9BoolToIntD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9BoolToIntD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN9BoolToIntD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9BoolToInt7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+24)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 var $4=(sp)+(8);
 var $5=(sp)+(16);
 $1=$this;
 $2=$port;
 var $6=$1;
 var $7=__ZNK6Packet6isBoolEv($in);
 if($7){label=2;break;}else{label=3;break;}
 case 2: 
 var $9=$6;
 var $10=$5;
 var $11=$in;
 assert(8 % 1 === 0);HEAP32[(($10)>>2)]=HEAP32[(($11)>>2)];HEAP32[((($10)+(4))>>2)]=HEAP32[((($11)+(4))>>2)];
 __ZN10BoolToIntFclE6Packet($3,$4,$5);
 __ZN9Component4sendE6Packeta($9,$3,0);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10BoolToIntFclE6Packet($agg_result,$this,$in){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];

 var $1;
 $1=$this;
 var $2=$1;
 var $3=__ZNK6Packet6asBoolEv($in);
 var $4=($3?1:0);
 __ZN6PacketC1El($agg_result,$4);
 STACKTOP=sp;return;
}


function __ZN9BoolToIntD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN10LedChainWSC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=1664;
 var $4=$2;
 var $5=(($2+32)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,2);
 var $7=$2;
 HEAP32[(($7)>>2)]=1664;
 var $8=(($2+23)|0);
 HEAP8[(($8)>>0)]=-1;
 var $9=(($2+24)|0);
 HEAP8[(($9)>>0)]=-1;
 var $10=(($2+25)|0);
 HEAP8[(($10)>>0)]=0;
 var $11=(($2+26)|0);
 HEAP8[(($11)>>0)]=-1;
 var $12=(($2+27)|0);
 HEAP8[(($12)>>0)]=0;
 var $13=(($2+28)|0);
 HEAP32[(($13)>>2)]=-1;
 var $14=(($2+32)|0);
 STACKTOP=sp;return;
}


function __ZN10LedChainWSD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN10LedChainWSD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN10LedChainWSD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN10LedChainWSD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10LedChainWS7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+32)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 var $4=(sp)+(8);
 var $5=(sp)+(16);
 var $6=(sp)+(24);
 $1=$this;
 $2=$port;
 var $7=$1;
 var $8=$2;
 var $9=(($8<<24)>>24);
 var $10=($9|0)==0;
 if($10){label=2;break;}else{label=14;break;}
 case 2: 
 var $12=(($7+28)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=($13|0)==-1;
 if($14){label=3;break;}else{label=5;break;}
 case 3: 
 var $16=__ZNK6Packet8isNumberEv($in);
 if($16){label=4;break;}else{label=5;break;}
 case 4: 
 var $18=__ZNK6Packet9asIntegerEv($in);
 var $19=(($7+28)|0);
 HEAP32[(($19)>>2)]=$18;
 label=13;break;
 case 5: 
 var $21=(($7+28)|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=($22|0)!=-1;
 if($23){label=6;break;}else{label=8;break;}
 case 6: 
 var $25=__ZNK6Packet9isIntegerEv($in);
 if($25){label=7;break;}else{label=8;break;}
 case 7: 
 var $27=__ZNK6Packet9asIntegerEv($in);
 __ZN10LedChainWS18updateCurrentPixelEj($7,$27);
 var $28=(($7+28)|0);
 HEAP32[(($28)>>2)]=-1;
 label=12;break;
 case 8: 
 var $30=__ZNK6Packet12isEndBracketEv($in);
 if($30){label=10;break;}else{label=9;break;}
 case 9: 
 var $32=__ZNK6Packet14isStartBracketEv($in);
 if($32){label=10;break;}else{label=11;break;}
 case 10: 
 var $34=(($7+28)|0);
 HEAP32[(($34)>>2)]=-1;
 label=11;break;
 case 11: 
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 label=31;break;
 case 14: 
 var $39=$2;
 var $40=(($39<<24)>>24);
 var $41=($40|0)==1;
 if($41){label=15;break;}else{label=16;break;}
 case 15: 
 var $43=__ZNK6Packet9asIntegerEv($in);
 var $44=(($43)&255);
 var $45=(($7+23)|0);
 HEAP8[(($45)>>0)]=$44;
 var $46=(($7+27)|0);
 HEAP8[(($46)>>0)]=0;
 var $47=$7;
 var $48=(($7+27)|0);
 var $49=HEAP8[(($48)>>0)];
 var $50=(($49)&1);
 __ZN6PacketC1Eb($3,$50);
 __ZN9Component4sendE6Packeta($47,$3,0);
 __ZN10LedChainWS13tryInitializeEv($7);
 label=30;break;
 case 16: 
 var $52=$2;
 var $53=(($52<<24)>>24);
 var $54=($53|0)==2;
 if($54){label=17;break;}else{label=18;break;}
 case 17: 
 var $56=__ZNK6Packet9asIntegerEv($in);
 var $57=(($56)&255);
 var $58=(($7+24)|0);
 HEAP8[(($58)>>0)]=$57;
 var $59=(($7+27)|0);
 HEAP8[(($59)>>0)]=0;
 var $60=$7;
 var $61=(($7+27)|0);
 var $62=HEAP8[(($61)>>0)];
 var $63=(($62)&1);
 __ZN6PacketC1Eb($4,$63);
 __ZN9Component4sendE6Packeta($60,$4,0);
 __ZN10LedChainWS13tryInitializeEv($7);
 label=29;break;
 case 18: 
 var $65=$2;
 var $66=(($65<<24)>>24);
 var $67=($66|0)==5;
 if($67){label=19;break;}else{label=20;break;}
 case 19: 
 var $69=__ZNK6Packet6asBoolEv($in);
 var $70=(($7+25)|0);
 var $71=($69&1);
 HEAP8[(($70)>>0)]=$71;
 var $72=(($7+27)|0);
 HEAP8[(($72)>>0)]=0;
 var $73=$7;
 var $74=(($7+27)|0);
 var $75=HEAP8[(($74)>>0)];
 var $76=(($75)&1);
 __ZN6PacketC1Eb($5,$76);
 __ZN9Component4sendE6Packeta($73,$5,0);
 __ZN10LedChainWS13tryInitializeEv($7);
 label=28;break;
 case 20: 
 var $78=$2;
 var $79=(($78<<24)>>24);
 var $80=($79|0)==3;
 if($80){label=21;break;}else{label=22;break;}
 case 21: 
 var $82=__ZNK6Packet9asIntegerEv($in);
 var $83=(($82)&255);
 var $84=(($7+26)|0);
 HEAP8[(($84)>>0)]=$83;
 var $85=(($7+27)|0);
 HEAP8[(($85)>>0)]=0;
 var $86=$7;
 var $87=(($7+27)|0);
 var $88=HEAP8[(($87)>>0)];
 var $89=(($88)&1);
 __ZN6PacketC1Eb($6,$89);
 __ZN9Component4sendE6Packeta($86,$6,0);
 __ZN10LedChainWS13tryInitializeEv($7);
 label=27;break;
 case 22: 
 var $91=$2;
 var $92=(($91<<24)>>24);
 var $93=($92|0)==4;
 if($93){label=23;break;}else{label=26;break;}
 case 23: 
 var $95=(($7+27)|0);
 var $96=HEAP8[(($95)>>0)];
 var $97=(($96)&1);
 if($97){label=24;break;}else{label=25;break;}
 case 24: 
 label=25;break;
 case 25: 
 label=26;break;
 case 26: 
 label=27;break;
 case 27: 
 label=28;break;
 case 28: 
 label=29;break;
 case 29: 
 label=30;break;
 case 30: 
 label=31;break;
 case 31: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet9isIntegerEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)==7;
 STACKTOP=sp;return $5;
}


function __ZN10LedChainWS18updateCurrentPixelEj($this,$rgb){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+32)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $p;
 var $3=sp;
 var $4=(sp)+(8);
 var $5=(sp)+(16);
 var $6=(sp)+(24);
 $1=$this;
 $2=$rgb;
 var $7=$1;
 var $8=(($7+27)|0);
 var $9=HEAP8[(($8)>>0)];
 var $10=(($9)&1);
 if($10){label=2;break;}else{label=4;break;}
 case 2: 
 var $12=(($7+28)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=($13|0)<0;
 if($14){label=4;break;}else{label=3;break;}
 case 3: 
 var $16=(($7+28)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=(($7+26)|0);
 var $19=HEAP8[(($18)>>0)];
 var $20=(($19<<24)>>24);
 var $21=($17|0)>=($20|0);
 if($21){label=4;break;}else{label=5;break;}
 case 4: 
 label=6;break;
 case 5: 
 $p=1;
 var $24=$7;
 __ZN6PacketC1E3Msg($3,9);
 __ZN9Component4sendE6Packeta($24,$3,1);
 var $25=$7;
 var $26=(($7+28)|0);
 var $27=HEAP32[(($26)>>2)];
 __ZN6PacketC1El($4,$27);
 __ZN9Component4sendE6Packeta($25,$4,0);
 var $28=$7;
 var $29=$2;
 __ZN6PacketC1El($5,$29);
 __ZN9Component4sendE6Packeta($28,$5,0);
 var $30=$7;
 __ZN6PacketC1E3Msg($6,10);
 __ZN9Component4sendE6Packeta($30,$6,1);
 label=6;break;
 case 6: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet12isEndBracketEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)==10;
 STACKTOP=sp;return $5;
}


function __ZNK6Packet14isStartBracketEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)==9;
 STACKTOP=sp;return $5;
}


function __ZN10LedChainWS13tryInitializeEv($this){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $pinConfigReady;
 var $2=sp;
 $1=$this;
 var $3=$1;
 var $4=(($3+25)|0);
 var $5=HEAP8[(($4)>>0)];
 var $6=(($5)&1);
 if($6){var $20=1;label=5;break;}else{label=2;break;}
 case 2: 
 var $8=(($3+23)|0);
 var $9=HEAP8[(($8)>>0)];
 var $10=(($9<<24)>>24);
 var $11=($10|0)>=0;
 if($11){label=3;break;}else{var $18=0;label=4;break;}
 case 3: 
 var $13=(($3+24)|0);
 var $14=HEAP8[(($13)>>0)];
 var $15=(($14<<24)>>24);
 var $16=($15|0)>=0;
 var $18=$16;label=4;break;
 case 4: 
 var $18;
 var $20=$18;label=5;break;
 case 5: 
 var $20;
 var $21=($20&1);
 $pinConfigReady=$21;
 var $22=(($3+27)|0);
 var $23=HEAP8[(($22)>>0)];
 var $24=(($23)&1);
 if($24){label=8;break;}else{label=6;break;}
 case 6: 
 var $26=(($3+26)|0);
 var $27=HEAP8[(($26)>>0)];
 var $28=(($27<<24)>>24);
 var $29=($28|0)<0;
 if($29){label=8;break;}else{label=7;break;}
 case 7: 
 var $31=$pinConfigReady;
 var $32=(($31)&1);
 if($32){label=9;break;}else{label=8;break;}
 case 8: 
 label=10;break;
 case 9: 
 var $35=(($3+27)|0);
 HEAP8[(($35)>>0)]=1;
 var $36=$3;
 var $37=(($3+27)|0);
 var $38=HEAP8[(($37)>>0)];
 var $39=(($38)&1);
 __ZN6PacketC1Eb($2,$39);
 __ZN9Component4sendE6Packeta($36,$2,0);
 label=10;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10LedChainWSD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN14PseudoPwmWriteC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1240;
 var $5=(($2+32)|0);
 HEAP8[(($5)>>0)]=-1;
 var $6=(($2+36)|0);
 HEAP32[(($6)>>2)]=-1;
 var $7=(($2+40)|0);
 HEAP32[(($7)>>2)]=-1;
 var $8=(($2+44)|0);
 HEAP32[(($8)>>2)]=0;
 var $9=(($2+48)|0);
 HEAP8[(($9)>>0)]=1;
 STACKTOP=sp;return;
}


function __ZN14PseudoPwmWriteD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN14PseudoPwmWriteD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN14PseudoPwmWriteD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN14PseudoPwmWriteD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN14PseudoPwmWrite7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$port;
 var $3=$1;
 var $4=$2;
 var $5=(($4<<24)>>24);
 var $6=($5|0)==0;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 var $8=__ZNK6Packet9asIntegerEv($in);
 var $9=(($3+36)|0);
 HEAP32[(($9)>>2)]=$8;
 label=12;break;
 case 3: 
 var $11=$2;
 var $12=(($11<<24)>>24);
 var $13=($12|0)==3;
 if($13){label=4;break;}else{label=5;break;}
 case 4: 
 var $15=__ZNK6Packet9asIntegerEv($in);
 var $16=(($15)&255);
 var $17=(($3+32)|0);
 HEAP8[(($17)>>0)]=$16;
 var $18=$3;
 var $19=(($18+4)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=$20;
 var $22=HEAP32[(($21)>>2)];
 var $23=(($22+28)|0);
 var $24=HEAP32[(($23)>>2)];
 var $25=(($3+32)|0);
 var $26=HEAP8[(($25)>>0)];
 FUNCTION_TABLE[$24]($20,$26,1);
 label=11;break;
 case 5: 
 var $28=$2;
 var $29=(($28<<24)>>24);
 var $30=($29|0)==2;
 if($30){label=6;break;}else{label=7;break;}
 case 6: 
 var $32=(($3+36)|0);
 var $33=HEAP32[(($32)>>2)];
 var $34=((($33)*(100))&-1);
 var $35=__ZNK6Packet9asIntegerEv($in);
 var $36=(((($34|0))/(($35|0)))&-1);
 var $37=(($3+40)|0);
 HEAP32[(($37)>>2)]=$36;
 label=10;break;
 case 7: 
 var $39=$2;
 var $40=(($39<<24)>>24);
 var $41=($40|0)==1;
 if($41){label=8;break;}else{label=9;break;}
 case 8: 
 var $43=__ZNK6Packet9asIntegerEv($in);
 var $44=(($3+40)|0);
 HEAP32[(($44)>>2)]=$43;
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 label=11;break;
 case 11: 
 label=12;break;
 case 12: 
 var $49=__ZNK6Packet6isTickEv($in);
 if($49){label=13;break;}else{label=14;break;}
 case 13: 
 var $51=$3;
 var $52=(($51+4)|0);
 var $53=HEAP32[(($52)>>2)];
 var $54=$53;
 var $55=HEAP32[(($54)>>2)];
 var $56=(($55+56)|0);
 var $57=HEAP32[(($56)>>2)];
 var $58=FUNCTION_TABLE[$57]($53);
 var $59=(((($58|0))/(100))&-1);
 __ZN14PseudoPwmWrite7runTickEm($3,$59);
 label=14;break;
 case 14: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet6isTickEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)==2;
 STACKTOP=sp;return $5;
}


function __ZN14PseudoPwmWrite7runTickEm($this,$timeMicro){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $newState;
 var $3=sp;
 $1=$this;
 $2=$timeMicro;
 var $4=$1;
 var $5=(($4+32)|0);
 var $6=HEAP8[(($5)>>0)];
 var $7=(($6<<24)>>24);
 var $8=($7|0)<0;
 if($8){label=4;break;}else{label=2;break;}
 case 2: 
 var $10=(($4+36)|0);
 var $11=HEAP32[(($10)>>2)];
 var $12=($11|0)<0;
 if($12){label=4;break;}else{label=3;break;}
 case 3: 
 var $14=(($4+40)|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=($15|0)<0;
 if($16){label=4;break;}else{label=5;break;}
 case 4: 
 label=17;break;
 case 5: 
 var $19=(($4+48)|0);
 var $20=HEAP8[(($19)>>0)];
 var $21=(($20)&1);
 var $22=($21&1);
 $newState=$22;
 var $23=(($4+48)|0);
 var $24=HEAP8[(($23)>>0)];
 var $25=(($24)&1);
 if($25){label=6;break;}else{label=9;break;}
 case 6: 
 var $27=$2;
 var $28=(($4+44)|0);
 var $29=HEAP32[(($28)>>2)];
 var $30=(($4+40)|0);
 var $31=HEAP32[(($30)>>2)];
 var $32=((($29)+($31))|0);
 var $33=($27>>>0)>($32>>>0);
 if($33){label=7;break;}else{label=8;break;}
 case 7: 
 $newState=0;
 label=8;break;
 case 8: 
 label=9;break;
 case 9: 
 var $37=$2;
 var $38=(($4+44)|0);
 var $39=HEAP32[(($38)>>2)];
 var $40=(($4+36)|0);
 var $41=HEAP32[(($40)>>2)];
 var $42=((($39)+($41))|0);
 var $43=($37>>>0)>=($42>>>0);
 if($43){label=10;break;}else{label=11;break;}
 case 10: 
 var $45=$2;
 var $46=(($4+44)|0);
 HEAP32[(($46)>>2)]=$45;
 $newState=1;
 label=11;break;
 case 11: 
 var $48=(($4+40)|0);
 var $49=HEAP32[(($48)>>2)];
 var $50=($49|0)<5;
 if($50){label=12;break;}else{label=13;break;}
 case 12: 
 $newState=0;
 label=13;break;
 case 13: 
 var $53=(($4+36)|0);
 var $54=HEAP32[(($53)>>2)];
 var $55=(($4+40)|0);
 var $56=HEAP32[(($55)>>2)];
 var $57=((($54)-($56))|0);
 var $58=($57|0)<10;
 if($58){label=14;break;}else{label=15;break;}
 case 14: 
 $newState=1;
 label=15;break;
 case 15: 
 var $61=$newState;
 var $62=(($61)&1);
 var $63=($62&1);
 var $64=(($4+48)|0);
 var $65=HEAP8[(($64)>>0)];
 var $66=(($65)&1);
 var $67=($66&1);
 var $68=($63|0)!=($67|0);
 if($68){label=16;break;}else{label=17;break;}
 case 16: 
 var $70=$4;
 var $71=(($70+4)|0);
 var $72=HEAP32[(($71)>>2)];
 var $73=$72;
 var $74=HEAP32[(($73)>>2)];
 var $75=(($74+36)|0);
 var $76=HEAP32[(($75)>>2)];
 var $77=(($4+32)|0);
 var $78=HEAP8[(($77)>>0)];
 var $79=$newState;
 var $80=(($79)&1);
 FUNCTION_TABLE[$76]($72,$78,$80);
 var $81=$4;
 var $82=$newState;
 var $83=(($82)&1);
 __ZN6PacketC1Eb($3,$83);
 __ZN9Component4sendE6Packeta($81,$3,0);
 var $84=$newState;
 var $85=(($84)&1);
 var $86=(($4+48)|0);
 var $87=($85&1);
 HEAP8[(($86)>>0)]=$87;
 label=17;break;
 case 17: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN14PseudoPwmWriteD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN16LedChainNeoPixelC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=1144;
 var $4=$2;
 var $5=(($2+32)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,2);
 var $7=$2;
 HEAP32[(($7)>>2)]=1144;
 var $8=(($2+23)|0);
 HEAP8[(($8)>>0)]=-1;
 var $9=(($2+24)|0);
 HEAP8[(($9)>>0)]=-1;
 var $10=(($2+25)|0);
 HEAP8[(($10)>>0)]=0;
 var $11=(($2+28)|0);
 HEAP32[(($11)>>2)]=-1;
 var $12=(($2+32)|0);
 STACKTOP=sp;return;
}


function __ZN16LedChainNeoPixelD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN16LedChainNeoPixelD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN16LedChainNeoPixelD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN16LedChainNeoPixelD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN16LedChainNeoPixel7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 var $4=(sp)+(8);
 $1=$this;
 $2=$port;
 var $5=$1;
 var $6=$2;
 var $7=(($6<<24)>>24);
 var $8=($7|0)==0;
 if($8){label=2;break;}else{label=14;break;}
 case 2: 
 var $10=(($5+28)|0);
 var $11=HEAP32[(($10)>>2)];
 var $12=($11|0)==-1;
 if($12){label=3;break;}else{label=5;break;}
 case 3: 
 var $14=__ZNK6Packet8isNumberEv($in);
 if($14){label=4;break;}else{label=5;break;}
 case 4: 
 var $16=__ZNK6Packet9asIntegerEv($in);
 var $17=(($5+28)|0);
 HEAP32[(($17)>>2)]=$16;
 label=13;break;
 case 5: 
 var $19=(($5+28)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=($20|0)!=-1;
 if($21){label=6;break;}else{label=8;break;}
 case 6: 
 var $23=__ZNK6Packet9isIntegerEv($in);
 if($23){label=7;break;}else{label=8;break;}
 case 7: 
 var $25=__ZNK6Packet9asIntegerEv($in);
 __ZN16LedChainNeoPixel18updateCurrentPixelEj($5,$25);
 var $26=(($5+28)|0);
 HEAP32[(($26)>>2)]=-1;
 label=12;break;
 case 8: 
 var $28=__ZNK6Packet12isEndBracketEv($in);
 if($28){label=10;break;}else{label=9;break;}
 case 9: 
 var $30=__ZNK6Packet14isStartBracketEv($in);
 if($30){label=10;break;}else{label=11;break;}
 case 10: 
 var $32=(($5+28)|0);
 HEAP32[(($32)>>2)]=-1;
 label=11;break;
 case 11: 
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 label=25;break;
 case 14: 
 var $37=$2;
 var $38=(($37<<24)>>24);
 var $39=($38|0)==1;
 if($39){label=15;break;}else{label=16;break;}
 case 15: 
 var $41=__ZNK6Packet9asIntegerEv($in);
 var $42=(($41)&255);
 var $43=(($5+23)|0);
 HEAP8[(($43)>>0)]=$42;
 var $44=(($5+25)|0);
 HEAP8[(($44)>>0)]=0;
 var $45=$5;
 var $46=(($5+25)|0);
 var $47=HEAP8[(($46)>>0)];
 var $48=(($47)&1);
 __ZN6PacketC1Eb($3,$48);
 __ZN9Component4sendE6Packeta($45,$3,0);
 __ZN16LedChainNeoPixel13tryInitializeEv($5);
 label=24;break;
 case 16: 
 var $50=$2;
 var $51=(($50<<24)>>24);
 var $52=($51|0)==2;
 if($52){label=17;break;}else{label=18;break;}
 case 17: 
 var $54=__ZNK6Packet9asIntegerEv($in);
 var $55=(($54)&255);
 var $56=(($5+24)|0);
 HEAP8[(($56)>>0)]=$55;
 var $57=(($5+25)|0);
 HEAP8[(($57)>>0)]=0;
 var $58=$5;
 var $59=(($5+25)|0);
 var $60=HEAP8[(($59)>>0)];
 var $61=(($60)&1);
 __ZN6PacketC1Eb($4,$61);
 __ZN9Component4sendE6Packeta($58,$4,0);
 __ZN16LedChainNeoPixel13tryInitializeEv($5);
 label=23;break;
 case 18: 
 var $63=$2;
 var $64=(($63<<24)>>24);
 var $65=($64|0)==3;
 if($65){label=19;break;}else{label=22;break;}
 case 19: 
 var $67=(($5+25)|0);
 var $68=HEAP8[(($67)>>0)];
 var $69=(($68)&1);
 if($69){label=20;break;}else{label=21;break;}
 case 20: 
 label=21;break;
 case 21: 
 label=22;break;
 case 22: 
 label=23;break;
 case 23: 
 label=24;break;
 case 24: 
 label=25;break;
 case 25: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN16LedChainNeoPixel18updateCurrentPixelEj($this,$rgb){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+32)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $p;
 var $3=sp;
 var $4=(sp)+(8);
 var $5=(sp)+(16);
 var $6=(sp)+(24);
 $1=$this;
 $2=$rgb;
 var $7=$1;
 var $8=(($7+25)|0);
 var $9=HEAP8[(($8)>>0)];
 var $10=(($9)&1);
 if($10){label=2;break;}else{label=4;break;}
 case 2: 
 var $12=(($7+28)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=($13|0)<0;
 if($14){label=4;break;}else{label=3;break;}
 case 3: 
 var $16=(($7+28)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=(($7+24)|0);
 var $19=HEAP8[(($18)>>0)];
 var $20=(($19<<24)>>24);
 var $21=($17|0)>=($20|0);
 if($21){label=4;break;}else{label=5;break;}
 case 4: 
 label=6;break;
 case 5: 
 $p=1;
 var $24=$7;
 __ZN6PacketC1E3Msg($3,9);
 __ZN9Component4sendE6Packeta($24,$3,1);
 var $25=$7;
 var $26=(($7+28)|0);
 var $27=HEAP32[(($26)>>2)];
 __ZN6PacketC1El($4,$27);
 __ZN9Component4sendE6Packeta($25,$4,0);
 var $28=$7;
 var $29=$2;
 __ZN6PacketC1El($5,$29);
 __ZN9Component4sendE6Packeta($28,$5,0);
 var $30=$7;
 __ZN6PacketC1E3Msg($6,10);
 __ZN9Component4sendE6Packeta($30,$6,1);
 label=6;break;
 case 6: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN16LedChainNeoPixel13tryInitializeEv($this){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2=sp;
 $1=$this;
 var $3=$1;
 var $4=(($3+25)|0);
 var $5=HEAP8[(($4)>>0)];
 var $6=(($5)&1);
 if($6){label=4;break;}else{label=2;break;}
 case 2: 
 var $8=(($3+24)|0);
 var $9=HEAP8[(($8)>>0)];
 var $10=(($9<<24)>>24);
 var $11=($10|0)<0;
 if($11){label=4;break;}else{label=3;break;}
 case 3: 
 var $13=(($3+23)|0);
 var $14=HEAP8[(($13)>>0)];
 var $15=(($14<<24)>>24);
 var $16=($15|0)<0;
 if($16){label=4;break;}else{label=5;break;}
 case 4: 
 label=6;break;
 case 5: 
 var $19=(($3+25)|0);
 HEAP8[(($19)>>0)]=1;
 var $20=$3;
 var $21=(($3+25)|0);
 var $22=HEAP8[(($21)>>0)];
 var $23=(($22)&1);
 __ZN6PacketC1Eb($2,$23);
 __ZN9Component4sendE6Packeta($20,$2,0);
 label=6;break;
 case 6: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN16LedChainNeoPixelD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN12LedMatrixMaxC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1400;
 var $5=(($2+32)|0);
 HEAP32[(($5)>>2)]=-1;
 var $6=(($2+36)|0);
 HEAP32[(($6)>>2)]=-1;
 var $7=(($2+40)|0);
 HEAP32[(($7)>>2)]=-1;
 var $8=(($2+44)|0);
 HEAP8[(($8)>>0)]=0;
 STACKTOP=sp;return;
}


function __ZN12LedMatrixMaxD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN12LedMatrixMaxD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN12LedMatrixMaxD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN12LedMatrixMaxD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12LedMatrixMax7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $c;
 $1=$this;
 $2=$port;
 var $3=$1;
 var $4=$2;
 var $5=(($4<<24)>>24);
 var $6=($5|0)==0;
 if($6){label=2;break;}else{label=12;break;}
 case 2: 
 var $8=__ZNK6Packet9isIntegerEv($in);
 if($8){label=3;break;}else{label=5;break;}
 case 3: 
 var $10=__ZNK6Packet9asIntegerEv($in);
 var $11=($10|0)<38;
 if($11){label=4;break;}else{label=5;break;}
 case 4: 
 var $13=__ZNK6Packet9asIntegerEv($in);
 var $14=(($13)&255);
 var $15=(($3+45)|0);
 HEAP8[(($15)>>0)]=$14;
 label=11;break;
 case 5: 
 var $17=__ZNK6Packet6isByteEv($in);
 if($17){label=6;break;}else{label=10;break;}
 case 6: 
 var $19=__ZNK6Packet6asByteEv($in);
 $c=$19;
 var $20=$c;
 var $21=($20&255);
 var $22=($21|0)>65;
 if($22){label=7;break;}else{label=9;break;}
 case 7: 
 var $24=$c;
 var $25=($24&255);
 var $26=($25|0)<=90;
 if($26){label=8;break;}else{label=9;break;}
 case 8: 
 var $28=$c;
 var $29=($28&255);
 var $30=((($29)+(10))|0);
 var $31=((($30)-(65))|0);
 var $32=(($31)&255);
 var $33=(($3+45)|0);
 HEAP8[(($33)>>0)]=$32;
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 label=11;break;
 case 11: 
 __ZN12LedMatrixMax6updateEv($3);
 label=21;break;
 case 12: 
 var $38=$2;
 var $39=(($38<<24)>>24);
 var $40=($39|0)==3;
 if($40){label=13;break;}else{label=14;break;}
 case 13: 
 var $42=__ZNK6Packet9asIntegerEv($in);
 var $43=(($3+40)|0);
 HEAP32[(($43)>>2)]=$42;
 var $44=(($3+44)|0);
 HEAP8[(($44)>>0)]=0;
 __ZN12LedMatrixMax6updateEv($3);
 label=20;break;
 case 14: 
 var $46=$2;
 var $47=(($46<<24)>>24);
 var $48=($47|0)==1;
 if($48){label=15;break;}else{label=16;break;}
 case 15: 
 var $50=__ZNK6Packet9asIntegerEv($in);
 var $51=(($3+32)|0);
 HEAP32[(($51)>>2)]=$50;
 var $52=(($3+44)|0);
 HEAP8[(($52)>>0)]=0;
 __ZN12LedMatrixMax6updateEv($3);
 label=19;break;
 case 16: 
 var $54=$2;
 var $55=(($54<<24)>>24);
 var $56=($55|0)==2;
 if($56){label=17;break;}else{label=18;break;}
 case 17: 
 var $58=__ZNK6Packet9asIntegerEv($in);
 var $59=(($3+36)|0);
 HEAP32[(($59)>>2)]=$58;
 var $60=(($3+44)|0);
 HEAP8[(($60)>>0)]=0;
 __ZN12LedMatrixMax6updateEv($3);
 label=18;break;
 case 18: 
 label=19;break;
 case 19: 
 label=20;break;
 case 20: 
 label=21;break;
 case 21: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet6isByteEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)==4;
 STACKTOP=sp;return $5;
}


function __ZN12LedMatrixMax6updateEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $i;
 $1=$this;
 var $2=$1;
 var $3=(($2+32)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)<0;
 if($5){label=4;break;}else{label=2;break;}
 case 2: 
 var $7=(($2+36)|0);
 var $8=HEAP32[(($7)>>2)];
 var $9=($8|0)<0;
 if($9){label=4;break;}else{label=3;break;}
 case 3: 
 var $11=(($2+40)|0);
 var $12=HEAP32[(($11)>>2)];
 var $13=($12|0)<0;
 if($13){label=4;break;}else{label=5;break;}
 case 4: 
 label=11;break;
 case 5: 
 var $16=(($2+44)|0);
 var $17=HEAP8[(($16)>>0)];
 var $18=(($17)&1);
 if($18){label=7;break;}else{label=6;break;}
 case 6: 
 var $20=$2;
 var $21=(($20+4)|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=$22;
 var $24=HEAP32[(($23)>>2)];
 var $25=(($24+28)|0);
 var $26=HEAP32[(($25)>>2)];
 var $27=(($2+32)|0);
 var $28=HEAP32[(($27)>>2)];
 var $29=(($28)&255);
 FUNCTION_TABLE[$26]($22,$29,1);
 var $30=$2;
 var $31=(($30+4)|0);
 var $32=HEAP32[(($31)>>2)];
 var $33=$32;
 var $34=HEAP32[(($33)>>2)];
 var $35=(($34+28)|0);
 var $36=HEAP32[(($35)>>2)];
 var $37=(($2+36)|0);
 var $38=HEAP32[(($37)>>2)];
 var $39=(($38)&255);
 FUNCTION_TABLE[$36]($32,$39,1);
 var $40=$2;
 var $41=(($40+4)|0);
 var $42=HEAP32[(($41)>>2)];
 var $43=$42;
 var $44=HEAP32[(($43)>>2)];
 var $45=(($44+28)|0);
 var $46=HEAP32[(($45)>>2)];
 var $47=(($2+40)|0);
 var $48=HEAP32[(($47)>>2)];
 var $49=(($48)&255);
 FUNCTION_TABLE[$46]($42,$49,1);
 __ZN12LedMatrixMax12max7219_initEv($2);
 var $50=(($2+44)|0);
 HEAP8[(($50)>>0)]=1;
 label=7;break;
 case 7: 
 $i=1;
 label=8;break;
 case 8: 
 var $53=$i;
 var $54=($53&255);
 var $55=($54|0)<9;
 if($55){label=9;break;}else{label=11;break;}
 case 9: 
 var $57=$i;
 var $58=$i;
 var $59=($58&255);
 var $60=((($59)-(1))|0);
 var $61=(($2+45)|0);
 var $62=HEAP8[(($61)>>0)];
 var $63=($62&255);
 var $64=((3768+($63<<3))|0);
 var $65=(($64+$60)|0);
 var $66=HEAP8[(($65)>>0)];
 __ZN12LedMatrixMax13max7219_writeEhh($2,$57,$66);
 label=10;break;
 case 10: 
 var $68=$i;
 var $69=((($68)+(1))&255);
 $i=$69;
 label=8;break;
 case 11: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12LedMatrixMax12max7219_initEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN12LedMatrixMax13max7219_writeEhh($2,9,0);
 __ZN12LedMatrixMax13max7219_writeEhh($2,10,3);
 __ZN12LedMatrixMax13max7219_writeEhh($2,11,7);
 __ZN12LedMatrixMax13max7219_writeEhh($2,12,1);
 __ZN12LedMatrixMax13max7219_writeEhh($2,15,0);
 STACKTOP=sp;return;
}


function __ZN12LedMatrixMax13max7219_writeEhh($this,$address,$dat){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$address;
 $3=$dat;
 var $4=$1;
 var $5=$4;
 var $6=(($5+4)|0);
 var $7=HEAP32[(($6)>>2)];
 var $8=$7;
 var $9=HEAP32[(($8)>>2)];
 var $10=(($9+36)|0);
 var $11=HEAP32[(($10)>>2)];
 var $12=(($4+32)|0);
 var $13=HEAP32[(($12)>>2)];
 var $14=(($13)&255);
 FUNCTION_TABLE[$11]($7,$14,0);
 var $15=$2;
 __ZN12LedMatrixMax18max7219_write_byteEh($4,$15);
 var $16=$3;
 __ZN12LedMatrixMax18max7219_write_byteEh($4,$16);
 var $17=$4;
 var $18=(($17+4)|0);
 var $19=HEAP32[(($18)>>2)];
 var $20=$19;
 var $21=HEAP32[(($20)>>2)];
 var $22=(($21+36)|0);
 var $23=HEAP32[(($22)>>2)];
 var $24=(($4+32)|0);
 var $25=HEAP32[(($24)>>2)];
 var $26=(($25)&255);
 FUNCTION_TABLE[$23]($19,$26,1);
 STACKTOP=sp;return;
}


function __ZN12LedMatrixMax18max7219_write_byteEh($this,$DATA){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $i;
 $1=$this;
 $2=$DATA;
 var $3=$1;
 $i=8;
 label=2;break;
 case 2: 
 var $5=$i;
 var $6=($5&255);
 var $7=($6|0)>=1;
 if($7){label=3;break;}else{label=5;break;}
 case 3: 
 var $9=$3;
 var $10=(($9+4)|0);
 var $11=HEAP32[(($10)>>2)];
 var $12=$11;
 var $13=HEAP32[(($12)>>2)];
 var $14=(($13+36)|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=(($3+40)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=(($17)&255);
 FUNCTION_TABLE[$15]($11,$18,0);
 var $19=$3;
 var $20=(($19+4)|0);
 var $21=HEAP32[(($20)>>2)];
 var $22=$21;
 var $23=HEAP32[(($22)>>2)];
 var $24=(($23+36)|0);
 var $25=HEAP32[(($24)>>2)];
 var $26=(($3+36)|0);
 var $27=HEAP32[(($26)>>2)];
 var $28=(($27)&255);
 var $29=$2;
 var $30=($29&255);
 var $31=$30&128;
 var $32=($31|0)!=0;
 FUNCTION_TABLE[$25]($21,$28,$32);
 var $33=$3;
 var $34=(($33+4)|0);
 var $35=HEAP32[(($34)>>2)];
 var $36=$35;
 var $37=HEAP32[(($36)>>2)];
 var $38=(($37+36)|0);
 var $39=HEAP32[(($38)>>2)];
 var $40=(($3+40)|0);
 var $41=HEAP32[(($40)>>2)];
 var $42=(($41)&255);
 FUNCTION_TABLE[$39]($35,$42,1);
 var $43=$2;
 var $44=($43&255);
 var $45=$44<<1;
 var $46=(($45)&255);
 $2=$46;
 label=4;break;
 case 4: 
 var $48=$i;
 var $49=((($48)-(1))&255);
 $i=$49;
 label=2;break;
 case 5: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12LedMatrixMaxD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN9ConstrainC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=184;
 STACKTOP=sp;return;
}


function __ZN9ConstrainD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9ConstrainD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9ConstrainD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN9ConstrainD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9Constrain7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet7isSetupEv($in);
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 var $7=(($4+32)|0);
 HEAP32[(($7)>>2)]=0;
 var $8=(($4+36)|0);
 HEAP32[(($8)>>2)]=0;
 var $9=(($4+40)|0);
 HEAP32[(($9)>>2)]=0;
 label=15;break;
 case 3: 
 var $11=$2;
 var $12=(($11<<24)>>24);
 var $13=($12|0)==1;
 if($13){label=4;break;}else{label=6;break;}
 case 4: 
 var $15=__ZNK6Packet6isDataEv($in);
 if($15){label=5;break;}else{label=6;break;}
 case 5: 
 var $17=__ZNK6Packet9asIntegerEv($in);
 var $18=(($4+32)|0);
 HEAP32[(($18)>>2)]=$17;
 label=14;break;
 case 6: 
 var $20=$2;
 var $21=(($20<<24)>>24);
 var $22=($21|0)==2;
 if($22){label=7;break;}else{label=9;break;}
 case 7: 
 var $24=__ZNK6Packet6isDataEv($in);
 if($24){label=8;break;}else{label=9;break;}
 case 8: 
 var $26=__ZNK6Packet9asIntegerEv($in);
 var $27=(($4+36)|0);
 HEAP32[(($27)>>2)]=$26;
 label=13;break;
 case 9: 
 var $29=$2;
 var $30=(($29<<24)>>24);
 var $31=($30|0)==0;
 if($31){label=10;break;}else{label=12;break;}
 case 10: 
 var $33=__ZNK6Packet8isNumberEv($in);
 if($33){label=11;break;}else{label=12;break;}
 case 11: 
 var $35=__ZNK6Packet9asIntegerEv($in);
 var $36=(($4+40)|0);
 HEAP32[(($36)>>2)]=$35;
 var $37=$4;
 var $38=__ZN9Constrain10_constrainEv($4);
 __ZN6PacketC1El($3,$38);
 __ZN9Component4sendE6Packeta($37,$3,0);
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 label=14;break;
 case 14: 
 label=15;break;
 case 15: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9Constrain10_constrainEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $2=$this;
 var $3=$2;
 var $4=(($3+40)|0);
 var $5=HEAP32[(($4)>>2)];
 var $6=(($3+36)|0);
 var $7=HEAP32[(($6)>>2)];
 var $8=($5|0)>($7|0);
 if($8){label=2;break;}else{label=3;break;}
 case 2: 
 var $10=(($3+36)|0);
 var $11=HEAP32[(($10)>>2)];
 $1=$11;
 label=6;break;
 case 3: 
 var $13=(($3+40)|0);
 var $14=HEAP32[(($13)>>2)];
 var $15=(($3+32)|0);
 var $16=HEAP32[(($15)>>2)];
 var $17=($14|0)<($16|0);
 if($17){label=4;break;}else{label=5;break;}
 case 4: 
 var $19=(($3+32)|0);
 var $20=HEAP32[(($19)>>2)];
 $1=$20;
 label=6;break;
 case 5: 
 var $22=(($3+40)|0);
 var $23=HEAP32[(($22)>>2)];
 $1=$23;
 label=6;break;
 case 6: 
 var $25=$1;
 STACKTOP=sp;return $25;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9ConstrainD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN17ReadCapacitivePinC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1056;
 STACKTOP=sp;return;
}


function __ZN17ReadCapacitivePinD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN17ReadCapacitivePinD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN17ReadCapacitivePinD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN17ReadCapacitivePinD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN17ReadCapacitivePinD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN4GateC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 var $5=$4;
 __ZN21SingleOutputComponentC2Ev($5);
 var $6=$4;
 HEAP32[(($6)>>2)]=632;
 var $7=(($4+32)|0);
 HEAP8[(($7)>>0)]=0;
 var $8=(($4+36)|0);
 (function() { try { __THREW__ = 0; return __ZN6PacketC1E3Msg($8,0) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 STACKTOP=sp;return;
 case 3: 
 var $11$0 = ___cxa_find_matching_catch(-1, -1); var $11$1 = tempRet0;
 var $12=$11$0;
 $2=$12;
 var $13=$11$1;
 $3=$13;
 var $14=$4;
 (function() { try { __THREW__ = 0; return __ZN21SingleOutputComponentD2Ev($14) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=4;break; } else { label=6;break; }
 case 4: 
 label=5;break;
 case 5: 
 var $17=$2;
 var $18=$3;
 var $19$0=$17;
 var $19$1=0;
 var $20$0=$19$0;
 var $20$1=$18;
 ___resumeException($20$0)
 case 6: 
 var $22$0 = ___cxa_find_matching_catch(-1, -1,0); var $22$1 = tempRet0;
 var $23=$22$0;
 ___clang_call_terminate($23);
 throw "Reached an unreachable!";
  default: assert(0, "bad label: " + label);
 }

}


function __ZN4GateD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN4GateD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN4GateD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN4GateD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN4Gate7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$port;
 var $3=$1;
 var $4=$2;
 var $5=(($4<<24)>>24);
 var $6=($5|0)==0;
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 var $8=(($3+36)|0);
 var $9=$8;
 var $10=$in;
 assert(8 % 1 === 0);HEAP32[(($9)>>2)]=HEAP32[(($10)>>2)];HEAP32[((($9)+(4))>>2)]=HEAP32[((($10)+(4))>>2)];
 __ZN4Gate13sendIfEnabledEv($3);
 label=6;break;
 case 3: 
 var $12=$2;
 var $13=(($12<<24)>>24);
 var $14=($13|0)==1;
 if($14){label=4;break;}else{label=5;break;}
 case 4: 
 var $16=__ZNK6Packet6asBoolEv($in);
 var $17=(($3+32)|0);
 var $18=($16&1);
 HEAP8[(($17)>>0)]=$18;
 __ZN4Gate13sendIfEnabledEv($3);
 label=5;break;
 case 5: 
 label=6;break;
 case 6: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN4Gate13sendIfEnabledEv($this){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2=sp;
 $1=$this;
 var $3=$1;
 var $4=(($3+32)|0);
 var $5=HEAP8[(($4)>>0)];
 var $6=(($5)&1);
 if($6){label=2;break;}else{label=4;break;}
 case 2: 
 var $8=(($3+36)|0);
 var $9=__ZNK6Packet7isValidEv($8);
 if($9){label=3;break;}else{label=4;break;}
 case 3: 
 var $11=$3;
 var $12=(($3+36)|0);
 var $13=$2;
 var $14=$12;
 assert(8 % 1 === 0);HEAP32[(($13)>>2)]=HEAP32[(($14)>>2)];HEAP32[((($13)+(4))>>2)]=HEAP32[((($14)+(4))>>2)];
 __ZN9Component4sendE6Packeta($11,$2,0);
 label=4;break;
 case 4: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN4GateD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN5SplitC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=536;
 var $4=$2;
 var $5=(($2+24)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,9);
 var $7=$2;
 HEAP32[(($7)>>2)]=536;
 var $8=(($2+24)|0);
 STACKTOP=sp;return;
}


function __ZN5SplitD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5SplitD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5SplitD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN5SplitD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5Split7processE6Packeta($this,$in,$inport){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $first;
 var $last;
 var $port;
 var $3=sp;
 $1=$this;
 $2=$inport;
 var $4=$1;
 var $5=__ZNK6Packet6isDataEv($in);
 if($5){label=2;break;}else{label=7;break;}
 case 2: 
 $first=0;
 $last=8;
 $port=0;
 label=3;break;
 case 3: 
 var $8=$port;
 var $9=(($8<<24)>>24);
 var $10=($9|0)<=8;
 if($10){label=4;break;}else{label=6;break;}
 case 4: 
 var $12=$4;
 var $13=$3;
 var $14=$in;
 assert(8 % 1 === 0);HEAP32[(($13)>>2)]=HEAP32[(($14)>>2)];HEAP32[((($13)+(4))>>2)]=HEAP32[((($14)+(4))>>2)];
 var $15=$port;
 __ZN9Component4sendE6Packeta($12,$3,$15);
 label=5;break;
 case 5: 
 var $17=$port;
 var $18=((($17)+(1))&255);
 $port=$18;
 label=3;break;
 case 6: 
 label=7;break;
 case 7: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5SplitD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN10MonitorPinC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1632;
 STACKTOP=sp;return;
}


function __ZN10MonitorPinD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN10MonitorPinD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN10MonitorPinD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN10MonitorPinD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10MonitorPin7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $intr;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=$2;
 var $6=(($5<<24)>>24);
 var $7=($6|0)==0;
 if($7){label=2;break;}else{label=8;break;}
 case 2: 
 var $9=__ZNK6Packet9asIntegerEv($in);
 var $10=(($9)&255);
 var $11=(($4+32)|0);
 HEAP8[(($11)>>0)]=$10;
 $intr=0;
 var $12=(($4+32)|0);
 var $13=HEAP8[(($12)>>0)];
 var $14=(($13<<24)>>24);
 var $15=($14|0)==2;
 if($15){label=3;break;}else{label=4;break;}
 case 3: 
 $intr=0;
 label=7;break;
 case 4: 
 var $18=(($4+32)|0);
 var $19=HEAP8[(($18)>>0)];
 var $20=(($19<<24)>>24);
 var $21=($20|0)==3;
 if($21){label=5;break;}else{label=6;break;}
 case 5: 
 $intr=1;
 label=6;break;
 case 6: 
 label=7;break;
 case 7: 
 var $25=$4;
 var $26=(($25+4)|0);
 var $27=HEAP32[(($26)>>2)];
 var $28=$27;
 var $29=HEAP32[(($28)>>2)];
 var $30=(($29+32)|0);
 var $31=HEAP32[(($30)>>2)];
 var $32=(($4+32)|0);
 var $33=HEAP8[(($32)>>0)];
 FUNCTION_TABLE[$31]($27,$33,1);
 var $34=$4;
 var $35=(($34+4)|0);
 var $36=HEAP32[(($35)>>2)];
 var $37=$36;
 var $38=HEAP32[(($37)>>2)];
 var $39=(($38+60)|0);
 var $40=HEAP32[(($39)>>2)];
 var $41=$intr;
 var $42=$4;
 FUNCTION_TABLE[$40]($36,$41,2,8,$42);
 var $43=$4;
 var $44=$4;
 var $45=(($44+4)|0);
 var $46=HEAP32[(($45)>>2)];
 var $47=$46;
 var $48=HEAP32[(($47)>>2)];
 var $49=(($48+40)|0);
 var $50=HEAP32[(($49)>>2)];
 var $51=(($4+32)|0);
 var $52=HEAP8[(($51)>>0)];
 var $53=FUNCTION_TABLE[$50]($46,$52);
 __ZN6PacketC1Eb($3,$53);
 __ZN9Component4sendE6Packeta($43,$3,0);
 label=8;break;
 case 8: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10MonitorPin9interruptEPv($user){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $thisptr;
 var $2=sp;
 $1=$user;
 var $3=$1;
 var $4=$3;
 $thisptr=$4;
 var $5=$thisptr;
 var $6=$5;
 var $7=$thisptr;
 var $8=$7;
 var $9=(($8+4)|0);
 var $10=HEAP32[(($9)>>2)];
 var $11=$10;
 var $12=HEAP32[(($11)>>2)];
 var $13=(($12+40)|0);
 var $14=HEAP32[(($13)>>2)];
 var $15=$thisptr;
 var $16=(($15+32)|0);
 var $17=HEAP8[(($16)>>0)];
 var $18=FUNCTION_TABLE[$14]($10,$17);
 __ZN6PacketC1Eb($2,$18);
 __ZN9Component4sendE6Packeta($6,$2,0);
 STACKTOP=sp;return;
}


function __ZN10MonitorPinD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN9MapLinearC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=120;
 STACKTOP=sp;return;
}


function __ZN9MapLinearD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9MapLinearD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9MapLinearD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN9MapLinearD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9MapLinear7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet7isSetupEv($in);
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 label=23;break;
 case 3: 
 var $8=$2;
 var $9=(($8<<24)>>24);
 var $10=($9|0)==1;
 if($10){label=4;break;}else{label=6;break;}
 case 4: 
 var $12=__ZNK6Packet6isDataEv($in);
 if($12){label=5;break;}else{label=6;break;}
 case 5: 
 var $14=__ZNK6Packet9asIntegerEv($in);
 var $15=(($4+32)|0);
 HEAP32[(($15)>>2)]=$14;
 label=22;break;
 case 6: 
 var $17=$2;
 var $18=(($17<<24)>>24);
 var $19=($18|0)==2;
 if($19){label=7;break;}else{label=9;break;}
 case 7: 
 var $21=__ZNK6Packet6isDataEv($in);
 if($21){label=8;break;}else{label=9;break;}
 case 8: 
 var $23=__ZNK6Packet9asIntegerEv($in);
 var $24=(($4+36)|0);
 HEAP32[(($24)>>2)]=$23;
 label=21;break;
 case 9: 
 var $26=$2;
 var $27=(($26<<24)>>24);
 var $28=($27|0)==3;
 if($28){label=10;break;}else{label=12;break;}
 case 10: 
 var $30=__ZNK6Packet6isDataEv($in);
 if($30){label=11;break;}else{label=12;break;}
 case 11: 
 var $32=__ZNK6Packet9asIntegerEv($in);
 var $33=(($4+44)|0);
 HEAP32[(($33)>>2)]=$32;
 label=20;break;
 case 12: 
 var $35=$2;
 var $36=(($35<<24)>>24);
 var $37=($36|0)==4;
 if($37){label=13;break;}else{label=15;break;}
 case 13: 
 var $39=__ZNK6Packet6isDataEv($in);
 if($39){label=14;break;}else{label=15;break;}
 case 14: 
 var $41=__ZNK6Packet9asIntegerEv($in);
 var $42=(($4+40)|0);
 HEAP32[(($42)>>2)]=$41;
 label=19;break;
 case 15: 
 var $44=$2;
 var $45=(($44<<24)>>24);
 var $46=($45|0)==0;
 if($46){label=16;break;}else{label=18;break;}
 case 16: 
 var $48=__ZNK6Packet8isNumberEv($in);
 if($48){label=17;break;}else{label=18;break;}
 case 17: 
 var $50=$4;
 var $51=__ZNK6Packet9asIntegerEv($in);
 var $52=__ZN9MapLinear3mapEl($4,$51);
 __ZN6PacketC1El($3,$52);
 __ZN9Component4sendE6Packeta($50,$3,0);
 label=18;break;
 case 18: 
 label=19;break;
 case 19: 
 label=20;break;
 case 20: 
 label=21;break;
 case 21: 
 label=22;break;
 case 22: 
 label=23;break;
 case 23: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9MapLinear3mapEl($this,$in){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$in;
 var $3=$1;
 var $4=$2;
 var $5=(($3+32)|0);
 var $6=HEAP32[(($5)>>2)];
 var $7=((($4)-($6))|0);
 var $8=(($3+40)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=(($3+44)|0);
 var $11=HEAP32[(($10)>>2)];
 var $12=((($9)-($11))|0);
 var $13=(Math_imul($7,$12)|0);
 var $14=(($3+36)|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=(($3+32)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=((($15)-($17))|0);
 var $19=(((($13|0))/(($18|0)))&-1);
 var $20=(($3+44)|0);
 var $21=HEAP32[(($20)>>2)];
 var $22=((($19)+($21))|0);
 STACKTOP=sp;return $22;
}


function __ZN9MapLinearD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN15BreakBeforeMakeC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=1208;
 var $4=$2;
 var $5=(($2+28)|0);
 var $6=(($5)|0);
 __ZN9ComponentC2EP10Connectioni($4,$6,2);
 var $7=$2;
 HEAP32[(($7)>>2)]=1208;
 var $8=(($2+24)|0);
 HEAP32[(($8)>>2)]=0;
 var $9=(($2+28)|0);
 STACKTOP=sp;return;
}


function __ZN15BreakBeforeMakeD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN15BreakBeforeMakeD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN15BreakBeforeMakeD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN15BreakBeforeMakeD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN15BreakBeforeMake7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+32)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 var $4=(sp)+(8);
 var $5=(sp)+(16);
 var $6=(sp)+(24);
 $1=$this;
 $2=$port;
 var $7=$1;
 var $8=(($7+24)|0);
 var $9=HEAP32[(($8)>>2)];
 switch(($9|0)){case 6:{ label=11;break;}case 2:{ label=15;break;}case 3:{ label=19;break;}case 0:{ label=2;break;}case 5:{ label=23;break;}case 4:{ label=3;break;}case 1:{ label=7;break;}default:{label=27;break;}}break;
 case 2: 
 var $11=(($7+24)|0);
 HEAP32[(($11)>>2)]=6;
 label=28;break;
 case 3: 
 var $13=$2;
 var $14=(($13<<24)>>24);
 var $15=($14|0)==2;
 if($15){label=4;break;}else{label=6;break;}
 case 4: 
 var $17=__ZNK6Packet6asBoolEv($in);
 if($17){label=6;break;}else{label=5;break;}
 case 5: 
 var $19=$7;
 __ZN6PacketC1Eb($3,1);
 __ZN9Component4sendE6Packeta($19,$3,0);
 var $20=(($7+24)|0);
 HEAP32[(($20)>>2)]=1;
 label=6;break;
 case 6: 
 label=28;break;
 case 7: 
 var $23=$2;
 var $24=(($23<<24)>>24);
 var $25=($24|0)==1;
 if($25){label=8;break;}else{label=10;break;}
 case 8: 
 var $27=__ZNK6Packet6asBoolEv($in);
 if($27){label=9;break;}else{label=10;break;}
 case 9: 
 var $29=(($7+24)|0);
 HEAP32[(($29)>>2)]=6;
 label=10;break;
 case 10: 
 label=28;break;
 case 11: 
 var $32=$2;
 var $33=(($32<<24)>>24);
 var $34=($33|0)==0;
 if($34){label=12;break;}else{label=14;break;}
 case 12: 
 var $36=__ZNK6Packet6asBoolEv($in);
 if($36){label=13;break;}else{label=14;break;}
 case 13: 
 var $38=$7;
 __ZN6PacketC1Eb($4,0);
 __ZN9Component4sendE6Packeta($38,$4,0);
 var $39=(($7+24)|0);
 HEAP32[(($39)>>2)]=2;
 label=14;break;
 case 14: 
 label=28;break;
 case 15: 
 var $42=$2;
 var $43=(($42<<24)>>24);
 var $44=($43|0)==1;
 if($44){label=16;break;}else{label=18;break;}
 case 16: 
 var $46=__ZNK6Packet6asBoolEv($in);
 if($46){label=18;break;}else{label=17;break;}
 case 17: 
 var $48=$7;
 __ZN6PacketC1Eb($5,1);
 __ZN9Component4sendE6Packeta($48,$5,1);
 var $49=(($7+24)|0);
 HEAP32[(($49)>>2)]=3;
 label=18;break;
 case 18: 
 label=28;break;
 case 19: 
 var $52=$2;
 var $53=(($52<<24)>>24);
 var $54=($53|0)==2;
 if($54){label=20;break;}else{label=22;break;}
 case 20: 
 var $56=__ZNK6Packet6asBoolEv($in);
 if($56){label=21;break;}else{label=22;break;}
 case 21: 
 var $58=(($7+24)|0);
 HEAP32[(($58)>>2)]=5;
 label=22;break;
 case 22: 
 label=28;break;
 case 23: 
 var $61=$2;
 var $62=(($61<<24)>>24);
 var $63=($62|0)==0;
 if($63){label=24;break;}else{label=26;break;}
 case 24: 
 var $65=__ZNK6Packet6asBoolEv($in);
 if($65){label=26;break;}else{label=25;break;}
 case 25: 
 var $67=$7;
 __ZN6PacketC1Eb($6,0);
 __ZN9Component4sendE6Packeta($67,$6,1);
 var $68=(($7+24)|0);
 HEAP32[(($68)>>2)]=4;
 label=26;break;
 case 26: 
 label=27;break;
 case 27: 
 label=28;break;
 case 28: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN15BreakBeforeMakeD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN9ComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN5RouteC2Ev($this){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 var $i;
 var $4=sp;
 $1=$this;
 var $5=$1;
 var $6=$5;
 __ZN21SingleOutputComponentC2Ev($6);
 var $7=$5;
 HEAP32[(($7)>>2)]=568;
 var $8=(($5+32)|0);
 var $9=(($8)|0);
 var $10=(($9+72)|0);
 var $12=$9;label=2;break;
 case 2: 
 var $12;
 (function() { try { __THREW__ = 0; return __ZN6PacketC1Ev($12) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=3;break; } else { label=9;break; }
 case 3: 
 var $14=(($12+8)|0);
 var $15=($14|0)==($10|0);
 if($15){label=4;break;}else{var $12=$14;label=2;break;}
 case 4: 
 var $17=(($5+104)|0);
 HEAP8[(($17)>>0)]=0;
 $i=0;
 label=5;break;
 case 5: 
 var $19=$i;
 var $20=(($19<<24)>>24);
 var $21=($20|0)<9;
 if($21){label=6;break;}else{label=10;break;}
 case 6: 
 var $23=$i;
 var $24=(($23<<24)>>24);
 var $25=(($5+32)|0);
 var $26=(($25+($24<<3))|0);
 (function() { try { __THREW__ = 0; return __ZN6PacketC1E3Msg($4,0) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=7;break; } else { label=9;break; }
 case 7: 
 var $28=$26;
 var $29=$4;
 assert(8 % 1 === 0);HEAP32[(($28)>>2)]=HEAP32[(($29)>>2)];HEAP32[((($28)+(4))>>2)]=HEAP32[((($29)+(4))>>2)];
 label=8;break;
 case 8: 
 var $31=$i;
 var $32=((($31)+(1))&255);
 $i=$32;
 label=5;break;
 case 9: 
 var $34$0 = ___cxa_find_matching_catch(-1, -1); var $34$1 = tempRet0;
 var $35=$34$0;
 $2=$35;
 var $36=$34$1;
 $3=$36;
 var $37=$5;
 (function() { try { __THREW__ = 0; return __ZN21SingleOutputComponentD2Ev($37) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=11;break; } else { label=13;break; }
 case 10: 
 STACKTOP=sp;return;
 case 11: 
 label=12;break;
 case 12: 
 var $41=$2;
 var $42=$3;
 var $43$0=$41;
 var $43$1=0;
 var $44$0=$43$0;
 var $44$1=$42;
 ___resumeException($44$0)
 case 13: 
 var $46$0 = ___cxa_find_matching_catch(-1, -1,0); var $46$1 = tempRet0;
 var $47=$46$0;
 ___clang_call_terminate($47);
 throw "Reached an unreachable!";
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5RouteD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5RouteD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5RouteD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN5RouteD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5Route7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $p;
 var $3=sp;
 var $4=(sp)+(8);
 $1=$this;
 $2=$port;
 var $5=$1;
 var $6=$2;
 var $7=(($6<<24)>>24);
 var $8=($7|0)==0;
 if($8){label=2;break;}else{label=8;break;}
 case 2: 
 var $10=__ZNK6Packet9asIntegerEv($in);
 var $11=(($10)&255);
 var $12=(($5+104)|0);
 HEAP8[(($12)>>0)]=$11;
 var $13=(($5+104)|0);
 var $14=HEAP8[(($13)>>0)];
 var $15=(($14<<24)>>24);
 var $16=($15|0)>0;
 if($16){label=3;break;}else{label=7;break;}
 case 3: 
 var $18=(($5+104)|0);
 var $19=HEAP8[(($18)>>0)];
 var $20=(($19<<24)>>24);
 var $21=($20|0)<9;
 if($21){label=4;break;}else{label=7;break;}
 case 4: 
 var $23=(($5+104)|0);
 var $24=HEAP8[(($23)>>0)];
 var $25=(($24<<24)>>24);
 var $26=(($5+32)|0);
 var $27=(($26+($25<<3))|0);
 $p=$27;
 var $28=$p;
 var $29=__ZNK6Packet4typeEv($28);
 var $30=($29|0)!=0;
 if($30){label=5;break;}else{label=6;break;}
 case 5: 
 var $32=$5;
 var $33=$p;
 var $34=$3;
 var $35=$33;
 assert(8 % 1 === 0);HEAP32[(($34)>>2)]=HEAP32[(($35)>>2)];HEAP32[((($34)+(4))>>2)]=HEAP32[((($35)+(4))>>2)];
 __ZN9Component4sendE6Packeta($32,$3,0);
 label=6;break;
 case 6: 
 label=7;break;
 case 7: 
 label=13;break;
 case 8: 
 var $39=__ZNK6Packet6isDataEv($in);
 if($39){label=9;break;}else{label=12;break;}
 case 9: 
 var $41=$2;
 var $42=(($41<<24)>>24);
 var $43=(($5+32)|0);
 var $44=(($43+($42<<3))|0);
 var $45=$44;
 var $46=$in;
 assert(8 % 1 === 0);HEAP32[(($45)>>2)]=HEAP32[(($46)>>2)];HEAP32[((($45)+(4))>>2)]=HEAP32[((($46)+(4))>>2)];
 var $47=$2;
 var $48=(($47<<24)>>24);
 var $49=(($5+104)|0);
 var $50=HEAP8[(($49)>>0)];
 var $51=(($50<<24)>>24);
 var $52=($48|0)==($51|0);
 if($52){label=10;break;}else{label=11;break;}
 case 10: 
 var $54=$5;
 var $55=$4;
 var $56=$in;
 assert(8 % 1 === 0);HEAP32[(($55)>>2)]=HEAP32[(($56)>>2)];HEAP32[((($55)+(4))>>2)]=HEAP32[((($56)+(4))>>2)];
 __ZN9Component4sendE6Packeta($54,$4,0);
 label=11;break;
 case 11: 
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5RouteD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN21ReadDallasTemperatureC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1024;
 STACKTOP=sp;return;
}


function __ZN21ReadDallasTemperatureD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN21ReadDallasTemperatureD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN21ReadDallasTemperatureD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN21ReadDallasTemperatureD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN21ReadDallasTemperatureD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN14DummyComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN15HysteresisLatchC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1176;
 STACKTOP=sp;return;
}


function __ZN15HysteresisLatchD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN15HysteresisLatchD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN15HysteresisLatchD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN15HysteresisLatchD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN15HysteresisLatch7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 $1=$this;
 $2=$port;
 var $3=$1;
 var $4=__ZNK6Packet7isSetupEv($in);
 if($4){label=2;break;}else{label=3;break;}
 case 2: 
 var $6=(($3+32)|0);
 HEAPF32[(($6)>>2)]=30;
 var $7=(($3+36)|0);
 HEAPF32[(($7)>>2)]=24;
 var $8=(($3+40)|0);
 HEAP8[(($8)>>0)]=1;
 label=15;break;
 case 3: 
 var $10=$2;
 var $11=(($10<<24)>>24);
 var $12=($11|0)==1;
 if($12){label=4;break;}else{label=6;break;}
 case 4: 
 var $14=__ZNK6Packet8isNumberEv($in);
 if($14){label=5;break;}else{label=6;break;}
 case 5: 
 var $16=__ZNK6Packet7asFloatEv($in);
 var $17=(($3+36)|0);
 HEAPF32[(($17)>>2)]=$16;
 label=14;break;
 case 6: 
 var $19=$2;
 var $20=(($19<<24)>>24);
 var $21=($20|0)==2;
 if($21){label=7;break;}else{label=9;break;}
 case 7: 
 var $23=__ZNK6Packet8isNumberEv($in);
 if($23){label=8;break;}else{label=9;break;}
 case 8: 
 var $25=__ZNK6Packet7asFloatEv($in);
 var $26=(($3+32)|0);
 HEAPF32[(($26)>>2)]=$25;
 label=13;break;
 case 9: 
 var $28=$2;
 var $29=(($28<<24)>>24);
 var $30=($29|0)==0;
 if($30){label=10;break;}else{label=12;break;}
 case 10: 
 var $32=__ZNK6Packet8isNumberEv($in);
 if($32){label=11;break;}else{label=12;break;}
 case 11: 
 var $34=__ZNK6Packet7asFloatEv($in);
 __ZN15HysteresisLatch11updateValueEf($3,$34);
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 label=14;break;
 case 14: 
 label=15;break;
 case 15: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN15HysteresisLatch11updateValueEf($this,$input){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 $1=$this;
 $2=$input;
 var $4=$1;
 var $5=(($4+40)|0);
 var $6=HEAP8[(($5)>>0)];
 var $7=(($6)&1);
 if($7){label=2;break;}else{label=5;break;}
 case 2: 
 var $9=$2;
 var $10=(($4+36)|0);
 var $11=HEAPF32[(($10)>>2)];
 var $12=$9<=$11;
 if($12){label=3;break;}else{label=4;break;}
 case 3: 
 var $14=(($4+40)|0);
 HEAP8[(($14)>>0)]=0;
 label=4;break;
 case 4: 
 label=8;break;
 case 5: 
 var $17=$2;
 var $18=(($4+32)|0);
 var $19=HEAPF32[(($18)>>2)];
 var $20=$17>=$19;
 if($20){label=6;break;}else{label=7;break;}
 case 6: 
 var $22=(($4+40)|0);
 HEAP8[(($22)>>0)]=1;
 label=7;break;
 case 7: 
 label=8;break;
 case 8: 
 var $25=$4;
 var $26=(($4+40)|0);
 var $27=HEAP8[(($26)>>0)];
 var $28=(($27)&1);
 __ZN6PacketC1Eb($3,$28);
 __ZN9Component4sendE6Packeta($25,$3,0);
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN15HysteresisLatchD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN13ToggleBooleanC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1304;
 STACKTOP=sp;return;
}


function __ZN13ToggleBooleanD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN13ToggleBooleanD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN13ToggleBooleanD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN13ToggleBooleanD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN13ToggleBoolean7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 var $4=(sp)+(8);
 $1=$this;
 $2=$port;
 var $5=$1;
 var $6=__ZNK6Packet7isSetupEv($in);
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 var $8=(($5+32)|0);
 HEAP8[(($8)>>0)]=0;
 label=10;break;
 case 3: 
 var $10=$2;
 var $11=(($10<<24)>>24);
 var $12=($11|0)==0;
 if($12){label=4;break;}else{label=6;break;}
 case 4: 
 var $14=__ZNK6Packet6isDataEv($in);
 if($14){label=5;break;}else{label=6;break;}
 case 5: 
 var $16=(($5+32)|0);
 var $17=HEAP8[(($16)>>0)];
 var $18=(($17)&1);
 var $19=$18^1;
 var $20=(($5+32)|0);
 var $21=($19&1);
 HEAP8[(($20)>>0)]=$21;
 var $22=$5;
 var $23=(($5+32)|0);
 var $24=HEAP8[(($23)>>0)];
 var $25=(($24)&1);
 __ZN6PacketC1Eb($3,$25);
 __ZN9Component4sendE6Packeta($22,$3,0);
 label=9;break;
 case 6: 
 var $27=$2;
 var $28=(($27<<24)>>24);
 var $29=($28|0)==1;
 if($29){label=7;break;}else{label=8;break;}
 case 7: 
 var $31=(($5+32)|0);
 HEAP8[(($31)>>0)]=0;
 var $32=$5;
 var $33=(($5+32)|0);
 var $34=HEAP8[(($33)>>0)];
 var $35=(($34)&1);
 __ZN6PacketC1Eb($4,$35);
 __ZN9Component4sendE6Packeta($32,$4,0);
 label=8;break;
 case 8: 
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN13ToggleBooleanD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN13InvertBooleanC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1336;
 STACKTOP=sp;return;
}


function __ZN13InvertBooleanD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN13InvertBooleanD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN13InvertBooleanD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN13InvertBooleanD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN13InvertBoolean7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $p=sp;
 var $3=(sp)+(8);
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet6isDataEv($in);
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 var $7=__ZNK6Packet6asBoolEv($in);
 var $8=$7^1;
 __ZN6PacketC1Eb($p,$8);
 var $9=$4;
 var $10=$3;
 var $11=$p;
 assert(8 % 1 === 0);HEAP32[(($10)>>2)]=HEAP32[(($11)>>2)];HEAP32[((($10)+(4))>>2)]=HEAP32[((($11)+(4))>>2)];
 __ZN9Component4sendE6Packeta($9,$3,0);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN13InvertBooleanD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN9SerialOutC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=88;
 STACKTOP=sp;return;
}


function __ZN9SerialOutD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9SerialOutD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9SerialOutD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN9SerialOutD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9SerialOut7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $serialDevice;
 $1=$this;
 $2=$port;
 var $3=$1;
 $serialDevice=-1;
 var $4=__ZNK6Packet7isSetupEv($in);
 if($4){label=2;break;}else{label=3;break;}
 case 2: 
 var $6=$3;
 var $7=(($6+4)|0);
 var $8=HEAP32[(($7)>>2)];
 var $9=$8;
 var $10=HEAP32[(($9)>>2)];
 var $11=(($10+12)|0);
 var $12=HEAP32[(($11)>>2)];
 FUNCTION_TABLE[$12]($8,-1,9600);
 label=6;break;
 case 3: 
 var $14=__ZNK6Packet6isByteEv($in);
 if($14){label=4;break;}else{label=5;break;}
 case 4: 
 var $16=$3;
 var $17=(($16+4)|0);
 var $18=HEAP32[(($17)>>2)];
 var $19=$18;
 var $20=HEAP32[(($19)>>2)];
 var $21=(($20+24)|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=__ZNK6Packet6asByteEv($in);
 FUNCTION_TABLE[$22]($18,-1,$23);
 label=5;break;
 case 5: 
 label=6;break;
 case 6: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN9SerialOutD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN8SerialInC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=312;
 STACKTOP=sp;return;
}


function __ZN8SerialInD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN8SerialInD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN8SerialInD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN8SerialInD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN8SerialIn7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $serialDevice;
 var $c;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 $serialDevice=-1;
 var $5=__ZNK6Packet7isSetupEv($in);
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 var $7=$4;
 var $8=(($7+4)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=$9;
 var $11=HEAP32[(($10)>>2)];
 var $12=(($11+12)|0);
 var $13=HEAP32[(($12)>>2)];
 FUNCTION_TABLE[$13]($9,-1,9600);
 label=8;break;
 case 3: 
 var $15=__ZNK6Packet6isTickEv($in);
 if($15){label=4;break;}else{label=7;break;}
 case 4: 
 var $17=$4;
 var $18=(($17+4)|0);
 var $19=HEAP32[(($18)>>2)];
 var $20=$19;
 var $21=HEAP32[(($20)>>2)];
 var $22=(($21+16)|0);
 var $23=HEAP32[(($22)>>2)];
 var $24=FUNCTION_TABLE[$23]($19,-1);
 var $25=($24|0)>0;
 if($25){label=5;break;}else{label=6;break;}
 case 5: 
 var $27=$4;
 var $28=(($27+4)|0);
 var $29=HEAP32[(($28)>>2)];
 var $30=$29;
 var $31=HEAP32[(($30)>>2)];
 var $32=(($31+20)|0);
 var $33=HEAP32[(($32)>>2)];
 var $34=FUNCTION_TABLE[$33]($29,-1);
 $c=$34;
 var $35=$4;
 var $36=$c;
 __ZN6PacketC1Eh($3,$36);
 __ZN9Component4sendE6Packeta($35,$3,0);
 label=6;break;
 case 6: 
 label=7;break;
 case 7: 
 label=8;break;
 case 8: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN8SerialInD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN5TimerC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=504;
 STACKTOP=sp;return;
}


function __ZN5TimerD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5TimerD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5TimerD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN5TimerD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5Timer7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $currentMillis;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet7isSetupEv($in);
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 var $7=(($4+32)|0);
 HEAP32[(($7)>>2)]=0;
 var $8=(($4+36)|0);
 HEAP32[(($8)>>2)]=1000;
 label=16;break;
 case 3: 
 var $10=__ZNK6Packet6isTickEv($in);
 if($10){label=4;break;}else{label=7;break;}
 case 4: 
 var $12=$4;
 var $13=(($12+4)|0);
 var $14=HEAP32[(($13)>>2)];
 var $15=$14;
 var $16=HEAP32[(($15)>>2)];
 var $17=(($16+52)|0);
 var $18=HEAP32[(($17)>>2)];
 var $19=FUNCTION_TABLE[$18]($14);
 $currentMillis=$19;
 var $20=$currentMillis;
 var $21=(($4+32)|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=((($20)-($22))|0);
 var $24=(($4+36)|0);
 var $25=HEAP32[(($24)>>2)];
 var $26=($23>>>0)>=($25>>>0);
 if($26){label=5;break;}else{label=6;break;}
 case 5: 
 var $28=$currentMillis;
 var $29=(($4+32)|0);
 HEAP32[(($29)>>2)]=$28;
 var $30=$4;
 __ZN6PacketC1Ev($3);
 __ZN9Component4sendE6Packeta($30,$3,0);
 label=6;break;
 case 6: 
 label=15;break;
 case 7: 
 var $33=$2;
 var $34=(($33<<24)>>24);
 var $35=($34|0)==0;
 if($35){label=8;break;}else{label=10;break;}
 case 8: 
 var $37=__ZNK6Packet6isDataEv($in);
 if($37){label=9;break;}else{label=10;break;}
 case 9: 
 var $39=__ZNK6Packet9asIntegerEv($in);
 var $40=(($4+36)|0);
 HEAP32[(($40)>>2)]=$39;
 label=14;break;
 case 10: 
 var $42=$2;
 var $43=(($42<<24)>>24);
 var $44=($43|0)==2;
 if($44){label=11;break;}else{label=13;break;}
 case 11: 
 var $46=__ZNK6Packet6isDataEv($in);
 if($46){label=12;break;}else{label=13;break;}
 case 12: 
 var $48=$4;
 var $49=(($48+4)|0);
 var $50=HEAP32[(($49)>>2)];
 var $51=$50;
 var $52=HEAP32[(($51)>>2)];
 var $53=(($52+52)|0);
 var $54=HEAP32[(($53)>>2)];
 var $55=FUNCTION_TABLE[$54]($50);
 var $56=(($4+32)|0);
 HEAP32[(($56)>>2)]=$55;
 label=13;break;
 case 13: 
 label=14;break;
 case 14: 
 label=15;break;
 case 15: 
 label=16;break;
 case 16: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5TimerD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN11DigitalReadC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1600;
 STACKTOP=sp;return;
}


function __ZN11DigitalReadD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN11DigitalReadD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN11DigitalReadD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN11DigitalReadD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN11DigitalRead7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $triggerPort;
 var $pinConfigPort;
 var $pullupConfigPort;
 var $isHigh;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 $triggerPort=0;
 $pinConfigPort=1;
 $pullupConfigPort=2;
 var $5=__ZNK6Packet7isSetupEv($in);
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 __ZN11DigitalRead15setPinAndPullupEib($4,12,1);
 label=15;break;
 case 3: 
 var $8=$2;
 var $9=(($8<<24)>>24);
 var $10=($9|0)==0;
 if($10){label=4;break;}else{label=6;break;}
 case 4: 
 var $12=__ZNK6Packet6isDataEv($in);
 if($12){label=5;break;}else{label=6;break;}
 case 5: 
 var $14=$4;
 var $15=(($14+4)|0);
 var $16=HEAP32[(($15)>>2)];
 var $17=$16;
 var $18=HEAP32[(($17)>>2)];
 var $19=(($18+40)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=(($4+32)|0);
 var $22=HEAP8[(($21)>>0)];
 var $23=FUNCTION_TABLE[$20]($16,$22);
 var $24=($23&1);
 $isHigh=$24;
 var $25=$4;
 var $26=$isHigh;
 var $27=(($26)&1);
 __ZN6PacketC1Eb($3,$27);
 __ZN9Component4sendE6Packeta($25,$3,0);
 label=14;break;
 case 6: 
 var $29=$2;
 var $30=(($29<<24)>>24);
 var $31=($30|0)==1;
 if($31){label=7;break;}else{label=9;break;}
 case 7: 
 var $33=__ZNK6Packet8isNumberEv($in);
 if($33){label=8;break;}else{label=9;break;}
 case 8: 
 var $35=__ZNK6Packet9asIntegerEv($in);
 var $36=(($4+33)|0);
 var $37=HEAP8[(($36)>>0)];
 var $38=(($37)&1);
 __ZN11DigitalRead15setPinAndPullupEib($4,$35,$38);
 label=13;break;
 case 9: 
 var $40=$2;
 var $41=(($40<<24)>>24);
 var $42=($41|0)==2;
 if($42){label=10;break;}else{label=12;break;}
 case 10: 
 var $44=__ZNK6Packet6isBoolEv($in);
 if($44){label=11;break;}else{label=12;break;}
 case 11: 
 var $46=(($4+32)|0);
 var $47=HEAP8[(($46)>>0)];
 var $48=(($47<<24)>>24);
 var $49=__ZNK6Packet6asBoolEv($in);
 __ZN11DigitalRead15setPinAndPullupEib($4,$48,$49);
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 label=14;break;
 case 14: 
 label=15;break;
 case 15: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN11DigitalRead15setPinAndPullupEib($this,$newPin,$newPullup){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 var $3;
 $1=$this;
 $2=$newPin;
 var $4=($newPullup&1);
 $3=$4;
 var $5=$1;
 var $6=$2;
 var $7=(($6)&255);
 var $8=(($5+32)|0);
 HEAP8[(($8)>>0)]=$7;
 var $9=$3;
 var $10=(($9)&1);
 var $11=(($5+33)|0);
 var $12=($10&1);
 HEAP8[(($11)>>0)]=$12;
 var $13=$5;
 var $14=(($13+4)|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=$15;
 var $17=HEAP32[(($16)>>2)];
 var $18=(($17+28)|0);
 var $19=HEAP32[(($18)>>2)];
 var $20=(($5+32)|0);
 var $21=HEAP8[(($20)>>0)];
 FUNCTION_TABLE[$19]($15,$21,0);
 var $22=$5;
 var $23=(($22+4)|0);
 var $24=HEAP32[(($23)>>2)];
 var $25=$24;
 var $26=HEAP32[(($25)>>2)];
 var $27=(($26+32)|0);
 var $28=HEAP32[(($27)>>2)];
 var $29=(($5+32)|0);
 var $30=HEAP8[(($29)>>0)];
 var $31=(($5+33)|0);
 var $32=HEAP8[(($31)>>0)];
 var $33=(($32)&1);
 var $34=($33?1:0);
 FUNCTION_TABLE[$28]($24,$30,$34);
 STACKTOP=sp;return;
}


function __ZN11DigitalReadD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN12DigitalWriteC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1512;
 STACKTOP=sp;return;
}


function __ZN12DigitalWriteD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN12DigitalWriteD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN12DigitalWriteD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN12DigitalWriteD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12DigitalWrite7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+16)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 var $4=(sp)+(8);
 $1=$this;
 $2=$port;
 var $5=$1;
 var $6=__ZNK6Packet7isSetupEv($in);
 if($6){label=2;break;}else{label=3;break;}
 case 2: 
 var $8=(($5+32)|0);
 HEAP8[(($8)>>0)]=-1;
 var $9=(($5+33)|0);
 HEAP8[(($9)>>0)]=0;
 label=15;break;
 case 3: 
 var $11=$2;
 var $12=(($11<<24)>>24);
 var $13=($12|0)==0;
 if($13){label=4;break;}else{label=8;break;}
 case 4: 
 var $15=__ZNK6Packet6isBoolEv($in);
 if($15){label=5;break;}else{label=8;break;}
 case 5: 
 var $17=__ZNK6Packet6asBoolEv($in);
 var $18=(($5+33)|0);
 var $19=($17&1);
 HEAP8[(($18)>>0)]=$19;
 var $20=(($5+32)|0);
 var $21=HEAP8[(($20)>>0)];
 var $22=(($21<<24)>>24);
 var $23=($22|0)>=0;
 if($23){label=6;break;}else{label=7;break;}
 case 6: 
 var $25=$5;
 var $26=(($25+4)|0);
 var $27=HEAP32[(($26)>>2)];
 var $28=$27;
 var $29=HEAP32[(($28)>>2)];
 var $30=(($29+36)|0);
 var $31=HEAP32[(($30)>>2)];
 var $32=(($5+32)|0);
 var $33=HEAP8[(($32)>>0)];
 var $34=(($5+33)|0);
 var $35=HEAP8[(($34)>>0)];
 var $36=(($35)&1);
 FUNCTION_TABLE[$31]($27,$33,$36);
 var $37=$5;
 var $38=$3;
 var $39=$in;
 assert(8 % 1 === 0);HEAP32[(($38)>>2)]=HEAP32[(($39)>>2)];HEAP32[((($38)+(4))>>2)]=HEAP32[((($39)+(4))>>2)];
 __ZN9Component4sendE6Packeta($37,$3,0);
 label=7;break;
 case 7: 
 label=14;break;
 case 8: 
 var $42=$2;
 var $43=(($42<<24)>>24);
 var $44=($43|0)==1;
 if($44){label=9;break;}else{label=13;break;}
 case 9: 
 var $46=__ZNK6Packet8isNumberEv($in);
 if($46){label=10;break;}else{label=13;break;}
 case 10: 
 var $48=__ZNK6Packet9asIntegerEv($in);
 var $49=(($48)&255);
 var $50=(($5+32)|0);
 HEAP8[(($50)>>0)]=$49;
 var $51=$5;
 var $52=(($51+4)|0);
 var $53=HEAP32[(($52)>>2)];
 var $54=$53;
 var $55=HEAP32[(($54)>>2)];
 var $56=(($55+28)|0);
 var $57=HEAP32[(($56)>>2)];
 var $58=(($5+32)|0);
 var $59=HEAP8[(($58)>>0)];
 FUNCTION_TABLE[$57]($53,$59,1);
 var $60=(($5+32)|0);
 var $61=HEAP8[(($60)>>0)];
 var $62=(($61<<24)>>24);
 var $63=($62|0)>=0;
 if($63){label=11;break;}else{label=12;break;}
 case 11: 
 var $65=$5;
 var $66=(($65+4)|0);
 var $67=HEAP32[(($66)>>2)];
 var $68=$67;
 var $69=HEAP32[(($68)>>2)];
 var $70=(($69+36)|0);
 var $71=HEAP32[(($70)>>2)];
 var $72=(($5+32)|0);
 var $73=HEAP8[(($72)>>0)];
 var $74=(($5+33)|0);
 var $75=HEAP8[(($74)>>0)];
 var $76=(($75)&1);
 FUNCTION_TABLE[$71]($67,$73,$76);
 var $77=$5;
 var $78=$4;
 var $79=$in;
 assert(8 % 1 === 0);HEAP32[(($78)>>2)]=HEAP32[(($79)>>2)];HEAP32[((($78)+(4))>>2)]=HEAP32[((($79)+(4))>>2)];
 __ZN9Component4sendE6Packeta($77,$4,0);
 label=12;break;
 case 12: 
 label=13;break;
 case 13: 
 label=14;break;
 case 14: 
 label=15;break;
 case 15: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN12DigitalWriteD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN5CountC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=600;
 STACKTOP=sp;return;
}


function __ZN5CountD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN5CountD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN5CountD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN5CountD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN5Count7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+24)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 var $4=(sp)+(8);
 var $5=(sp)+(16);
 $1=$this;
 $2=$port;
 var $6=$1;
 var $7=__ZNK6Packet7isSetupEv($in);
 if($7){label=2;break;}else{label=3;break;}
 case 2: 
 var $9=(($6+32)|0);
 HEAP32[(($9)>>2)]=0;
 var $10=(($6+36)|0);
 HEAP8[(($10)>>0)]=0;
 var $11=$6;
 var $12=(($6+32)|0);
 var $13=HEAP32[(($12)>>2)];
 __ZN6PacketC1El($3,$13);
 __ZN9Component4sendE6Packeta($11,$3,0);
 label=16;break;
 case 3: 
 var $15=$2;
 var $16=(($15<<24)>>24);
 var $17=($16|0)==0;
 if($17){label=4;break;}else{label=7;break;}
 case 4: 
 var $19=(($6+36)|0);
 var $20=HEAP8[(($19)>>0)];
 var $21=(($20)&1);
 if($21){label=6;break;}else{label=5;break;}
 case 5: 
 var $23=(($6+32)|0);
 var $24=HEAP32[(($23)>>2)];
 var $25=((($24)+(1))|0);
 HEAP32[(($23)>>2)]=$25;
 var $26=$6;
 var $27=(($6+32)|0);
 var $28=HEAP32[(($27)>>2)];
 __ZN6PacketC1El($4,$28);
 __ZN9Component4sendE6Packeta($26,$4,0);
 label=6;break;
 case 6: 
 label=15;break;
 case 7: 
 var $31=$2;
 var $32=(($31<<24)>>24);
 var $33=($32|0)==1;
 if($33){label=8;break;}else{label=14;break;}
 case 8: 
 var $35=__ZNK6Packet6isBoolEv($in);
 if($35){label=9;break;}else{label=10;break;}
 case 9: 
 var $37=__ZNK6Packet6asBoolEv($in);
 var $38=(($6+36)|0);
 var $39=($37&1);
 HEAP8[(($38)>>0)]=$39;
 label=10;break;
 case 10: 
 var $41=(($6+36)|0);
 var $42=HEAP8[(($41)>>0)];
 var $43=(($42)&1);
 if($43){label=12;break;}else{label=11;break;}
 case 11: 
 var $45=__ZNK6Packet6isVoidEv($in);
 if($45){label=12;break;}else{label=13;break;}
 case 12: 
 var $47=(($6+32)|0);
 HEAP32[(($47)>>2)]=0;
 var $48=$6;
 var $49=(($6+32)|0);
 var $50=HEAP32[(($49)>>2)];
 __ZN6PacketC1El($5,$50);
 __ZN9Component4sendE6Packeta($48,$5,0);
 label=13;break;
 case 13: 
 label=14;break;
 case 14: 
 label=15;break;
 case 15: 
 label=16;break;
 case 16: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet6isVoidEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)==3;
 STACKTOP=sp;return $5;
}


function __ZN5CountD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN7ForwardC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=440;
 STACKTOP=sp;return;
}


function __ZN7ForwardD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN7ForwardD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN7ForwardD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN7ForwardD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7Forward7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet6isDataEv($in);
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 var $7=$4;
 var $8=$3;
 var $9=$in;
 assert(8 % 1 === 0);HEAP32[(($8)>>2)]=HEAP32[(($9)>>2)];HEAP32[((($8)+(4))>>2)]=HEAP32[((($9)+(4))>>2)];
 var $10=$2;
 __ZN9Component4sendE6Packeta($7,$3,$10);
 label=3;break;
 case 3: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7ForwardD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN10AnalogReadC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=1728;
 STACKTOP=sp;return;
}


function __ZN10AnalogReadD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN10AnalogReadD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN10AnalogReadD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN10AnalogReadD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10AnalogRead7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $val;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet7isSetupEv($in);
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 label=11;break;
 case 3: 
 var $8=$2;
 var $9=(($8<<24)>>24);
 var $10=($9|0)==0;
 if($10){label=4;break;}else{label=6;break;}
 case 4: 
 var $12=__ZNK6Packet6isDataEv($in);
 if($12){label=5;break;}else{label=6;break;}
 case 5: 
 var $14=$4;
 var $15=(($14+4)|0);
 var $16=HEAP32[(($15)>>2)];
 var $17=$16;
 var $18=HEAP32[(($17)>>2)];
 var $19=(($18+44)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=(($4+32)|0);
 var $22=HEAP8[(($21)>>0)];
 var $23=FUNCTION_TABLE[$20]($16,$22);
 $val=$23;
 var $24=$4;
 var $25=$val;
 __ZN6PacketC1El($3,$25);
 __ZN9Component4sendE6Packeta($24,$3,0);
 label=10;break;
 case 6: 
 var $27=$2;
 var $28=(($27<<24)>>24);
 var $29=($28|0)==1;
 if($29){label=7;break;}else{label=9;break;}
 case 7: 
 var $31=__ZNK6Packet8isNumberEv($in);
 if($31){label=8;break;}else{label=9;break;}
 case 8: 
 var $33=__ZNK6Packet9asIntegerEv($in);
 var $34=(($33)&255);
 var $35=(($4+32)|0);
 HEAP8[(($35)>>0)]=$34;
 var $36=$4;
 var $37=(($36+4)|0);
 var $38=HEAP32[(($37)>>2)];
 var $39=$38;
 var $40=HEAP32[(($39)>>2)];
 var $41=(($40+28)|0);
 var $42=HEAP32[(($41)>>2)];
 var $43=(($4+32)|0);
 var $44=HEAP8[(($43)>>0)];
 FUNCTION_TABLE[$42]($38,$44,0);
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 label=11;break;
 case 11: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN10AnalogReadD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN8PwmWriteC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentC2Ev($3);
 var $4=$2;
 HEAP32[(($4)>>2)]=344;
 STACKTOP=sp;return;
}


function __ZN8PwmWriteD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN8PwmWriteD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN8PwmWriteD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN8PwmWriteD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZN8PwmWrite7processE6Packeta($this,$in,$port){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+8)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 var tempParam = $in; $in=STACKTOP;STACKTOP = (STACKTOP + 8)|0;(assert((STACKTOP|0) < (STACK_MAX|0))|0);HEAP32[(($in)>>2)]=HEAP32[((tempParam)>>2)];HEAP32[((($in)+(4))>>2)]=HEAP32[(((tempParam)+(4))>>2)];
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3=sp;
 $1=$this;
 $2=$port;
 var $4=$1;
 var $5=__ZNK6Packet7isSetupEv($in);
 if($5){label=2;break;}else{label=3;break;}
 case 2: 
 label=11;break;
 case 3: 
 var $8=$2;
 var $9=(($8<<24)>>24);
 var $10=($9|0)==0;
 if($10){label=4;break;}else{label=6;break;}
 case 4: 
 var $12=__ZNK6Packet6isDataEv($in);
 if($12){label=5;break;}else{label=6;break;}
 case 5: 
 var $14=$4;
 var $15=(($14+4)|0);
 var $16=HEAP32[(($15)>>2)];
 var $17=$16;
 var $18=HEAP32[(($17)>>2)];
 var $19=(($18+48)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=(($4+32)|0);
 var $22=HEAP8[(($21)>>0)];
 var $23=__ZNK6Packet9asIntegerEv($in);
 FUNCTION_TABLE[$20]($16,$22,$23);
 var $24=$4;
 var $25=$3;
 var $26=$in;
 assert(8 % 1 === 0);HEAP32[(($25)>>2)]=HEAP32[(($26)>>2)];HEAP32[((($25)+(4))>>2)]=HEAP32[((($26)+(4))>>2)];
 __ZN9Component4sendE6Packeta($24,$3,0);
 label=10;break;
 case 6: 
 var $28=$2;
 var $29=(($28<<24)>>24);
 var $30=($29|0)==1;
 if($30){label=7;break;}else{label=9;break;}
 case 7: 
 var $32=__ZNK6Packet8isNumberEv($in);
 if($32){label=8;break;}else{label=9;break;}
 case 8: 
 var $34=__ZNK6Packet9asIntegerEv($in);
 var $35=(($34)&255);
 var $36=(($4+32)|0);
 HEAP8[(($36)>>0)]=$35;
 var $37=$4;
 var $38=(($37+4)|0);
 var $39=HEAP32[(($38)>>2)];
 var $40=$39;
 var $41=HEAP32[(($40)>>2)];
 var $42=(($41+28)|0);
 var $43=HEAP32[(($42)>>2)];
 var $44=(($4+32)|0);
 var $45=HEAP8[(($44)>>0)];
 FUNCTION_TABLE[$43]($39,$45,1);
 label=9;break;
 case 9: 
 label=10;break;
 case 10: 
 label=11;break;
 case 11: 
 STACKTOP=sp;return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN8PwmWriteD2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 __ZN21SingleOutputComponentD2Ev($3);
 STACKTOP=sp;return;
}


function __ZN9ComponentD1Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 __ZN9ComponentD2Ev($2);
 STACKTOP=sp;return;
}


function __ZN9ComponentD0Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 var $2;
 var $3;
 $1=$this;
 var $4=$1;
 (function() { try { __THREW__ = 0; return __ZN9ComponentD1Ev($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label=2;break; } else { label=3;break; }
 case 2: 
 var $6=$4;
 __ZdlPv($6);
 STACKTOP=sp;return;
 case 3: 
 var $8$0 = ___cxa_find_matching_catch(-1, -1); var $8$1 = tempRet0;
 var $9=$8$0;
 $2=$9;
 var $10=$8$1;
 $3=$10;
 var $11=$4;
 __ZdlPv($11);
 label=4;break;
 case 4: 
 var $13=$2;
 var $14=$3;
 var $15$0=$13;
 var $15$1=0;
 var $16$0=$15$0;
 var $16$1=$14;
 ___resumeException($16$0)
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK6Packet7isFloatEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+4)|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=($4|0)==8;
 STACKTOP=sp;return $5;
}


function __ZNK6Packet9isSpecialEv($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1;
 $1=$this;
 var $2=$1;
 var $3=__ZNK6Packet7isSetupEv($2);
 if($3){var $7=1;label=3;break;}else{label=2;break;}
 case 2: 
 var $5=__ZNK6Packet6isTickEv($2);
 var $7=$5;label=3;break;
 case 3: 
 var $7;
 STACKTOP=sp;return $7;
  default: assert(0, "bad label: " + label);
 }

}


function __ZN7MessageC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2+8)|0);
 __ZN6PacketC1Ev($3);
 STACKTOP=sp;return;
}


function __ZN6PacketC2Eb($this,$b){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 var $3=($b&1);
 $2=$3;
 var $4=$1;
 var $5=(($4)|0);
 var $6=(($4+4)|0);
 HEAP32[(($6)>>2)]=6;
 var $7=$2;
 var $8=(($7)&1);
 var $9=(($4)|0);
 var $10=$9;
 var $11=($8&1);
 HEAP8[(($10)>>0)]=$11;
 STACKTOP=sp;return;
}


function __ZN6PacketC2Eh($this,$by){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$by;
 var $3=$1;
 var $4=(($3)|0);
 var $5=(($3+4)|0);
 HEAP32[(($5)>>2)]=4;
 var $6=$2;
 var $7=(($3)|0);
 var $8=$7;
 HEAP8[(($8)>>0)]=$6;
 STACKTOP=sp;return;
}


function __ZN6PacketC2El($this,$l){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$l;
 var $3=$1;
 var $4=(($3)|0);
 var $5=(($3+4)|0);
 HEAP32[(($5)>>2)]=7;
 var $6=$2;
 var $7=(($3)|0);
 var $8=$7;
 HEAP32[(($8)>>2)]=$6;
 STACKTOP=sp;return;
}


function __ZN6PacketC2E3Msg($this,$m){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 var $2;
 $1=$this;
 $2=$m;
 var $3=$1;
 var $4=(($3)|0);
 var $5=(($3+4)|0);
 var $6=$2;
 HEAP32[(($5)>>2)]=$6;
 STACKTOP=sp;return;
}


function __ZN6PacketC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=(($2)|0);
 var $4=(($2+4)|0);
 HEAP32[(($4)>>2)]=3;
 STACKTOP=sp;return;
}


function __ZN12DebugHandlerC2Ev($this){
 var label=0;
 var sp=STACKTOP; (assert((STACKTOP|0) < (STACK_MAX|0))|0);

 var $1;
 $1=$this;
 var $2=$1;
 var $3=$2;
 HEAP32[(($3)>>2)]=1544;
 STACKTOP=sp;return;
}


function __ZNSt9type_infoD2Ev($this){
 var label=0;


 return;
}


function __ZN10__cxxabiv116__shim_type_infoD2Ev($this){
 var label=0;


 var $1=(($this)|0);
 __ZNSt9type_infoD2Ev($1);
 return;
}


function __ZNK10__cxxabiv116__shim_type_info5noop1Ev($this){
 var label=0;


 return;
}


function __ZNK10__cxxabiv116__shim_type_info5noop2Ev($this){
 var label=0;


 return;
}


function __ZN10__cxxabiv117__class_type_infoD0Ev($this){
 var label=0;


 var $1=(($this)|0);
 __ZNSt9type_infoD2Ev($1);
 var $2=$this;
 __ZdlPv($2);
 return;
}


function __ZN10__cxxabiv120__si_class_type_infoD0Ev($this){
 var label=0;


 var $1=(($this)|0);
 __ZNSt9type_infoD2Ev($1);
 var $2=$this;
 __ZdlPv($2);
 return;
}


function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv($this,$thrown_type,$adjustedPtr){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+56)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $info=sp;
 var $1=(($this)|0);
 var $2=(($thrown_type)|0);
 var $3=($1|0)==($2|0);
 if($3){var $_1=1;label=6;break;}else{label=2;break;}
 case 2: 
 var $5=($thrown_type|0)==0;
 if($5){var $_1=0;label=6;break;}else{label=3;break;}
 case 3: 
 var $7=$thrown_type;
 var $8=___dynamic_cast($7,2912,2896,0);
 var $9=$8;
 var $10=($8|0)==0;
 if($10){var $_1=0;label=6;break;}else{label=4;break;}
 case 4: 
 var $12=$info;
 var $$etemp$0$0=56;
 var $$etemp$0$1=0;

 _memset($12, 0, 56)|0;
 var $13=(($info)|0);
 HEAP32[(($13)>>2)]=$9;
 var $14=(($info+8)|0);
 HEAP32[(($14)>>2)]=$this;
 var $15=(($info+12)|0);
 HEAP32[(($15)>>2)]=-1;
 var $16=(($info+48)|0);
 HEAP32[(($16)>>2)]=1;
 var $17=$8;
 var $18=HEAP32[(($17)>>2)];
 var $19=(($18+28)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=HEAP32[(($adjustedPtr)>>2)];
 FUNCTION_TABLE[$20]($9,$info,$21,1);
 var $22=(($info+24)|0);
 var $23=HEAP32[(($22)>>2)];
 var $24=($23|0)==1;
 if($24){label=5;break;}else{var $_1=0;label=6;break;}
 case 5: 
 var $26=(($info+16)|0);
 var $27=HEAP32[(($26)>>2)];
 HEAP32[(($adjustedPtr)>>2)]=$27;
 var $_1=1;label=6;break;
 case 6: 
 var $_1;
 STACKTOP=sp;return $_1;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($this,$info,$adjustedPtr,$path_below){
 var label=0;

 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1=(($info+8)|0);
 var $2=HEAP32[(($1)>>2)];
 var $3=($2|0)==($this|0);
 if($3){label=2;break;}else{label=8;break;}
 case 2: 
 var $5=(($info+16)|0);
 var $6=HEAP32[(($5)>>2)];
 var $7=($6|0)==0;
 if($7){label=3;break;}else{label=4;break;}
 case 3: 
 HEAP32[(($5)>>2)]=$adjustedPtr;
 var $9=(($info+24)|0);
 HEAP32[(($9)>>2)]=$path_below;
 var $10=(($info+36)|0);
 HEAP32[(($10)>>2)]=1;
 label=8;break;
 case 4: 
 var $12=($6|0)==($adjustedPtr|0);
 if($12){label=5;break;}else{label=7;break;}
 case 5: 
 var $14=(($info+24)|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=($15|0)==2;
 if($16){label=6;break;}else{label=8;break;}
 case 6: 
 HEAP32[(($14)>>2)]=$path_below;
 label=8;break;
 case 7: 
 var $19=(($info+36)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=((($20)+(1))|0);
 HEAP32[(($19)>>2)]=$21;
 var $22=(($info+24)|0);
 HEAP32[(($22)>>2)]=2;
 var $23=(($info+54)|0);
 HEAP8[(($23)>>0)]=1;
 label=8;break;
 case 8: 
 return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi($this,$info,$adjustedPtr,$path_below){
 var label=0;

 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1=(($this)|0);
 var $2=(($info+8)|0);
 var $3=HEAP32[(($2)>>2)];
 var $4=(($3)|0);
 var $5=($1|0)==($4|0);
 if($5){label=2;break;}else{label=8;break;}
 case 2: 
 var $7=(($info+16)|0);
 var $8=HEAP32[(($7)>>2)];
 var $9=($8|0)==0;
 if($9){label=3;break;}else{label=4;break;}
 case 3: 
 HEAP32[(($7)>>2)]=$adjustedPtr;
 var $11=(($info+24)|0);
 HEAP32[(($11)>>2)]=$path_below;
 var $12=(($info+36)|0);
 HEAP32[(($12)>>2)]=1;
 label=9;break;
 case 4: 
 var $14=($8|0)==($adjustedPtr|0);
 if($14){label=5;break;}else{label=7;break;}
 case 5: 
 var $16=(($info+24)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=($17|0)==2;
 if($18){label=6;break;}else{label=9;break;}
 case 6: 
 HEAP32[(($16)>>2)]=$path_below;
 label=9;break;
 case 7: 
 var $21=(($info+36)|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=((($22)+(1))|0);
 HEAP32[(($21)>>2)]=$23;
 var $24=(($info+24)|0);
 HEAP32[(($24)>>2)]=2;
 var $25=(($info+54)|0);
 HEAP8[(($25)>>0)]=1;
 label=9;break;
 case 8: 
 var $27=(($this+8)|0);
 var $28=HEAP32[(($27)>>2)];
 var $29=$28;
 var $30=HEAP32[(($29)>>2)];
 var $31=(($30+28)|0);
 var $32=HEAP32[(($31)>>2)];
 FUNCTION_TABLE[$32]($28,$info,$adjustedPtr,$path_below);
 label=9;break;
 case 9: 
 return;
  default: assert(0, "bad label: " + label);
 }

}


function ___dynamic_cast($static_ptr,$static_type,$dst_type,$src2dst_offset){
 var label=0;
 var sp=STACKTOP;STACKTOP=(STACKTOP+56)|0; (assert((STACKTOP|0) < (STACK_MAX|0))|0);
 label = 1; 
 while(1)switch(label){
 case 1: 
 var $info=sp;
 var $1=$static_ptr;
 var $2=HEAP32[(($1)>>2)];
 var $3=((($2)-(8))|0);
 var $4=HEAP32[(($3)>>2)];
 var $5=$4;
 var $6=(($static_ptr+$5)|0);
 var $7=((($2)-(4))|0);
 var $8=HEAP32[(($7)>>2)];
 var $9=$8;
 var $10=$info;
 var $$etemp$0$0=56;
 var $$etemp$0$1=0;

 var $11=(($info)|0);
 HEAP32[(($11)>>2)]=$dst_type;
 var $12=(($info+4)|0);
 HEAP32[(($12)>>2)]=$static_ptr;
 var $13=(($info+8)|0);
 HEAP32[(($13)>>2)]=$static_type;
 var $14=(($info+12)|0);
 HEAP32[(($14)>>2)]=$src2dst_offset;
 var $15=(($info+16)|0);
 var $16=(($info+20)|0);
 var $17=(($info+24)|0);
 var $18=(($info+28)|0);
 var $19=(($info+32)|0);
 var $20=(($info+40)|0);
 var $21=$8;
 var $22=(($dst_type)|0);
 var $23=($21|0)==($22|0);
 var $24=$15;
 _memset($24, 0, 39)|0;
 if($23){label=2;break;}else{label=3;break;}
 case 2: 
 var $26=(($info+48)|0);
 HEAP32[(($26)>>2)]=1;
 var $27=$8;
 var $28=HEAP32[(($27)>>2)];
 var $29=(($28+20)|0);
 var $30=HEAP32[(($29)>>2)];
 FUNCTION_TABLE[$30]($9,$info,$6,$6,1,0);
 var $31=HEAP32[(($17)>>2)];
 var $32=($31|0)==1;
 var $_=($32?$6:0);
 var $dst_ptr_0=$_;label=12;break;
 case 3: 
 var $34=(($info+36)|0);
 var $35=$8;
 var $36=HEAP32[(($35)>>2)];
 var $37=(($36+24)|0);
 var $38=HEAP32[(($37)>>2)];
 FUNCTION_TABLE[$38]($9,$info,$6,1,0);
 var $39=HEAP32[(($34)>>2)];
 if(($39|0)==0){ label=4;break;}else if(($39|0)==1){ label=7;break;}else{var $dst_ptr_0=0;label=12;break;}
 case 4: 
 var $41=HEAP32[(($20)>>2)];
 var $42=($41|0)==1;
 if($42){label=5;break;}else{var $dst_ptr_0=0;label=12;break;}
 case 5: 
 var $44=HEAP32[(($18)>>2)];
 var $45=($44|0)==1;
 if($45){label=6;break;}else{var $dst_ptr_0=0;label=12;break;}
 case 6: 
 var $47=HEAP32[(($19)>>2)];
 var $48=($47|0)==1;
 var $49=HEAP32[(($16)>>2)];
 var $_1=($48?$49:0);
 var $dst_ptr_0=$_1;label=12;break;
 case 7: 
 var $51=HEAP32[(($17)>>2)];
 var $52=($51|0)==1;
 if($52){label=11;break;}else{label=8;break;}
 case 8: 
 var $54=HEAP32[(($20)>>2)];
 var $55=($54|0)==0;
 if($55){label=9;break;}else{var $dst_ptr_0=0;label=12;break;}
 case 9: 
 var $57=HEAP32[(($18)>>2)];
 var $58=($57|0)==1;
 if($58){label=10;break;}else{var $dst_ptr_0=0;label=12;break;}
 case 10: 
 var $60=HEAP32[(($19)>>2)];
 var $61=($60|0)==1;
 if($61){label=11;break;}else{var $dst_ptr_0=0;label=12;break;}
 case 11: 
 var $63=HEAP32[(($15)>>2)];
 var $dst_ptr_0=$63;label=12;break;
 case 12: 
 var $dst_ptr_0;
 var $$etemp$1$0=56;
 var $$etemp$1$1=0;

 STACKTOP=sp;return $dst_ptr_0;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($this,$info,$current_ptr,$path_below,$use_strcmp){
 var label=0;

 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1=(($this)|0);
 var $2=(($info+8)|0);
 var $3=HEAP32[(($2)>>2)];
 var $4=(($3)|0);
 var $5=($1|0)==($4|0);
 if($5){label=2;break;}else{label=5;break;}
 case 2: 
 var $7=(($info+4)|0);
 var $8=HEAP32[(($7)>>2)];
 var $9=($8|0)==($current_ptr|0);
 if($9){label=3;break;}else{label=20;break;}
 case 3: 
 var $11=(($info+28)|0);
 var $12=HEAP32[(($11)>>2)];
 var $13=($12|0)==1;
 if($13){label=20;break;}else{label=4;break;}
 case 4: 
 HEAP32[(($11)>>2)]=$path_below;
 label=20;break;
 case 5: 
 var $16=(($info)|0);
 var $17=HEAP32[(($16)>>2)];
 var $18=(($17)|0);
 var $19=($1|0)==($18|0);
 if($19){label=6;break;}else{label=19;break;}
 case 6: 
 var $21=(($info+16)|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=($22|0)==($current_ptr|0);
 if($23){label=8;break;}else{label=7;break;}
 case 7: 
 var $25=(($info+20)|0);
 var $26=HEAP32[(($25)>>2)];
 var $27=($26|0)==($current_ptr|0);
 if($27){label=8;break;}else{label=10;break;}
 case 8: 
 var $29=($path_below|0)==1;
 if($29){label=9;break;}else{label=20;break;}
 case 9: 
 var $31=(($info+32)|0);
 HEAP32[(($31)>>2)]=1;
 label=20;break;
 case 10: 
 var $33=(($info+32)|0);
 HEAP32[(($33)>>2)]=$path_below;
 var $34=(($info+44)|0);
 var $35=HEAP32[(($34)>>2)];
 var $36=($35|0)==4;
 if($36){label=20;break;}else{label=11;break;}
 case 11: 
 var $38=(($info+52)|0);
 HEAP8[(($38)>>0)]=0;
 var $39=(($info+53)|0);
 HEAP8[(($39)>>0)]=0;
 var $40=(($this+8)|0);
 var $41=HEAP32[(($40)>>2)];
 var $42=$41;
 var $43=HEAP32[(($42)>>2)];
 var $44=(($43+20)|0);
 var $45=HEAP32[(($44)>>2)];
 FUNCTION_TABLE[$45]($41,$info,$current_ptr,$current_ptr,1,$use_strcmp);
 var $46=HEAP8[(($39)>>0)];
 var $47=(($46<<24)>>24)==0;
 if($47){var $is_dst_type_derived_from_static_type_0_off01=0;label=13;break;}else{label=12;break;}
 case 12: 
 var $49=HEAP8[(($38)>>0)];
 var $not_=(($49<<24)>>24)==0;
 if($not_){var $is_dst_type_derived_from_static_type_0_off01=1;label=13;break;}else{label=17;break;}
 case 13: 
 var $is_dst_type_derived_from_static_type_0_off01;
 HEAP32[(($25)>>2)]=$current_ptr;
 var $50=(($info+40)|0);
 var $51=HEAP32[(($50)>>2)];
 var $52=((($51)+(1))|0);
 HEAP32[(($50)>>2)]=$52;
 var $53=(($info+36)|0);
 var $54=HEAP32[(($53)>>2)];
 var $55=($54|0)==1;
 if($55){label=14;break;}else{label=16;break;}
 case 14: 
 var $57=(($info+24)|0);
 var $58=HEAP32[(($57)>>2)];
 var $59=($58|0)==2;
 if($59){label=15;break;}else{label=16;break;}
 case 15: 
 var $61=(($info+54)|0);
 HEAP8[(($61)>>0)]=1;
 if($is_dst_type_derived_from_static_type_0_off01){label=17;break;}else{label=18;break;}
 case 16: 
 if($is_dst_type_derived_from_static_type_0_off01){label=17;break;}else{label=18;break;}
 case 17: 
 HEAP32[(($34)>>2)]=3;
 label=20;break;
 case 18: 
 HEAP32[(($34)>>2)]=4;
 label=20;break;
 case 19: 
 var $65=(($this+8)|0);
 var $66=HEAP32[(($65)>>2)];
 var $67=$66;
 var $68=HEAP32[(($67)>>2)];
 var $69=(($68+24)|0);
 var $70=HEAP32[(($69)>>2)];
 FUNCTION_TABLE[$70]($66,$info,$current_ptr,$path_below,$use_strcmp);
 label=20;break;
 case 20: 
 return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib($this,$info,$current_ptr,$path_below,$use_strcmp){
 var label=0;

 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1=(($info+8)|0);
 var $2=HEAP32[(($1)>>2)];
 var $3=($2|0)==($this|0);
 if($3){label=2;break;}else{label=5;break;}
 case 2: 
 var $5=(($info+4)|0);
 var $6=HEAP32[(($5)>>2)];
 var $7=($6|0)==($current_ptr|0);
 if($7){label=3;break;}else{label=14;break;}
 case 3: 
 var $9=(($info+28)|0);
 var $10=HEAP32[(($9)>>2)];
 var $11=($10|0)==1;
 if($11){label=14;break;}else{label=4;break;}
 case 4: 
 HEAP32[(($9)>>2)]=$path_below;
 label=14;break;
 case 5: 
 var $14=(($info)|0);
 var $15=HEAP32[(($14)>>2)];
 var $16=($15|0)==($this|0);
 if($16){label=6;break;}else{label=14;break;}
 case 6: 
 var $18=(($info+16)|0);
 var $19=HEAP32[(($18)>>2)];
 var $20=($19|0)==($current_ptr|0);
 if($20){label=8;break;}else{label=7;break;}
 case 7: 
 var $22=(($info+20)|0);
 var $23=HEAP32[(($22)>>2)];
 var $24=($23|0)==($current_ptr|0);
 if($24){label=8;break;}else{label=10;break;}
 case 8: 
 var $26=($path_below|0)==1;
 if($26){label=9;break;}else{label=14;break;}
 case 9: 
 var $28=(($info+32)|0);
 HEAP32[(($28)>>2)]=1;
 label=14;break;
 case 10: 
 var $30=(($info+32)|0);
 HEAP32[(($30)>>2)]=$path_below;
 HEAP32[(($22)>>2)]=$current_ptr;
 var $31=(($info+40)|0);
 var $32=HEAP32[(($31)>>2)];
 var $33=((($32)+(1))|0);
 HEAP32[(($31)>>2)]=$33;
 var $34=(($info+36)|0);
 var $35=HEAP32[(($34)>>2)];
 var $36=($35|0)==1;
 if($36){label=11;break;}else{label=13;break;}
 case 11: 
 var $38=(($info+24)|0);
 var $39=HEAP32[(($38)>>2)];
 var $40=($39|0)==2;
 if($40){label=12;break;}else{label=13;break;}
 case 12: 
 var $42=(($info+54)|0);
 HEAP8[(($42)>>0)]=1;
 label=13;break;
 case 13: 
 var $44=(($info+44)|0);
 HEAP32[(($44)>>2)]=4;
 label=14;break;
 case 14: 
 return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($this,$info,$dst_ptr,$current_ptr,$path_below,$use_strcmp){
 var label=0;

 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1=(($this)|0);
 var $2=(($info+8)|0);
 var $3=HEAP32[(($2)>>2)];
 var $4=(($3)|0);
 var $5=($1|0)==($4|0);
 if($5){label=2;break;}else{label=12;break;}
 case 2: 
 var $7=(($info+53)|0);
 HEAP8[(($7)>>0)]=1;
 var $8=(($info+4)|0);
 var $9=HEAP32[(($8)>>2)];
 var $10=($9|0)==($current_ptr|0);
 if($10){label=3;break;}else{label=13;break;}
 case 3: 
 var $12=(($info+52)|0);
 HEAP8[(($12)>>0)]=1;
 var $13=(($info+16)|0);
 var $14=HEAP32[(($13)>>2)];
 var $15=($14|0)==0;
 if($15){label=4;break;}else{label=6;break;}
 case 4: 
 HEAP32[(($13)>>2)]=$dst_ptr;
 var $17=(($info+24)|0);
 HEAP32[(($17)>>2)]=$path_below;
 var $18=(($info+36)|0);
 HEAP32[(($18)>>2)]=1;
 var $19=(($info+48)|0);
 var $20=HEAP32[(($19)>>2)];
 var $21=($20|0)==1;
 var $22=($path_below|0)==1;
 var $or_cond_i=$21&$22;
 if($or_cond_i){label=5;break;}else{label=13;break;}
 case 5: 
 var $24=(($info+54)|0);
 HEAP8[(($24)>>0)]=1;
 label=13;break;
 case 6: 
 var $26=($14|0)==($dst_ptr|0);
 if($26){label=7;break;}else{label=11;break;}
 case 7: 
 var $28=(($info+24)|0);
 var $29=HEAP32[(($28)>>2)];
 var $30=($29|0)==2;
 if($30){label=8;break;}else{var $33=$29;label=9;break;}
 case 8: 
 HEAP32[(($28)>>2)]=$path_below;
 var $33=$path_below;label=9;break;
 case 9: 
 var $33;
 var $34=(($info+48)|0);
 var $35=HEAP32[(($34)>>2)];
 var $36=($35|0)==1;
 var $37=($33|0)==1;
 var $or_cond1_i=$36&$37;
 if($or_cond1_i){label=10;break;}else{label=13;break;}
 case 10: 
 var $39=(($info+54)|0);
 HEAP8[(($39)>>0)]=1;
 label=13;break;
 case 11: 
 var $41=(($info+36)|0);
 var $42=HEAP32[(($41)>>2)];
 var $43=((($42)+(1))|0);
 HEAP32[(($41)>>2)]=$43;
 var $44=(($info+54)|0);
 HEAP8[(($44)>>0)]=1;
 label=13;break;
 case 12: 
 var $46=(($this+8)|0);
 var $47=HEAP32[(($46)>>2)];
 var $48=$47;
 var $49=HEAP32[(($48)>>2)];
 var $50=(($49+20)|0);
 var $51=HEAP32[(($50)>>2)];
 FUNCTION_TABLE[$51]($47,$info,$dst_ptr,$current_ptr,$path_below,$use_strcmp);
 label=13;break;
 case 13: 
 return;
  default: assert(0, "bad label: " + label);
 }

}


function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib($this,$info,$dst_ptr,$current_ptr,$path_below,$use_strcmp){
 var label=0;

 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1=(($info+8)|0);
 var $2=HEAP32[(($1)>>2)];
 var $3=($2|0)==($this|0);
 if($3){label=2;break;}else{label=12;break;}
 case 2: 
 var $5=(($info+53)|0);
 HEAP8[(($5)>>0)]=1;
 var $6=(($info+4)|0);
 var $7=HEAP32[(($6)>>2)];
 var $8=($7|0)==($current_ptr|0);
 if($8){label=3;break;}else{label=12;break;}
 case 3: 
 var $10=(($info+52)|0);
 HEAP8[(($10)>>0)]=1;
 var $11=(($info+16)|0);
 var $12=HEAP32[(($11)>>2)];
 var $13=($12|0)==0;
 if($13){label=4;break;}else{label=6;break;}
 case 4: 
 HEAP32[(($11)>>2)]=$dst_ptr;
 var $15=(($info+24)|0);
 HEAP32[(($15)>>2)]=$path_below;
 var $16=(($info+36)|0);
 HEAP32[(($16)>>2)]=1;
 var $17=(($info+48)|0);
 var $18=HEAP32[(($17)>>2)];
 var $19=($18|0)==1;
 var $20=($path_below|0)==1;
 var $or_cond_i=$19&$20;
 if($or_cond_i){label=5;break;}else{label=12;break;}
 case 5: 
 var $22=(($info+54)|0);
 HEAP8[(($22)>>0)]=1;
 label=12;break;
 case 6: 
 var $24=($12|0)==($dst_ptr|0);
 if($24){label=7;break;}else{label=11;break;}
 case 7: 
 var $26=(($info+24)|0);
 var $27=HEAP32[(($26)>>2)];
 var $28=($27|0)==2;
 if($28){label=8;break;}else{var $31=$27;label=9;break;}
 case 8: 
 HEAP32[(($26)>>2)]=$path_below;
 var $31=$path_below;label=9;break;
 case 9: 
 var $31;
 var $32=(($info+48)|0);
 var $33=HEAP32[(($32)>>2)];
 var $34=($33|0)==1;
 var $35=($31|0)==1;
 var $or_cond1_i=$34&$35;
 if($or_cond1_i){label=10;break;}else{label=12;break;}
 case 10: 
 var $37=(($info+54)|0);
 HEAP8[(($37)>>0)]=1;
 label=12;break;
 case 11: 
 var $39=(($info+36)|0);
 var $40=HEAP32[(($39)>>2)];
 var $41=((($40)+(1))|0);
 HEAP32[(($39)>>2)]=$41;
 var $42=(($info+54)|0);
 HEAP8[(($42)>>0)]=1;
 label=12;break;
 case 12: 
 return;
  default: assert(0, "bad label: " + label);
 }

}


function _malloc($bytes){
 var label=0;

 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1=($bytes>>>0)<245;
 if($1){label=2;break;}else{label=78;break;}
 case 2: 
 var $3=($bytes>>>0)<11;
 if($3){var $8=16;label=4;break;}else{label=3;break;}
 case 3: 
 var $5=((($bytes)+(11))|0);
 var $6=$5&-8;
 var $8=$6;label=4;break;
 case 4: 
 var $8;
 var $9=$8>>>3;
 var $10=HEAP32[((4096)>>2)];
 var $11=$10>>>($9>>>0);
 var $12=$11&3;
 var $13=($12|0)==0;
 if($13){label=12;break;}else{label=5;break;}
 case 5: 
 var $15=$11&1;
 var $16=$15^1;
 var $17=((($16)+($9))|0);
 var $18=$17<<1;
 var $19=((4136+($18<<2))|0);
 var $20=$19;
 var $_sum11=((($18)+(2))|0);
 var $21=((4136+($_sum11<<2))|0);
 var $22=HEAP32[(($21)>>2)];
 var $23=(($22+8)|0);
 var $24=HEAP32[(($23)>>2)];
 var $25=($20|0)==($24|0);
 if($25){label=6;break;}else{label=7;break;}
 case 6: 
 var $27=1<<$17;
 var $28=$27^-1;
 var $29=$10&$28;
 HEAP32[((4096)>>2)]=$29;
 label=11;break;
 case 7: 
 var $31=$24;
 var $32=HEAP32[((4112)>>2)];
 var $33=($31>>>0)<($32>>>0);
 if($33){label=10;break;}else{label=8;break;}
 case 8: 
 var $35=(($24+12)|0);
 var $36=HEAP32[(($35)>>2)];
 var $37=($36|0)==($22|0);
 if($37){label=9;break;}else{label=10;break;}
 case 9: 
 HEAP32[(($35)>>2)]=$20;
 HEAP32[(($21)>>2)]=$24;
 label=11;break;
 case 10: 
 _abort();
 throw "Reached an unreachable!";
 case 11: 
 var $40=$17<<3;
 var $41=$40|3;
 var $42=(($22+4)|0);
 HEAP32[(($42)>>2)]=$41;
 var $43=$22;
 var $_sum1314=$40|4;
 var $44=(($43+$_sum1314)|0);
 var $45=$44;
 var $46=HEAP32[(($45)>>2)];
 var $47=$46|1;
 HEAP32[(($45)>>2)]=$47;
 var $48=$23;
 var $mem_0=$48;label=344;break;
 case 12: 
 var $50=HEAP32[((4104)>>2)];
 var $51=($8>>>0)>($50>>>0);
 if($51){label=13;break;}else{var $nb_0=$8;label=161;break;}
 case 13: 
 var $53=($11|0)==0;
 if($53){label=27;break;}else{label=14;break;}
 case 14: 
 var $55=$11<<$9;
 var $56=2<<$9;
 var $57=(((-$56))|0);
 var $58=$56|$57;
 var $59=$55&$58;
 var $60=(((-$59))|0);
 var $61=$59&$60;
 var $62=((($61)-(1))|0);
 var $63=$62>>>12;
 var $64=$63&16;
 var $65=$62>>>($64>>>0);
 var $66=$65>>>5;
 var $67=$66&8;
 var $68=$67|$64;
 var $69=$65>>>($67>>>0);
 var $70=$69>>>2;
 var $71=$70&4;
 var $72=$68|$71;
 var $73=$69>>>($71>>>0);
 var $74=$73>>>1;
 var $75=$74&2;
 var $76=$72|$75;
 var $77=$73>>>($75>>>0);
 var $78=$77>>>1;
 var $79=$78&1;
 var $80=$76|$79;
 var $81=$77>>>($79>>>0);
 var $82=((($80)+($81))|0);
 var $83=$82<<1;
 var $84=((4136+($83<<2))|0);
 var $85=$84;
 var $_sum4=((($83)+(2))|0);
 var $86=((4136+($_sum4<<2))|0);
 var $87=HEAP32[(($86)>>2)];
 var $88=(($87+8)|0);
 var $89=HEAP32[(($88)>>2)];
 var $90=($85|0)==($89|0);
 if($90){label=15;break;}else{label=16;break;}
 case 15: 
 var $92=1<<$82;
 var $93=$92^-1;
 var $94=$10&$93;
 HEAP32[((4096)>>2)]=$94;
 label=20;break;
 case 16: 
 var $96=$89;
 var $97=HEAP32[((4112)>>2)];
 var $98=($96>>>0)<($97>>>0);
 if($98){label=19;break;}else{label=17;break;}
 case 17: 
 var $100=(($89+12)|0);
 var $101=HEAP32[(($100)>>2)];
 var $102=($101|0)==($87|0);
 if($102){label=18;break;}else{label=19;break;}
 case 18: 
 HEAP32[(($100)>>2)]=$85;
 HEAP32[(($86)>>2)]=$89;
 label=20;break;
 case 19: 
 _abort();
 throw "Reached an unreachable!";
 case 20: 
 var $105=$82<<3;
 var $106=((($105)-($8))|0);
 var $107=$8|3;
 var $108=(($87+4)|0);
 HEAP32[(($108)>>2)]=$107;
 var $109=$87;
 var $110=(($109+$8)|0);
 var $111=$110;
 var $112=$106|1;
 var $_sum67=$8|4;
 var $113=(($109+$_sum67)|0);
 var $114=$113;
 HEAP32[(($114)>>2)]=$112;
 var $115=(($109+$105)|0);
 var $116=$115;
 HEAP32[(($116)>>2)]=$106;
 var $117=HEAP32[((4104)>>2)];
 var $118=($117|0)==0;
 if($118){label=26;break;}else{label=21;break;}
 case 21: 
 var $120=HEAP32[((4116)>>2)];
 var $121=$117>>>3;
 var $122=$121<<1;
 var $123=((4136+($122<<2))|0);
 var $124=$123;
 var $125=HEAP32[((4096)>>2)];
 var $126=1<<$121;
 var $127=$125&$126;
 var $128=($127|0)==0;
 if($128){label=22;break;}else{label=23;break;}
 case 22: 
 var $130=$125|$126;
 HEAP32[((4096)>>2)]=$130;
 var $_sum9_pre=((($122)+(2))|0);
 var $_pre=((4136+($_sum9_pre<<2))|0);
 var $F4_0=$124;var $_pre_phi=$_pre;label=25;break;
 case 23: 
 var $_sum10=((($122)+(2))|0);
 var $132=((4136+($_sum10<<2))|0);
 var $133=HEAP32[(($132)>>2)];
 var $134=$133;
 var $135=HEAP32[((4112)>>2)];
 var $136=($134>>>0)<($135>>>0);
 if($136){label=24;break;}else{var $F4_0=$133;var $_pre_phi=$132;label=25;break;}
 case 24: 
 _abort();
 throw "Reached an unreachable!";
 case 25: 
 var $_pre_phi;
 var $F4_0;
 HEAP32[(($_pre_phi)>>2)]=$120;
 var $139=(($F4_0+12)|0);
 HEAP32[(($139)>>2)]=$120;
 var $140=(($120+8)|0);
 HEAP32[(($140)>>2)]=$F4_0;
 var $141=(($120+12)|0);
 HEAP32[(($141)>>2)]=$124;
 label=26;break;
 case 26: 
 HEAP32[((4104)>>2)]=$106;
 HEAP32[((4116)>>2)]=$111;
 var $143=$88;
 var $mem_0=$143;label=344;break;
 case 27: 
 var $145=HEAP32[((4100)>>2)];
 var $146=($145|0)==0;
 if($146){var $nb_0=$8;label=161;break;}else{label=28;break;}
 case 28: 
 var $148=(((-$145))|0);
 var $149=$145&$148;
 var $150=((($149)-(1))|0);
 var $151=$150>>>12;
 var $152=$151&16;
 var $153=$150>>>($152>>>0);
 var $154=$153>>>5;
 var $155=$154&8;
 var $156=$155|$152;
 var $157=$153>>>($155>>>0);
 var $158=$157>>>2;
 var $159=$158&4;
 var $160=$156|$159;
 var $161=$157>>>($159>>>0);
 var $162=$161>>>1;
 var $163=$162&2;
 var $164=$160|$163;
 var $165=$161>>>($163>>>0);
 var $166=$165>>>1;
 var $167=$166&1;
 var $168=$164|$167;
 var $169=$165>>>($167>>>0);
 var $170=((($168)+($169))|0);
 var $171=((4400+($170<<2))|0);
 var $172=HEAP32[(($171)>>2)];
 var $173=(($172+4)|0);
 var $174=HEAP32[(($173)>>2)];
 var $175=$174&-8;
 var $176=((($175)-($8))|0);
 var $t_0_i=$172;var $v_0_i=$172;var $rsize_0_i=$176;label=29;break;
 case 29: 
 var $rsize_0_i;
 var $v_0_i;
 var $t_0_i;
 var $178=(($t_0_i+16)|0);
 var $179=HEAP32[(($178)>>2)];
 var $180=($179|0)==0;
 if($180){label=30;break;}else{var $185=$179;label=31;break;}
 case 30: 
 var $182=(($t_0_i+20)|0);
 var $183=HEAP32[(($182)>>2)];
 var $184=($183|0)==0;
 if($184){label=32;break;}else{var $185=$183;label=31;break;}
 case 31: 
 var $185;
 var $186=(($185+4)|0);
 var $187=HEAP32[(($186)>>2)];
 var $188=$187&-8;
 var $189=((($188)-($8))|0);
 var $190=($189>>>0)<($rsize_0_i>>>0);
 var $_rsize_0_i=($190?$189:$rsize_0_i);
 var $_v_0_i=($190?$185:$v_0_i);
 var $t_0_i=$185;var $v_0_i=$_v_0_i;var $rsize_0_i=$_rsize_0_i;label=29;break;
 case 32: 
 var $192=$v_0_i;
 var $193=HEAP32[((4112)>>2)];
 var $194=($192>>>0)<($193>>>0);
 if($194){label=76;break;}else{label=33;break;}
 case 33: 
 var $196=(($192+$8)|0);
 var $197=$196;
 var $198=($192>>>0)<($196>>>0);
 if($198){label=34;break;}else{label=76;break;}
 case 34: 
 var $200=(($v_0_i+24)|0);
 var $201=HEAP32[(($200)>>2)];
 var $202=(($v_0_i+12)|0);
 var $203=HEAP32[(($202)>>2)];
 var $204=($203|0)==($v_0_i|0);
 if($204){label=40;break;}else{label=35;break;}
 case 35: 
 var $206=(($v_0_i+8)|0);
 var $207=HEAP32[(($206)>>2)];
 var $208=$207;
 var $209=($208>>>0)<($193>>>0);
 if($209){label=39;break;}else{label=36;break;}
 case 36: 
 var $211=(($207+12)|0);
 var $212=HEAP32[(($211)>>2)];
 var $213=($212|0)==($v_0_i|0);
 if($213){label=37;break;}else{label=39;break;}
 case 37: 
 var $215=(($203+8)|0);
 var $216=HEAP32[(($215)>>2)];
 var $217=($216|0)==($v_0_i|0);
 if($217){label=38;break;}else{label=39;break;}
 case 38: 
 HEAP32[(($211)>>2)]=$203;
 HEAP32[(($215)>>2)]=$207;
 var $R_1_i=$203;label=47;break;
 case 39: 
 _abort();
 throw "Reached an unreachable!";
 case 40: 
 var $220=(($v_0_i+20)|0);
 var $221=HEAP32[(($220)>>2)];
 var $222=($221|0)==0;
 if($222){label=41;break;}else{var $R_0_i=$221;var $RP_0_i=$220;label=42;break;}
 case 41: 
 var $224=(($v_0_i+16)|0);
 var $225=HEAP32[(($224)>>2)];
 var $226=($225|0)==0;
 if($226){var $R_1_i=0;label=47;break;}else{var $R_0_i=$225;var $RP_0_i=$224;label=42;break;}
 case 42: 
 var $RP_0_i;
 var $R_0_i;
 var $227=(($R_0_i+20)|0);
 var $228=HEAP32[(($227)>>2)];
 var $229=($228|0)==0;
 if($229){label=43;break;}else{var $R_0_i=$228;var $RP_0_i=$227;label=42;break;}
 case 43: 
 var $231=(($R_0_i+16)|0);
 var $232=HEAP32[(($231)>>2)];
 var $233=($232|0)==0;
 if($233){label=44;break;}else{var $R_0_i=$232;var $RP_0_i=$231;label=42;break;}
 case 44: 
 var $235=$RP_0_i;
 var $236=($235>>>0)<($193>>>0);
 if($236){label=46;break;}else{label=45;break;}
 case 45: 
 HEAP32[(($RP_0_i)>>2)]=0;
 var $R_1_i=$R_0_i;label=47;break;
 case 46: 
 _abort();
 throw "Reached an unreachable!";
 case 47: 
 var $R_1_i;
 var $240=($201|0)==0;
 if($240){label=67;break;}else{label=48;break;}
 case 48: 
 var $242=(($v_0_i+28)|0);
 var $243=HEAP32[(($242)>>2)];
 var $244=((4400+($243<<2))|0);
 var $245=HEAP32[(($244)>>2)];
 var $246=($v_0_i|0)==($245|0);
 if($246){label=49;break;}else{label=51;break;}
 case 49: 
 HEAP32[(($244)>>2)]=$R_1_i;
 var $cond_i=($R_1_i|0)==0;
 if($cond_i){label=50;break;}else{label=57;break;}
 case 50: 
 var $248=1<<$243;
 var $249=$248^-1;
 var $250=HEAP32[((4100)>>2)];
 var $251=$250&$249;
 HEAP32[((4100)>>2)]=$251;
 label=67;break;
 case 51: 
 var $253=$201;
 var $254=HEAP32[((4112)>>2)];
 var $255=($253>>>0)<($254>>>0);
 if($255){label=55;break;}else{label=52;break;}
 case 52: 
 var $257=(($201+16)|0);
 var $258=HEAP32[(($257)>>2)];
 var $259=($258|0)==($v_0_i|0);
 if($259){label=53;break;}else{label=54;break;}
 case 53: 
 HEAP32[(($257)>>2)]=$R_1_i;
 label=56;break;
 case 54: 
 var $262=(($201+20)|0);
 HEAP32[(($262)>>2)]=$R_1_i;
 label=56;break;
 case 55: 
 _abort();
 throw "Reached an unreachable!";
 case 56: 
 var $265=($R_1_i|0)==0;
 if($265){label=67;break;}else{label=57;break;}
 case 57: 
 var $267=$R_1_i;
 var $268=HEAP32[((4112)>>2)];
 var $269=($267>>>0)<($268>>>0);
 if($269){label=66;break;}else{label=58;break;}
 case 58: 
 var $271=(($R_1_i+24)|0);
 HEAP32[(($271)>>2)]=$201;
 var $272=(($v_0_i+16)|0);
 var $273=HEAP32[(($272)>>2)];
 var $274=($273|0)==0;
 if($274){label=62;break;}else{label=59;break;}
 case 59: 
 var $276=$273;
 var $277=HEAP32[((4112)>>2)];
 var $278=($276>>>0)<($277>>>0);
 if($278){label=61;break;}else{label=60;break;}
 case 60: 
 var $280=(($R_1_i+16)|0);
 HEAP32[(($280)>>2)]=$273;
 var $281=(($273+24)|0);
 HEAP32[(($281)>>2)]=$R_1_i;
 label=62;break;
 case 61: 
 _abort();
 throw "Reached an unreachable!";
 case 62: 
 var $284=(($v_0_i+20)|0);
 var $285=HEAP32[(($284)>>2)];
 var $286=($285|0)==0;
 if($286){label=67;break;}else{label=63;break;}
 case 63: 
 var $288=$285;
 var $289=HEAP32[((4112)>>2)];
 var $290=($288>>>0)<($289>>>0);
 if($290){label=65;break;}else{label=64;break;}
 case 64: 
 var $292=(($R_1_i+20)|0);
 HEAP32[(($292)>>2)]=$285;
 var $293=(($285+24)|0);
 HEAP32[(($293)>>2)]=$R_1_i;
 label=67;break;
 case 65: 
 _abort();
 throw "Reached an unreachable!";
 case 66: 
 _abort();
 throw "Reached an unreachable!";
 case 67: 
 var $297=($rsize_0_i>>>0)<16;
 if($297){label=68;break;}else{label=69;break;}
 case 68: 
 var $299=((($rsize_0_i)+($8))|0);
 var $300=$299|3;
 var $301=(($v_0_i+4)|0);
 HEAP32[(($301)>>2)]=$300;
 var $_sum4_i=((($299)+(4))|0);
 var $302=(($192+$_sum4_i)|0);
 var $303=$302;
 var $304=HEAP32[(($303)>>2)];
 var $305=$304|1;
 HEAP32[(($303)>>2)]=$305;
 label=77;break;
 case 69: 
 var $307=$8|3;
 var $308=(($v_0_i+4)|0);
 HEAP32[(($308)>>2)]=$307;
 var $309=$rsize_0_i|1;
 var $_sum_i37=$8|4;
 var $310=(($192+$_sum_i37)|0);
 var $311=$310;
 HEAP32[(($311)>>2)]=$309;
 var $_sum1_i=((($rsize_0_i)+($8))|0);
 var $312=(($192+$_sum1_i)|0);
 var $313=$312;
 HEAP32[(($313)>>2)]=$rsize_0_i;
 var $314=HEAP32[((4104)>>2)];
 var $315=($314|0)==0;
 if($315){label=75;break;}else{label=70;break;}
 case 70: 
 var $317=HEAP32[((4116)>>2)];
 var $318=$314>>>3;
 var $319=$318<<1;
 var $320=((4136+($319<<2))|0);
 var $321=$320;
 var $322=HEAP32[((4096)>>2)];
 var $323=1<<$318;
 var $324=$322&$323;
 var $325=($324|0)==0;
 if($325){label=71;break;}else{label=72;break;}
 case 71: 
 var $327=$322|$323;
 HEAP32[((4096)>>2)]=$327;
 var $_sum2_pre_i=((($319)+(2))|0);
 var $_pre_i=((4136+($_sum2_pre_i<<2))|0);
 var $F1_0_i=$321;var $_pre_phi_i=$_pre_i;label=74;break;
 case 72: 
 var $_sum3_i=((($319)+(2))|0);
 var $329=((4136+($_sum3_i<<2))|0);
 var $330=HEAP32[(($329)>>2)];
 var $331=$330;
 var $332=HEAP32[((4112)>>2)];
 var $333=($331>>>0)<($332>>>0);
 if($333){label=73;break;}else{var $F1_0_i=$330;var $_pre_phi_i=$329;label=74;break;}
 case 73: 
 _abort();
 throw "Reached an unreachable!";
 case 74: 
 var $_pre_phi_i;
 var $F1_0_i;
 HEAP32[(($_pre_phi_i)>>2)]=$317;
 var $336=(($F1_0_i+12)|0);
 HEAP32[(($336)>>2)]=$317;
 var $337=(($317+8)|0);
 HEAP32[(($337)>>2)]=$F1_0_i;
 var $338=(($317+12)|0);
 HEAP32[(($338)>>2)]=$321;
 label=75;break;
 case 75: 
 HEAP32[((4104)>>2)]=$rsize_0_i;
 HEAP32[((4116)>>2)]=$197;
 label=77;break;
 case 76: 
 _abort();
 throw "Reached an unreachable!";
 case 77: 
 var $341=(($v_0_i+8)|0);
 var $342=$341;
 var $mem_0=$342;label=344;break;
 case 78: 
 var $344=($bytes>>>0)>4294967231;
 if($344){var $nb_0=-1;label=161;break;}else{label=79;break;}
 case 79: 
 var $346=((($bytes)+(11))|0);
 var $347=$346&-8;
 var $348=HEAP32[((4100)>>2)];
 var $349=($348|0)==0;
 if($349){var $nb_0=$347;label=161;break;}else{label=80;break;}
 case 80: 
 var $351=(((-$347))|0);
 var $352=$346>>>8;
 var $353=($352|0)==0;
 if($353){var $idx_0_i=0;label=83;break;}else{label=81;break;}
 case 81: 
 var $355=($347>>>0)>16777215;
 if($355){var $idx_0_i=31;label=83;break;}else{label=82;break;}
 case 82: 
 var $357=((($352)+(1048320))|0);
 var $358=$357>>>16;
 var $359=$358&8;
 var $360=$352<<$359;
 var $361=((($360)+(520192))|0);
 var $362=$361>>>16;
 var $363=$362&4;
 var $364=$363|$359;
 var $365=$360<<$363;
 var $366=((($365)+(245760))|0);
 var $367=$366>>>16;
 var $368=$367&2;
 var $369=$364|$368;
 var $370=(((14)-($369))|0);
 var $371=$365<<$368;
 var $372=$371>>>15;
 var $373=((($370)+($372))|0);
 var $374=$373<<1;
 var $375=((($373)+(7))|0);
 var $376=$347>>>($375>>>0);
 var $377=$376&1;
 var $378=$377|$374;
 var $idx_0_i=$378;label=83;break;
 case 83: 
 var $idx_0_i;
 var $380=((4400+($idx_0_i<<2))|0);
 var $381=HEAP32[(($380)>>2)];
 var $382=($381|0)==0;
 if($382){var $v_2_i=0;var $rsize_2_i=$351;var $t_1_i=0;label=90;break;}else{label=84;break;}
 case 84: 
 var $384=($idx_0_i|0)==31;
 if($384){var $389=0;label=86;break;}else{label=85;break;}
 case 85: 
 var $386=$idx_0_i>>>1;
 var $387=(((25)-($386))|0);
 var $389=$387;label=86;break;
 case 86: 
 var $389;
 var $390=$347<<$389;
 var $v_0_i18=0;var $rsize_0_i17=$351;var $t_0_i16=$381;var $sizebits_0_i=$390;var $rst_0_i=0;label=87;break;
 case 87: 
 var $rst_0_i;
 var $sizebits_0_i;
 var $t_0_i16;
 var $rsize_0_i17;
 var $v_0_i18;
 var $392=(($t_0_i16+4)|0);
 var $393=HEAP32[(($392)>>2)];
 var $394=$393&-8;
 var $395=((($394)-($347))|0);
 var $396=($395>>>0)<($rsize_0_i17>>>0);
 if($396){label=88;break;}else{var $v_1_i=$v_0_i18;var $rsize_1_i=$rsize_0_i17;label=89;break;}
 case 88: 
 var $398=($394|0)==($347|0);
 if($398){var $v_2_i=$t_0_i16;var $rsize_2_i=$395;var $t_1_i=$t_0_i16;label=90;break;}else{var $v_1_i=$t_0_i16;var $rsize_1_i=$395;label=89;break;}
 case 89: 
 var $rsize_1_i;
 var $v_1_i;
 var $400=(($t_0_i16+20)|0);
 var $401=HEAP32[(($400)>>2)];
 var $402=$sizebits_0_i>>>31;
 var $403=(($t_0_i16+16+($402<<2))|0);
 var $404=HEAP32[(($403)>>2)];
 var $405=($401|0)==0;
 var $406=($401|0)==($404|0);
 var $or_cond_i=$405|$406;
 var $rst_1_i=($or_cond_i?$rst_0_i:$401);
 var $407=($404|0)==0;
 var $408=$sizebits_0_i<<1;
 if($407){var $v_2_i=$v_1_i;var $rsize_2_i=$rsize_1_i;var $t_1_i=$rst_1_i;label=90;break;}else{var $v_0_i18=$v_1_i;var $rsize_0_i17=$rsize_1_i;var $t_0_i16=$404;var $sizebits_0_i=$408;var $rst_0_i=$rst_1_i;label=87;break;}
 case 90: 
 var $t_1_i;
 var $rsize_2_i;
 var $v_2_i;
 var $409=($t_1_i|0)==0;
 var $410=($v_2_i|0)==0;
 var $or_cond21_i=$409&$410;
 if($or_cond21_i){label=91;break;}else{var $t_2_ph_i=$t_1_i;label=93;break;}
 case 91: 
 var $412=2<<$idx_0_i;
 var $413=(((-$412))|0);
 var $414=$412|$413;
 var $415=$348&$414;
 var $416=($415|0)==0;
 if($416){var $nb_0=$347;label=161;break;}else{label=92;break;}
 case 92: 
 var $418=(((-$415))|0);
 var $419=$415&$418;
 var $420=((($419)-(1))|0);
 var $421=$420>>>12;
 var $422=$421&16;
 var $423=$420>>>($422>>>0);
 var $424=$423>>>5;
 var $425=$424&8;
 var $426=$425|$422;
 var $427=$423>>>($425>>>0);
 var $428=$427>>>2;
 var $429=$428&4;
 var $430=$426|$429;
 var $431=$427>>>($429>>>0);
 var $432=$431>>>1;
 var $433=$432&2;
 var $434=$430|$433;
 var $435=$431>>>($433>>>0);
 var $436=$435>>>1;
 var $437=$436&1;
 var $438=$434|$437;
 var $439=$435>>>($437>>>0);
 var $440=((($438)+($439))|0);
 var $441=((4400+($440<<2))|0);
 var $442=HEAP32[(($441)>>2)];
 var $t_2_ph_i=$442;label=93;break;
 case 93: 
 var $t_2_ph_i;
 var $443=($t_2_ph_i|0)==0;
 if($443){var $rsize_3_lcssa_i=$rsize_2_i;var $v_3_lcssa_i=$v_2_i;label=96;break;}else{var $t_230_i=$t_2_ph_i;var $rsize_331_i=$rsize_2_i;var $v_332_i=$v_2_i;label=94;break;}
 case 94: 
 var $v_332_i;
 var $rsize_331_i;
 var $t_230_i;
 var $444=(($t_230_i+4)|0);
 var $445=HEAP32[(($444)>>2)];
 var $446=$445&-8;
 var $447=((($446)-($347))|0);
 var $448=($447>>>0)<($rsize_331_i>>>0);
 var $_rsize_3_i=($448?$447:$rsize_331_i);
 var $t_2_v_3_i=($448?$t_230_i:$v_332_i);
 var $449=(($t_230_i+16)|0);
 var $450=HEAP32[(($449)>>2)];
 var $451=($450|0)==0;
 if($451){label=95;break;}else{var $t_230_i=$450;var $rsize_331_i=$_rsize_3_i;var $v_332_i=$t_2_v_3_i;label=94;break;}
 case 95: 
 var $452=(($t_230_i+20)|0);
 var $453=HEAP32[(($452)>>2)];
 var $454=($453|0)==0;
 if($454){var $rsize_3_lcssa_i=$_rsize_3_i;var $v_3_lcssa_i=$t_2_v_3_i;label=96;break;}else{var $t_230_i=$453;var $rsize_331_i=$_rsize_3_i;var $v_332_i=$t_2_v_3_i;label=94;break;}
 case 96: 
 var $v_3_lcssa_i;
 var $rsize_3_lcssa_i;
 var $455=($v_3_lcssa_i|0)==0;
 if($455){var $nb_0=$347;label=161;break;}else{label=97;break;}
 case 97: 
 var $457=HEAP32[((4104)>>2)];
 var $458=((($457)-($347))|0);
 var $459=($rsize_3_lcssa_i>>>0)<($458>>>0);
 if($459){label=98;break;}else{var $nb_0=$347;label=161;break;}
 case 98: 
 var $461=$v_3_lcssa_i;
 var $462=HEAP32[((4112)>>2)];
 var $463=($461>>>0)<($462>>>0);
 if($463){label=159;break;}else{label=99;break;}
 case 99: 
 var $465=(($461+$347)|0);
 var $466=$465;
 var $467=($461>>>0)<($465>>>0);
 if($467){label=100;break;}else{label=159;break;}
 case 100: 
 var $469=(($v_3_lcssa_i+24)|0);
 var $470=HEAP32[(($469)>>2)];
 var $471=(($v_3_lcssa_i+12)|0);
 var $472=HEAP32[(($471)>>2)];
 var $473=($472|0)==($v_3_lcssa_i|0);
 if($473){label=106;break;}else{label=101;break;}
 case 101: 
 var $475=(($v_3_lcssa_i+8)|0);
 var $476=HEAP32[(($475)>>2)];
 var $477=$476;
 var $478=($477>>>0)<($462>>>0);
 if($478){label=105;break;}else{label=102;break;}
 case 102: 
 var $480=(($476+12)|0);
 var $481=HEAP32[(($480)>>2)];
 var $482=($481|0)==($v_3_lcssa_i|0);
 if($482){label=103;break;}else{label=105;break;}
 case 103: 
 var $484=(($472+8)|0);
 var $485=HEAP32[(($484)>>2)];
 var $486=($485|0)==($v_3_lcssa_i|0);
 if($486){label=104;break;}else{label=105;break;}
 case 104: 
 HEAP32[(($480)>>2)]=$472;
 HEAP32[(($484)>>2)]=$476;
 var $R_1_i22=$472;label=113;break;
 case 105: 
 _abort();
 throw "Reached an unreachable!";
 case 106: 
 var $489=(($v_3_lcssa_i+20)|0);
 var $490=HEAP32[(($489)>>2)];
 var $491=($490|0)==0;
 if($491){label=107;break;}else{var $R_0_i20=$490;var $RP_0_i19=$489;label=108;break;}
 case 107: 
 var $493=(($v_3_lcssa_i+16)|0);
 var $494=HEAP32[(($493)>>2)];
 var $495=($494|0)==0;
 if($495){var $R_1_i22=0;label=113;break;}else{var $R_0_i20=$494;var $RP_0_i19=$493;label=108;break;}
 case 108: 
 var $RP_0_i19;
 var $R_0_i20;
 var $496=(($R_0_i20+20)|0);
 var $497=HEAP32[(($496)>>2)];
 var $498=($497|0)==0;
 if($498){label=109;break;}else{var $R_0_i20=$497;var $RP_0_i19=$496;label=108;break;}
 case 109: 
 var $500=(($R_0_i20+16)|0);
 var $501=HEAP32[(($500)>>2)];
 var $502=($501|0)==0;
 if($502){label=110;break;}else{var $R_0_i20=$501;var $RP_0_i19=$500;label=108;break;}
 case 110: 
 var $504=$RP_0_i19;
 var $505=($504>>>0)<($462>>>0);
 if($505){label=112;break;}else{label=111;break;}
 case 111: 
 HEAP32[(($RP_0_i19)>>2)]=0;
 var $R_1_i22=$R_0_i20;label=113;break;
 case 112: 
 _abort();
 throw "Reached an unreachable!";
 case 113: 
 var $R_1_i22;
 var $509=($470|0)==0;
 if($509){label=133;break;}else{label=114;break;}
 case 114: 
 var $511=(($v_3_lcssa_i+28)|0);
 var $512=HEAP32[(($511)>>2)];
 var $513=((4400+($512<<2))|0);
 var $514=HEAP32[(($513)>>2)];
 var $515=($v_3_lcssa_i|0)==($514|0);
 if($515){label=115;break;}else{label=117;break;}
 case 115: 
 HEAP32[(($513)>>2)]=$R_1_i22;
 var $cond_i23=($R_1_i22|0)==0;
 if($cond_i23){label=116;break;}else{label=123;break;}
 case 116: 
 var $517=1<<$512;
 var $518=$517^-1;
 var $519=HEAP32[((4100)>>2)];
 var $520=$519&$518;
 HEAP32[((4100)>>2)]=$520;
 label=133;break;
 case 117: 
 var $522=$470;
 var $523=HEAP32[((4112)>>2)];
 var $524=($522>>>0)<($523>>>0);
 if($524){label=121;break;}else{label=118;break;}
 case 118: 
 var $526=(($470+16)|0);
 var $527=HEAP32[(($526)>>2)];
 var $528=($527|0)==($v_3_lcssa_i|0);
 if($528){label=119;break;}else{label=120;break;}
 case 119: 
 HEAP32[(($526)>>2)]=$R_1_i22;
 label=122;break;
 case 120: 
 var $531=(($470+20)|0);
 HEAP32[(($531)>>2)]=$R_1_i22;
 label=122;break;
 case 121: 
 _abort();
 throw "Reached an unreachable!";
 case 122: 
 var $534=($R_1_i22|0)==0;
 if($534){label=133;break;}else{label=123;break;}
 case 123: 
 var $536=$R_1_i22;
 var $537=HEAP32[((4112)>>2)];
 var $538=($536>>>0)<($537>>>0);
 if($538){label=132;break;}else{label=124;break;}
 case 124: 
 var $540=(($R_1_i22+24)|0);
 HEAP32[(($540)>>2)]=$470;
 var $541=(($v_3_lcssa_i+16)|0);
 var $542=HEAP32[(($541)>>2)];
 var $543=($542|0)==0;
 if($543){label=128;break;}else{label=125;break;}
 case 125: 
 var $545=$542;
 var $546=HEAP32[((4112)>>2)];
 var $547=($545>>>0)<($546>>>0);
 if($547){label=127;break;}else{label=126;break;}
 case 126: 
 var $549=(($R_1_i22+16)|0);
 HEAP32[(($549)>>2)]=$542;
 var $550=(($542+24)|0);
 HEAP32[(($550)>>2)]=$R_1_i22;
 label=128;break;
 case 127: 
 _abort();
 throw "Reached an unreachable!";
 case 128: 
 var $553=(($v_3_lcssa_i+20)|0);
 var $554=HEAP32[(($553)>>2)];
 var $555=($554|0)==0;
 if($555){label=133;break;}else{label=129;break;}
 case 129: 
 var $557=$554;
 var $558=HEAP32[((4112)>>2)];
 var $559=($557>>>0)<($558>>>0);
 if($559){label=131;break;}else{label=130;break;}
 case 130: 
 var $561=(($R_1_i22+20)|0);
 HEAP32[(($561)>>2)]=$554;
 var $562=(($554+24)|0);
 HEAP32[(($562)>>2)]=$R_1_i22;
 label=133;break;
 case 131: 
 _abort();
 throw "Reached an unreachable!";
 case 132: 
 _abort();
 throw "Reached an unreachable!";
 case 133: 
 var $566=($rsize_3_lcssa_i>>>0)<16;
 if($566){label=134;break;}else{label=135;break;}
 case 134: 
 var $568=((($rsize_3_lcssa_i)+($347))|0);
 var $569=$568|3;
 var $570=(($v_3_lcssa_i+4)|0);
 HEAP32[(($570)>>2)]=$569;
 var $_sum19_i=((($568)+(4))|0);
 var $571=(($461+$_sum19_i)|0);
 var $572=$571;
 var $573=HEAP32[(($572)>>2)];
 var $574=$573|1;
 HEAP32[(($572)>>2)]=$574;
 label=160;break;
 case 135: 
 var $576=$347|3;
 var $577=(($v_3_lcssa_i+4)|0);
 HEAP32[(($577)>>2)]=$576;
 var $578=$rsize_3_lcssa_i|1;
 var $_sum_i2536=$347|4;
 var $579=(($461+$_sum_i2536)|0);
 var $580=$579;
 HEAP32[(($580)>>2)]=$578;
 var $_sum1_i26=((($rsize_3_lcssa_i)+($347))|0);
 var $581=(($461+$_sum1_i26)|0);
 var $582=$581;
 HEAP32[(($582)>>2)]=$rsize_3_lcssa_i;
 var $583=$rsize_3_lcssa_i>>>3;
 var $584=($rsize_3_lcssa_i>>>0)<256;
 if($584){label=136;break;}else{label=141;break;}
 case 136: 
 var $586=$583<<1;
 var $587=((4136+($586<<2))|0);
 var $588=$587;
 var $589=HEAP32[((4096)>>2)];
 var $590=1<<$583;
 var $591=$589&$590;
 var $592=($591|0)==0;
 if($592){label=137;break;}else{label=138;break;}
 case 137: 
 var $594=$589|$590;
 HEAP32[((4096)>>2)]=$594;
 var $_sum15_pre_i=((($586)+(2))|0);
 var $_pre_i27=((4136+($_sum15_pre_i<<2))|0);
 var $F5_0_i=$588;var $_pre_phi_i28=$_pre_i27;label=140;break;
 case 138: 
 var $_sum18_i=((($586)+(2))|0);
 var $596=((4136+($_sum18_i<<2))|0);
 var $597=HEAP32[(($596)>>2)];
 var $598=$597;
 var $599=HEAP32[((4112)>>2)];
 var $600=($598>>>0)<($599>>>0);
 if($600){label=139;break;}else{var $F5_0_i=$597;var $_pre_phi_i28=$596;label=140;break;}
 case 139: 
 _abort();
 throw "Reached an unreachable!";
 case 140: 
 var $_pre_phi_i28;
 var $F5_0_i;
 HEAP32[(($_pre_phi_i28)>>2)]=$466;
 var $603=(($F5_0_i+12)|0);
 HEAP32[(($603)>>2)]=$466;
 var $_sum16_i=((($347)+(8))|0);
 var $604=(($461+$_sum16_i)|0);
 var $605=$604;
 HEAP32[(($605)>>2)]=$F5_0_i;
 var $_sum17_i=((($347)+(12))|0);
 var $606=(($461+$_sum17_i)|0);
 var $607=$606;
 HEAP32[(($607)>>2)]=$588;
 label=160;break;
 case 141: 
 var $609=$465;
 var $610=$rsize_3_lcssa_i>>>8;
 var $611=($610|0)==0;
 if($611){var $I7_0_i=0;label=144;break;}else{label=142;break;}
 case 142: 
 var $613=($rsize_3_lcssa_i>>>0)>16777215;
 if($613){var $I7_0_i=31;label=144;break;}else{label=143;break;}
 case 143: 
 var $615=((($610)+(1048320))|0);
 var $616=$615>>>16;
 var $617=$616&8;
 var $618=$610<<$617;
 var $619=((($618)+(520192))|0);
 var $620=$619>>>16;
 var $621=$620&4;
 var $622=$621|$617;
 var $623=$618<<$621;
 var $624=((($623)+(245760))|0);
 var $625=$624>>>16;
 var $626=$625&2;
 var $627=$622|$626;
 var $628=(((14)-($627))|0);
 var $629=$623<<$626;
 var $630=$629>>>15;
 var $631=((($628)+($630))|0);
 var $632=$631<<1;
 var $633=((($631)+(7))|0);
 var $634=$rsize_3_lcssa_i>>>($633>>>0);
 var $635=$634&1;
 var $636=$635|$632;
 var $I7_0_i=$636;label=144;break;
 case 144: 
 var $I7_0_i;
 var $638=((4400+($I7_0_i<<2))|0);
 var $_sum2_i=((($347)+(28))|0);
 var $639=(($461+$_sum2_i)|0);
 var $640=$639;
 HEAP32[(($640)>>2)]=$I7_0_i;
 var $_sum3_i29=((($347)+(16))|0);
 var $641=(($461+$_sum3_i29)|0);
 var $_sum4_i30=((($347)+(20))|0);
 var $642=(($461+$_sum4_i30)|0);
 var $643=$642;
 HEAP32[(($643)>>2)]=0;
 var $644=$641;
 HEAP32[(($644)>>2)]=0;
 var $645=HEAP32[((4100)>>2)];
 var $646=1<<$I7_0_i;
 var $647=$645&$646;
 var $648=($647|0)==0;
 if($648){label=145;break;}else{label=146;break;}
 case 145: 
 var $650=$645|$646;
 HEAP32[((4100)>>2)]=$650;
 HEAP32[(($638)>>2)]=$609;
 var $651=$638;
 var $_sum5_i=((($347)+(24))|0);
 var $652=(($461+$_sum5_i)|0);
 var $653=$652;
 HEAP32[(($653)>>2)]=$651;
 var $_sum6_i=((($347)+(12))|0);
 var $654=(($461+$_sum6_i)|0);
 var $655=$654;
 HEAP32[(($655)>>2)]=$609;
 var $_sum7_i=((($347)+(8))|0);
 var $656=(($461+$_sum7_i)|0);
 var $657=$656;
 HEAP32[(($657)>>2)]=$609;
 label=160;break;
 case 146: 
 var $659=HEAP32[(($638)>>2)];
 var $660=($I7_0_i|0)==31;
 if($660){var $665=0;label=148;break;}else{label=147;break;}
 case 147: 
 var $662=$I7_0_i>>>1;
 var $663=(((25)-($662))|0);
 var $665=$663;label=148;break;
 case 148: 
 var $665;
 var $666=(($659+4)|0);
 var $667=HEAP32[(($666)>>2)];
 var $668=$667&-8;
 var $669=($668|0)==($rsize_3_lcssa_i|0);
 if($669){var $T_0_lcssa_i=$659;label=155;break;}else{label=149;break;}
 case 149: 
 var $670=$rsize_3_lcssa_i<<$665;
 var $T_026_i=$659;var $K12_027_i=$670;label=151;break;
 case 150: 
 var $672=$K12_027_i<<1;
 var $673=(($680+4)|0);
 var $674=HEAP32[(($673)>>2)];
 var $675=$674&-8;
 var $676=($675|0)==($rsize_3_lcssa_i|0);
 if($676){var $T_0_lcssa_i=$680;label=155;break;}else{var $T_026_i=$680;var $K12_027_i=$672;label=151;break;}
 case 151: 
 var $K12_027_i;
 var $T_026_i;
 var $678=$K12_027_i>>>31;
 var $679=(($T_026_i+16+($678<<2))|0);
 var $680=HEAP32[(($679)>>2)];
 var $681=($680|0)==0;
 if($681){label=152;break;}else{label=150;break;}
 case 152: 
 var $683=$679;
 var $684=HEAP32[((4112)>>2)];
 var $685=($683>>>0)<($684>>>0);
 if($685){label=154;break;}else{label=153;break;}
 case 153: 
 HEAP32[(($679)>>2)]=$609;
 var $_sum12_i=((($347)+(24))|0);
 var $687=(($461+$_sum12_i)|0);
 var $688=$687;
 HEAP32[(($688)>>2)]=$T_026_i;
 var $_sum13_i=((($347)+(12))|0);
 var $689=(($461+$_sum13_i)|0);
 var $690=$689;
 HEAP32[(($690)>>2)]=$609;
 var $_sum14_i=((($347)+(8))|0);
 var $691=(($461+$_sum14_i)|0);
 var $692=$691;
 HEAP32[(($692)>>2)]=$609;
 label=160;break;
 case 154: 
 _abort();
 throw "Reached an unreachable!";
 case 155: 
 var $T_0_lcssa_i;
 var $694=(($T_0_lcssa_i+8)|0);
 var $695=HEAP32[(($694)>>2)];
 var $696=$T_0_lcssa_i;
 var $697=HEAP32[((4112)>>2)];
 var $698=($696>>>0)<($697>>>0);
 if($698){label=158;break;}else{label=156;break;}
 case 156: 
 var $700=$695;
 var $701=($700>>>0)<($697>>>0);
 if($701){label=158;break;}else{label=157;break;}
 case 157: 
 var $703=(($695+12)|0);
 HEAP32[(($703)>>2)]=$609;
 HEAP32[(($694)>>2)]=$609;
 var $_sum9_i=((($347)+(8))|0);
 var $704=(($461+$_sum9_i)|0);
 var $705=$704;
 HEAP32[(($705)>>2)]=$695;
 var $_sum10_i=((($347)+(12))|0);
 var $706=(($461+$_sum10_i)|0);
 var $707=$706;
 HEAP32[(($707)>>2)]=$T_0_lcssa_i;
 var $_sum11_i=((($347)+(24))|0);
 var $708=(($461+$_sum11_i)|0);
 var $709=$708;
 HEAP32[(($709)>>2)]=0;
 label=160;break;
 case 158: 
 _abort();
 throw "Reached an unreachable!";
 case 159: 
 _abort();
 throw "Reached an unreachable!";
 case 160: 
 var $711=(($v_3_lcssa_i+8)|0);
 var $712=$711;
 var $mem_0=$712;label=344;break;
 case 161: 
 var $nb_0;
 var $713=HEAP32[((4104)>>2)];
 var $714=($nb_0>>>0)>($713>>>0);
 if($714){label=166;break;}else{label=162;break;}
 case 162: 
 var $716=((($713)-($nb_0))|0);
 var $717=HEAP32[((4116)>>2)];
 var $718=($716>>>0)>15;
 if($718){label=163;break;}else{label=164;break;}
 case 163: 
 var $720=$717;
 var $721=(($720+$nb_0)|0);
 var $722=$721;
 HEAP32[((4116)>>2)]=$722;
 HEAP32[((4104)>>2)]=$716;
 var $723=$716|1;
 var $_sum2=((($nb_0)+(4))|0);
 var $724=(($720+$_sum2)|0);
 var $725=$724;
 HEAP32[(($725)>>2)]=$723;
 var $726=(($720+$713)|0);
 var $727=$726;
 HEAP32[(($727)>>2)]=$716;
 var $728=$nb_0|3;
 var $729=(($717+4)|0);
 HEAP32[(($729)>>2)]=$728;
 label=165;break;
 case 164: 
 HEAP32[((4104)>>2)]=0;
 HEAP32[((4116)>>2)]=0;
 var $731=$713|3;
 var $732=(($717+4)|0);
 HEAP32[(($732)>>2)]=$731;
 var $733=$717;
 var $_sum1=((($713)+(4))|0);
 var $734=(($733+$_sum1)|0);
 var $735=$734;
 var $736=HEAP32[(($735)>>2)];
 var $737=$736|1;
 HEAP32[(($735)>>2)]=$737;
 label=165;break;
 case 165: 
 var $739=(($717+8)|0);
 var $740=$739;
 var $mem_0=$740;label=344;break;
 case 166: 
 var $742=HEAP32[((4108)>>2)];
 var $743=($nb_0>>>0)<($742>>>0);
 if($743){label=167;break;}else{label=168;break;}
 case 167: 
 var $745=((($742)-($nb_0))|0);
 HEAP32[((4108)>>2)]=$745;
 var $746=HEAP32[((4120)>>2)];
 var $747=$746;
 var $748=(($747+$nb_0)|0);
 var $749=$748;
 HEAP32[((4120)>>2)]=$749;
 var $750=$745|1;
 var $_sum=((($nb_0)+(4))|0);
 var $751=(($747+$_sum)|0);
 var $752=$751;
 HEAP32[(($752)>>2)]=$750;
 var $753=$nb_0|3;
 var $754=(($746+4)|0);
 HEAP32[(($754)>>2)]=$753;
 var $755=(($746+8)|0);
 var $756=$755;
 var $mem_0=$756;label=344;break;
 case 168: 
 var $758=HEAP32[((4072)>>2)];
 var $759=($758|0)==0;
 if($759){label=169;break;}else{label=172;break;}
 case 169: 
 var $761=_sysconf(30);
 var $762=((($761)-(1))|0);
 var $763=$762&$761;
 var $764=($763|0)==0;
 if($764){label=171;break;}else{label=170;break;}
 case 170: 
 _abort();
 throw "Reached an unreachable!";
 case 171: 
 HEAP32[((4080)>>2)]=$761;
 HEAP32[((4076)>>2)]=$761;
 HEAP32[((4084)>>2)]=-1;
 HEAP32[((4088)>>2)]=-1;
 HEAP32[((4092)>>2)]=0;
 HEAP32[((4540)>>2)]=0;
 var $766=_time(0);
 var $767=$766&-16;
 var $768=$767^1431655768;
 HEAP32[((4072)>>2)]=$768;
 label=172;break;
 case 172: 
 var $770=((($nb_0)+(48))|0);
 var $771=HEAP32[((4080)>>2)];
 var $772=((($nb_0)+(47))|0);
 var $773=((($771)+($772))|0);
 var $774=(((-$771))|0);
 var $775=$773&$774;
 var $776=($775>>>0)>($nb_0>>>0);
 if($776){label=173;break;}else{var $mem_0=0;label=344;break;}
 case 173: 
 var $778=HEAP32[((4536)>>2)];
 var $779=($778|0)==0;
 if($779){label=175;break;}else{label=174;break;}
 case 174: 
 var $781=HEAP32[((4528)>>2)];
 var $782=((($781)+($775))|0);
 var $783=($782>>>0)<=($781>>>0);
 var $784=($782>>>0)>($778>>>0);
 var $or_cond1_i=$783|$784;
 if($or_cond1_i){var $mem_0=0;label=344;break;}else{label=175;break;}
 case 175: 
 var $786=HEAP32[((4540)>>2)];
 var $787=$786&4;
 var $788=($787|0)==0;
 if($788){label=176;break;}else{var $tsize_1_i=0;label=199;break;}
 case 176: 
 var $790=HEAP32[((4120)>>2)];
 var $791=($790|0)==0;
 if($791){label=182;break;}else{label=177;break;}
 case 177: 
 var $793=$790;
 var $sp_0_i_i=4544;label=178;break;
 case 178: 
 var $sp_0_i_i;
 var $795=(($sp_0_i_i)|0);
 var $796=HEAP32[(($795)>>2)];
 var $797=($796>>>0)>($793>>>0);
 if($797){label=180;break;}else{label=179;break;}
 case 179: 
 var $799=(($sp_0_i_i+4)|0);
 var $800=HEAP32[(($799)>>2)];
 var $801=(($796+$800)|0);
 var $802=($801>>>0)>($793>>>0);
 if($802){label=181;break;}else{label=180;break;}
 case 180: 
 var $804=(($sp_0_i_i+8)|0);
 var $805=HEAP32[(($804)>>2)];
 var $806=($805|0)==0;
 if($806){label=182;break;}else{var $sp_0_i_i=$805;label=178;break;}
 case 181: 
 var $807=($sp_0_i_i|0)==0;
 if($807){label=182;break;}else{label=189;break;}
 case 182: 
 var $808=_sbrk(0);
 var $809=($808|0)==-1;
 if($809){var $tsize_0323841_i=0;label=198;break;}else{label=183;break;}
 case 183: 
 var $811=$808;
 var $812=HEAP32[((4076)>>2)];
 var $813=((($812)-(1))|0);
 var $814=$813&$811;
 var $815=($814|0)==0;
 if($815){var $ssize_0_i=$775;label=185;break;}else{label=184;break;}
 case 184: 
 var $817=((($813)+($811))|0);
 var $818=(((-$812))|0);
 var $819=$817&$818;
 var $820=((($775)-($811))|0);
 var $821=((($820)+($819))|0);
 var $ssize_0_i=$821;label=185;break;
 case 185: 
 var $ssize_0_i;
 var $823=HEAP32[((4528)>>2)];
 var $824=((($823)+($ssize_0_i))|0);
 var $825=($ssize_0_i>>>0)>($nb_0>>>0);
 var $826=($ssize_0_i>>>0)<2147483647;
 var $or_cond_i31=$825&$826;
 if($or_cond_i31){label=186;break;}else{var $tsize_0323841_i=0;label=198;break;}
 case 186: 
 var $828=HEAP32[((4536)>>2)];
 var $829=($828|0)==0;
 if($829){label=188;break;}else{label=187;break;}
 case 187: 
 var $831=($824>>>0)<=($823>>>0);
 var $832=($824>>>0)>($828>>>0);
 var $or_cond2_i=$831|$832;
 if($or_cond2_i){var $tsize_0323841_i=0;label=198;break;}else{label=188;break;}
 case 188: 
 var $834=_sbrk($ssize_0_i);
 var $835=($834|0)==($808|0);
 var $ssize_0__i=($835?$ssize_0_i:0);
 var $__i=($835?$808:-1);
 var $tbase_0_i=$__i;var $tsize_0_i=$ssize_0__i;var $br_0_i=$834;var $ssize_1_i=$ssize_0_i;label=191;break;
 case 189: 
 var $837=HEAP32[((4108)>>2)];
 var $838=((($773)-($837))|0);
 var $839=$838&$774;
 var $840=($839>>>0)<2147483647;
 if($840){label=190;break;}else{var $tsize_0323841_i=0;label=198;break;}
 case 190: 
 var $842=_sbrk($839);
 var $843=HEAP32[(($795)>>2)];
 var $844=HEAP32[(($799)>>2)];
 var $845=(($843+$844)|0);
 var $846=($842|0)==($845|0);
 var $_3_i=($846?$839:0);
 var $_4_i=($846?$842:-1);
 var $tbase_0_i=$_4_i;var $tsize_0_i=$_3_i;var $br_0_i=$842;var $ssize_1_i=$839;label=191;break;
 case 191: 
 var $ssize_1_i;
 var $br_0_i;
 var $tsize_0_i;
 var $tbase_0_i;
 var $848=(((-$ssize_1_i))|0);
 var $849=($tbase_0_i|0)==-1;
 if($849){label=192;break;}else{var $tsize_246_i=$tsize_0_i;var $tbase_247_i=$tbase_0_i;label=202;break;}
 case 192: 
 var $851=($br_0_i|0)!=-1;
 var $852=($ssize_1_i>>>0)<2147483647;
 var $or_cond5_i=$851&$852;
 var $853=($ssize_1_i>>>0)<($770>>>0);
 var $or_cond6_i=$or_cond5_i&$853;
 if($or_cond6_i){label=193;break;}else{var $ssize_2_i=$ssize_1_i;label=197;break;}
 case 193: 
 var $855=HEAP32[((4080)>>2)];
 var $856=((($772)-($ssize_1_i))|0);
 var $857=((($856)+($855))|0);
 var $858=(((-$855))|0);
 var $859=$857&$858;
 var $860=($859>>>0)<2147483647;
 if($860){label=194;break;}else{var $ssize_2_i=$ssize_1_i;label=197;break;}
 case 194: 
 var $862=_sbrk($859);
 var $863=($862|0)==-1;
 if($863){label=196;break;}else{label=195;break;}
 case 195: 
 var $865=((($859)+($ssize_1_i))|0);
 var $ssize_2_i=$865;label=197;break;
 case 196: 
 var $867=_sbrk($848);
 var $tsize_0323841_i=$tsize_0_i;label=198;break;
 case 197: 
 var $ssize_2_i;
 var $869=($br_0_i|0)==-1;
 if($869){var $tsize_0323841_i=$tsize_0_i;label=198;break;}else{var $tsize_246_i=$ssize_2_i;var $tbase_247_i=$br_0_i;label=202;break;}
 case 198: 
 var $tsize_0323841_i;
 var $870=HEAP32[((4540)>>2)];
 var $871=$870|4;
 HEAP32[((4540)>>2)]=$871;
 var $tsize_1_i=$tsize_0323841_i;label=199;break;
 case 199: 
 var $tsize_1_i;
 var $873=($775>>>0)<2147483647;
 if($873){label=200;break;}else{label=343;break;}
 case 200: 
 var $875=_sbrk($775);
 var $876=_sbrk(0);
 var $notlhs_i=($875|0)!=-1;
 var $notrhs_i=($876|0)!=-1;
 var $or_cond8_not_i=$notrhs_i&$notlhs_i;
 var $877=($875>>>0)<($876>>>0);
 var $or_cond9_i=$or_cond8_not_i&$877;
 if($or_cond9_i){label=201;break;}else{label=343;break;}
 case 201: 
 var $878=$876;
 var $879=$875;
 var $880=((($878)-($879))|0);
 var $881=((($nb_0)+(40))|0);
 var $882=($880>>>0)>($881>>>0);
 var $_tsize_1_i=($882?$880:$tsize_1_i);
 if($882){var $tsize_246_i=$_tsize_1_i;var $tbase_247_i=$875;label=202;break;}else{label=343;break;}
 case 202: 
 var $tbase_247_i;
 var $tsize_246_i;
 var $883=HEAP32[((4528)>>2)];
 var $884=((($883)+($tsize_246_i))|0);
 HEAP32[((4528)>>2)]=$884;
 var $885=HEAP32[((4532)>>2)];
 var $886=($884>>>0)>($885>>>0);
 if($886){label=203;break;}else{label=204;break;}
 case 203: 
 HEAP32[((4532)>>2)]=$884;
 label=204;break;
 case 204: 
 var $888=HEAP32[((4120)>>2)];
 var $889=($888|0)==0;
 if($889){label=205;break;}else{var $sp_075_i=4544;label=212;break;}
 case 205: 
 var $891=HEAP32[((4112)>>2)];
 var $892=($891|0)==0;
 var $893=($tbase_247_i>>>0)<($891>>>0);
 var $or_cond10_i=$892|$893;
 if($or_cond10_i){label=206;break;}else{label=207;break;}
 case 206: 
 HEAP32[((4112)>>2)]=$tbase_247_i;
 label=207;break;
 case 207: 
 HEAP32[((4544)>>2)]=$tbase_247_i;
 HEAP32[((4548)>>2)]=$tsize_246_i;
 HEAP32[((4556)>>2)]=0;
 var $895=HEAP32[((4072)>>2)];
 HEAP32[((4132)>>2)]=$895;
 HEAP32[((4128)>>2)]=-1;
 var $i_02_i_i=0;label=208;break;
 case 208: 
 var $i_02_i_i;
 var $897=$i_02_i_i<<1;
 var $898=((4136+($897<<2))|0);
 var $899=$898;
 var $_sum_i_i=((($897)+(3))|0);
 var $900=((4136+($_sum_i_i<<2))|0);
 HEAP32[(($900)>>2)]=$899;
 var $_sum1_i_i=((($897)+(2))|0);
 var $901=((4136+($_sum1_i_i<<2))|0);
 HEAP32[(($901)>>2)]=$899;
 var $902=((($i_02_i_i)+(1))|0);
 var $903=($902>>>0)<32;
 if($903){var $i_02_i_i=$902;label=208;break;}else{label=209;break;}
 case 209: 
 var $904=((($tsize_246_i)-(40))|0);
 var $905=(($tbase_247_i+8)|0);
 var $906=$905;
 var $907=$906&7;
 var $908=($907|0)==0;
 if($908){var $912=0;label=211;break;}else{label=210;break;}
 case 210: 
 var $910=(((-$906))|0);
 var $911=$910&7;
 var $912=$911;label=211;break;
 case 211: 
 var $912;
 var $913=(($tbase_247_i+$912)|0);
 var $914=$913;
 var $915=((($904)-($912))|0);
 HEAP32[((4120)>>2)]=$914;
 HEAP32[((4108)>>2)]=$915;
 var $916=$915|1;
 var $_sum_i14_i=((($912)+(4))|0);
 var $917=(($tbase_247_i+$_sum_i14_i)|0);
 var $918=$917;
 HEAP32[(($918)>>2)]=$916;
 var $_sum2_i_i=((($tsize_246_i)-(36))|0);
 var $919=(($tbase_247_i+$_sum2_i_i)|0);
 var $920=$919;
 HEAP32[(($920)>>2)]=40;
 var $921=HEAP32[((4088)>>2)];
 HEAP32[((4124)>>2)]=$921;
 label=341;break;
 case 212: 
 var $sp_075_i;
 var $922=(($sp_075_i)|0);
 var $923=HEAP32[(($922)>>2)];
 var $924=(($sp_075_i+4)|0);
 var $925=HEAP32[(($924)>>2)];
 var $926=(($923+$925)|0);
 var $927=($tbase_247_i|0)==($926|0);
 if($927){label=214;break;}else{label=213;break;}
 case 213: 
 var $929=(($sp_075_i+8)|0);
 var $930=HEAP32[(($929)>>2)];
 var $931=($930|0)==0;
 if($931){label=219;break;}else{var $sp_075_i=$930;label=212;break;}
 case 214: 
 var $932=(($sp_075_i+12)|0);
 var $933=HEAP32[(($932)>>2)];
 var $934=$933&8;
 var $935=($934|0)==0;
 if($935){label=215;break;}else{label=219;break;}
 case 215: 
 var $937=$888;
 var $938=($937>>>0)>=($923>>>0);
 var $939=($937>>>0)<($tbase_247_i>>>0);
 var $or_cond49_i=$938&$939;
 if($or_cond49_i){label=216;break;}else{label=219;break;}
 case 216: 
 var $941=((($925)+($tsize_246_i))|0);
 HEAP32[(($924)>>2)]=$941;
 var $942=HEAP32[((4108)>>2)];
 var $943=((($942)+($tsize_246_i))|0);
 var $944=(($888+8)|0);
 var $945=$944;
 var $946=$945&7;
 var $947=($946|0)==0;
 if($947){var $951=0;label=218;break;}else{label=217;break;}
 case 217: 
 var $949=(((-$945))|0);
 var $950=$949&7;
 var $951=$950;label=218;break;
 case 218: 
 var $951;
 var $952=(($937+$951)|0);
 var $953=$952;
 var $954=((($943)-($951))|0);
 HEAP32[((4120)>>2)]=$953;
 HEAP32[((4108)>>2)]=$954;
 var $955=$954|1;
 var $_sum_i18_i=((($951)+(4))|0);
 var $956=(($937+$_sum_i18_i)|0);
 var $957=$956;
 HEAP32[(($957)>>2)]=$955;
 var $_sum2_i19_i=((($943)+(4))|0);
 var $958=(($937+$_sum2_i19_i)|0);
 var $959=$958;
 HEAP32[(($959)>>2)]=40;
 var $960=HEAP32[((4088)>>2)];
 HEAP32[((4124)>>2)]=$960;
 label=341;break;
 case 219: 
 var $961=HEAP32[((4112)>>2)];
 var $962=($tbase_247_i>>>0)<($961>>>0);
 if($962){label=220;break;}else{label=221;break;}
 case 220: 
 HEAP32[((4112)>>2)]=$tbase_247_i;
 label=221;break;
 case 221: 
 var $964=(($tbase_247_i+$tsize_246_i)|0);
 var $sp_168_i=4544;label=222;break;
 case 222: 
 var $sp_168_i;
 var $966=(($sp_168_i)|0);
 var $967=HEAP32[(($966)>>2)];
 var $968=($967|0)==($964|0);
 if($968){label=224;break;}else{label=223;break;}
 case 223: 
 var $970=(($sp_168_i+8)|0);
 var $971=HEAP32[(($970)>>2)];
 var $972=($971|0)==0;
 if($972){label=306;break;}else{var $sp_168_i=$971;label=222;break;}
 case 224: 
 var $973=(($sp_168_i+12)|0);
 var $974=HEAP32[(($973)>>2)];
 var $975=$974&8;
 var $976=($975|0)==0;
 if($976){label=225;break;}else{label=306;break;}
 case 225: 
 HEAP32[(($966)>>2)]=$tbase_247_i;
 var $978=(($sp_168_i+4)|0);
 var $979=HEAP32[(($978)>>2)];
 var $980=((($979)+($tsize_246_i))|0);
 HEAP32[(($978)>>2)]=$980;
 var $981=(($tbase_247_i+8)|0);
 var $982=$981;
 var $983=$982&7;
 var $984=($983|0)==0;
 if($984){var $989=0;label=227;break;}else{label=226;break;}
 case 226: 
 var $986=(((-$982))|0);
 var $987=$986&7;
 var $989=$987;label=227;break;
 case 227: 
 var $989;
 var $990=(($tbase_247_i+$989)|0);
 var $_sum107_i=((($tsize_246_i)+(8))|0);
 var $991=(($tbase_247_i+$_sum107_i)|0);
 var $992=$991;
 var $993=$992&7;
 var $994=($993|0)==0;
 if($994){var $999=0;label=229;break;}else{label=228;break;}
 case 228: 
 var $996=(((-$992))|0);
 var $997=$996&7;
 var $999=$997;label=229;break;
 case 229: 
 var $999;
 var $_sum108_i=((($999)+($tsize_246_i))|0);
 var $1000=(($tbase_247_i+$_sum108_i)|0);
 var $1001=$1000;
 var $1002=$1000;
 var $1003=$990;
 var $1004=((($1002)-($1003))|0);
 var $_sum_i21_i=((($989)+($nb_0))|0);
 var $1005=(($tbase_247_i+$_sum_i21_i)|0);
 var $1006=$1005;
 var $1007=((($1004)-($nb_0))|0);
 var $1008=$nb_0|3;
 var $_sum1_i22_i=((($989)+(4))|0);
 var $1009=(($tbase_247_i+$_sum1_i22_i)|0);
 var $1010=$1009;
 HEAP32[(($1010)>>2)]=$1008;
 var $1011=HEAP32[((4120)>>2)];
 var $1012=($1001|0)==($1011|0);
 if($1012){label=230;break;}else{label=231;break;}
 case 230: 
 var $1014=HEAP32[((4108)>>2)];
 var $1015=((($1014)+($1007))|0);
 HEAP32[((4108)>>2)]=$1015;
 HEAP32[((4120)>>2)]=$1006;
 var $1016=$1015|1;
 var $_sum46_i_i=((($_sum_i21_i)+(4))|0);
 var $1017=(($tbase_247_i+$_sum46_i_i)|0);
 var $1018=$1017;
 HEAP32[(($1018)>>2)]=$1016;
 label=305;break;
 case 231: 
 var $1020=HEAP32[((4116)>>2)];
 var $1021=($1001|0)==($1020|0);
 if($1021){label=232;break;}else{label=233;break;}
 case 232: 
 var $1023=HEAP32[((4104)>>2)];
 var $1024=((($1023)+($1007))|0);
 HEAP32[((4104)>>2)]=$1024;
 HEAP32[((4116)>>2)]=$1006;
 var $1025=$1024|1;
 var $_sum44_i_i=((($_sum_i21_i)+(4))|0);
 var $1026=(($tbase_247_i+$_sum44_i_i)|0);
 var $1027=$1026;
 HEAP32[(($1027)>>2)]=$1025;
 var $_sum45_i_i=((($1024)+($_sum_i21_i))|0);
 var $1028=(($tbase_247_i+$_sum45_i_i)|0);
 var $1029=$1028;
 HEAP32[(($1029)>>2)]=$1024;
 label=305;break;
 case 233: 
 var $_sum2_i23_i=((($tsize_246_i)+(4))|0);
 var $_sum109_i=((($_sum2_i23_i)+($999))|0);
 var $1031=(($tbase_247_i+$_sum109_i)|0);
 var $1032=$1031;
 var $1033=HEAP32[(($1032)>>2)];
 var $1034=$1033&3;
 var $1035=($1034|0)==1;
 if($1035){label=234;break;}else{var $oldfirst_0_i_i=$1001;var $qsize_0_i_i=$1007;label=281;break;}
 case 234: 
 var $1037=$1033&-8;
 var $1038=$1033>>>3;
 var $1039=($1033>>>0)<256;
 if($1039){label=235;break;}else{label=247;break;}
 case 235: 
 var $_sum3940_i_i=$999|8;
 var $_sum119_i=((($_sum3940_i_i)+($tsize_246_i))|0);
 var $1041=(($tbase_247_i+$_sum119_i)|0);
 var $1042=$1041;
 var $1043=HEAP32[(($1042)>>2)];
 var $_sum41_i_i=((($tsize_246_i)+(12))|0);
 var $_sum120_i=((($_sum41_i_i)+($999))|0);
 var $1044=(($tbase_247_i+$_sum120_i)|0);
 var $1045=$1044;
 var $1046=HEAP32[(($1045)>>2)];
 var $1047=$1038<<1;
 var $1048=((4136+($1047<<2))|0);
 var $1049=$1048;
 var $1050=($1043|0)==($1049|0);
 if($1050){label=238;break;}else{label=236;break;}
 case 236: 
 var $1052=$1043;
 var $1053=HEAP32[((4112)>>2)];
 var $1054=($1052>>>0)<($1053>>>0);
 if($1054){label=246;break;}else{label=237;break;}
 case 237: 
 var $1056=(($1043+12)|0);
 var $1057=HEAP32[(($1056)>>2)];
 var $1058=($1057|0)==($1001|0);
 if($1058){label=238;break;}else{label=246;break;}
 case 238: 
 var $1059=($1046|0)==($1043|0);
 if($1059){label=239;break;}else{label=240;break;}
 case 239: 
 var $1061=1<<$1038;
 var $1062=$1061^-1;
 var $1063=HEAP32[((4096)>>2)];
 var $1064=$1063&$1062;
 HEAP32[((4096)>>2)]=$1064;
 label=280;break;
 case 240: 
 var $1066=($1046|0)==($1049|0);
 if($1066){label=241;break;}else{label=242;break;}
 case 241: 
 var $_pre61_i_i=(($1046+8)|0);
 var $_pre_phi62_i_i=$_pre61_i_i;label=244;break;
 case 242: 
 var $1068=$1046;
 var $1069=HEAP32[((4112)>>2)];
 var $1070=($1068>>>0)<($1069>>>0);
 if($1070){label=245;break;}else{label=243;break;}
 case 243: 
 var $1072=(($1046+8)|0);
 var $1073=HEAP32[(($1072)>>2)];
 var $1074=($1073|0)==($1001|0);
 if($1074){var $_pre_phi62_i_i=$1072;label=244;break;}else{label=245;break;}
 case 244: 
 var $_pre_phi62_i_i;
 var $1075=(($1043+12)|0);
 HEAP32[(($1075)>>2)]=$1046;
 HEAP32[(($_pre_phi62_i_i)>>2)]=$1043;
 label=280;break;
 case 245: 
 _abort();
 throw "Reached an unreachable!";
 case 246: 
 _abort();
 throw "Reached an unreachable!";
 case 247: 
 var $1077=$1000;
 var $_sum34_i_i=$999|24;
 var $_sum110_i=((($_sum34_i_i)+($tsize_246_i))|0);
 var $1078=(($tbase_247_i+$_sum110_i)|0);
 var $1079=$1078;
 var $1080=HEAP32[(($1079)>>2)];
 var $_sum5_i_i=((($tsize_246_i)+(12))|0);
 var $_sum111_i=((($_sum5_i_i)+($999))|0);
 var $1081=(($tbase_247_i+$_sum111_i)|0);
 var $1082=$1081;
 var $1083=HEAP32[(($1082)>>2)];
 var $1084=($1083|0)==($1077|0);
 if($1084){label=253;break;}else{label=248;break;}
 case 248: 
 var $_sum3637_i_i=$999|8;
 var $_sum112_i=((($_sum3637_i_i)+($tsize_246_i))|0);
 var $1086=(($tbase_247_i+$_sum112_i)|0);
 var $1087=$1086;
 var $1088=HEAP32[(($1087)>>2)];
 var $1089=$1088;
 var $1090=HEAP32[((4112)>>2)];
 var $1091=($1089>>>0)<($1090>>>0);
 if($1091){label=252;break;}else{label=249;break;}
 case 249: 
 var $1093=(($1088+12)|0);
 var $1094=HEAP32[(($1093)>>2)];
 var $1095=($1094|0)==($1077|0);
 if($1095){label=250;break;}else{label=252;break;}
 case 250: 
 var $1097=(($1083+8)|0);
 var $1098=HEAP32[(($1097)>>2)];
 var $1099=($1098|0)==($1077|0);
 if($1099){label=251;break;}else{label=252;break;}
 case 251: 
 HEAP32[(($1093)>>2)]=$1083;
 HEAP32[(($1097)>>2)]=$1088;
 var $R_1_i_i=$1083;label=260;break;
 case 252: 
 _abort();
 throw "Reached an unreachable!";
 case 253: 
 var $_sum67_i_i=$999|16;
 var $_sum117_i=((($_sum2_i23_i)+($_sum67_i_i))|0);
 var $1102=(($tbase_247_i+$_sum117_i)|0);
 var $1103=$1102;
 var $1104=HEAP32[(($1103)>>2)];
 var $1105=($1104|0)==0;
 if($1105){label=254;break;}else{var $R_0_i_i=$1104;var $RP_0_i_i=$1103;label=255;break;}
 case 254: 
 var $_sum118_i=((($_sum67_i_i)+($tsize_246_i))|0);
 var $1107=(($tbase_247_i+$_sum118_i)|0);
 var $1108=$1107;
 var $1109=HEAP32[(($1108)>>2)];
 var $1110=($1109|0)==0;
 if($1110){var $R_1_i_i=0;label=260;break;}else{var $R_0_i_i=$1109;var $RP_0_i_i=$1108;label=255;break;}
 case 255: 
 var $RP_0_i_i;
 var $R_0_i_i;
 var $1111=(($R_0_i_i+20)|0);
 var $1112=HEAP32[(($1111)>>2)];
 var $1113=($1112|0)==0;
 if($1113){label=256;break;}else{var $R_0_i_i=$1112;var $RP_0_i_i=$1111;label=255;break;}
 case 256: 
 var $1115=(($R_0_i_i+16)|0);
 var $1116=HEAP32[(($1115)>>2)];
 var $1117=($1116|0)==0;
 if($1117){label=257;break;}else{var $R_0_i_i=$1116;var $RP_0_i_i=$1115;label=255;break;}
 case 257: 
 var $1119=$RP_0_i_i;
 var $1120=HEAP32[((4112)>>2)];
 var $1121=($1119>>>0)<($1120>>>0);
 if($1121){label=259;break;}else{label=258;break;}
 case 258: 
 HEAP32[(($RP_0_i_i)>>2)]=0;
 var $R_1_i_i=$R_0_i_i;label=260;break;
 case 259: 
 _abort();
 throw "Reached an unreachable!";
 case 260: 
 var $R_1_i_i;
 var $1125=($1080|0)==0;
 if($1125){label=280;break;}else{label=261;break;}
 case 261: 
 var $_sum31_i_i=((($tsize_246_i)+(28))|0);
 var $_sum113_i=((($_sum31_i_i)+($999))|0);
 var $1127=(($tbase_247_i+$_sum113_i)|0);
 var $1128=$1127;
 var $1129=HEAP32[(($1128)>>2)];
 var $1130=((4400+($1129<<2))|0);
 var $1131=HEAP32[(($1130)>>2)];
 var $1132=($1077|0)==($1131|0);
 if($1132){label=262;break;}else{label=264;break;}
 case 262: 
 HEAP32[(($1130)>>2)]=$R_1_i_i;
 var $cond_i_i=($R_1_i_i|0)==0;
 if($cond_i_i){label=263;break;}else{label=270;break;}
 case 263: 
 var $1134=1<<$1129;
 var $1135=$1134^-1;
 var $1136=HEAP32[((4100)>>2)];
 var $1137=$1136&$1135;
 HEAP32[((4100)>>2)]=$1137;
 label=280;break;
 case 264: 
 var $1139=$1080;
 var $1140=HEAP32[((4112)>>2)];
 var $1141=($1139>>>0)<($1140>>>0);
 if($1141){label=268;break;}else{label=265;break;}
 case 265: 
 var $1143=(($1080+16)|0);
 var $1144=HEAP32[(($1143)>>2)];
 var $1145=($1144|0)==($1077|0);
 if($1145){label=266;break;}else{label=267;break;}
 case 266: 
 HEAP32[(($1143)>>2)]=$R_1_i_i;
 label=269;break;
 case 267: 
 var $1148=(($1080+20)|0);
 HEAP32[(($1148)>>2)]=$R_1_i_i;
 label=269;break;
 case 268: 
 _abort();
 throw "Reached an unreachable!";
 case 269: 
 var $1151=($R_1_i_i|0)==0;
 if($1151){label=280;break;}else{label=270;break;}
 case 270: 
 var $1153=$R_1_i_i;
 var $1154=HEAP32[((4112)>>2)];
 var $1155=($1153>>>0)<($1154>>>0);
 if($1155){label=279;break;}else{label=271;break;}
 case 271: 
 var $1157=(($R_1_i_i+24)|0);
 HEAP32[(($1157)>>2)]=$1080;
 var $_sum3233_i_i=$999|16;
 var $_sum114_i=((($_sum3233_i_i)+($tsize_246_i))|0);
 var $1158=(($tbase_247_i+$_sum114_i)|0);
 var $1159=$1158;
 var $1160=HEAP32[(($1159)>>2)];
 var $1161=($1160|0)==0;
 if($1161){label=275;break;}else{label=272;break;}
 case 272: 
 var $1163=$1160;
 var $1164=HEAP32[((4112)>>2)];
 var $1165=($1163>>>0)<($1164>>>0);
 if($1165){label=274;break;}else{label=273;break;}
 case 273: 
 var $1167=(($R_1_i_i+16)|0);
 HEAP32[(($1167)>>2)]=$1160;
 var $1168=(($1160+24)|0);
 HEAP32[(($1168)>>2)]=$R_1_i_i;
 label=275;break;
 case 274: 
 _abort();
 throw "Reached an unreachable!";
 case 275: 
 var $_sum115_i=((($_sum2_i23_i)+($_sum3233_i_i))|0);
 var $1171=(($tbase_247_i+$_sum115_i)|0);
 var $1172=$1171;
 var $1173=HEAP32[(($1172)>>2)];
 var $1174=($1173|0)==0;
 if($1174){label=280;break;}else{label=276;break;}
 case 276: 
 var $1176=$1173;
 var $1177=HEAP32[((4112)>>2)];
 var $1178=($1176>>>0)<($1177>>>0);
 if($1178){label=278;break;}else{label=277;break;}
 case 277: 
 var $1180=(($R_1_i_i+20)|0);
 HEAP32[(($1180)>>2)]=$1173;
 var $1181=(($1173+24)|0);
 HEAP32[(($1181)>>2)]=$R_1_i_i;
 label=280;break;
 case 278: 
 _abort();
 throw "Reached an unreachable!";
 case 279: 
 _abort();
 throw "Reached an unreachable!";
 case 280: 
 var $_sum9_i_i=$1037|$999;
 var $_sum116_i=((($_sum9_i_i)+($tsize_246_i))|0);
 var $1185=(($tbase_247_i+$_sum116_i)|0);
 var $1186=$1185;
 var $1187=((($1037)+($1007))|0);
 var $oldfirst_0_i_i=$1186;var $qsize_0_i_i=$1187;label=281;break;
 case 281: 
 var $qsize_0_i_i;
 var $oldfirst_0_i_i;
 var $1189=(($oldfirst_0_i_i+4)|0);
 var $1190=HEAP32[(($1189)>>2)];
 var $1191=$1190&-2;
 HEAP32[(($1189)>>2)]=$1191;
 var $1192=$qsize_0_i_i|1;
 var $_sum10_i_i=((($_sum_i21_i)+(4))|0);
 var $1193=(($tbase_247_i+$_sum10_i_i)|0);
 var $1194=$1193;
 HEAP32[(($1194)>>2)]=$1192;
 var $_sum11_i_i=((($qsize_0_i_i)+($_sum_i21_i))|0);
 var $1195=(($tbase_247_i+$_sum11_i_i)|0);
 var $1196=$1195;
 HEAP32[(($1196)>>2)]=$qsize_0_i_i;
 var $1197=$qsize_0_i_i>>>3;
 var $1198=($qsize_0_i_i>>>0)<256;
 if($1198){label=282;break;}else{label=287;break;}
 case 282: 
 var $1200=$1197<<1;
 var $1201=((4136+($1200<<2))|0);
 var $1202=$1201;
 var $1203=HEAP32[((4096)>>2)];
 var $1204=1<<$1197;
 var $1205=$1203&$1204;
 var $1206=($1205|0)==0;
 if($1206){label=283;break;}else{label=284;break;}
 case 283: 
 var $1208=$1203|$1204;
 HEAP32[((4096)>>2)]=$1208;
 var $_sum27_pre_i_i=((($1200)+(2))|0);
 var $_pre_i24_i=((4136+($_sum27_pre_i_i<<2))|0);
 var $F4_0_i_i=$1202;var $_pre_phi_i25_i=$_pre_i24_i;label=286;break;
 case 284: 
 var $_sum30_i_i=((($1200)+(2))|0);
 var $1210=((4136+($_sum30_i_i<<2))|0);
 var $1211=HEAP32[(($1210)>>2)];
 var $1212=$1211;
 var $1213=HEAP32[((4112)>>2)];
 var $1214=($1212>>>0)<($1213>>>0);
 if($1214){label=285;break;}else{var $F4_0_i_i=$1211;var $_pre_phi_i25_i=$1210;label=286;break;}
 case 285: 
 _abort();
 throw "Reached an unreachable!";
 case 286: 
 var $_pre_phi_i25_i;
 var $F4_0_i_i;
 HEAP32[(($_pre_phi_i25_i)>>2)]=$1006;
 var $1217=(($F4_0_i_i+12)|0);
 HEAP32[(($1217)>>2)]=$1006;
 var $_sum28_i_i=((($_sum_i21_i)+(8))|0);
 var $1218=(($tbase_247_i+$_sum28_i_i)|0);
 var $1219=$1218;
 HEAP32[(($1219)>>2)]=$F4_0_i_i;
 var $_sum29_i_i=((($_sum_i21_i)+(12))|0);
 var $1220=(($tbase_247_i+$_sum29_i_i)|0);
 var $1221=$1220;
 HEAP32[(($1221)>>2)]=$1202;
 label=305;break;
 case 287: 
 var $1223=$1005;
 var $1224=$qsize_0_i_i>>>8;
 var $1225=($1224|0)==0;
 if($1225){var $I7_0_i_i=0;label=290;break;}else{label=288;break;}
 case 288: 
 var $1227=($qsize_0_i_i>>>0)>16777215;
 if($1227){var $I7_0_i_i=31;label=290;break;}else{label=289;break;}
 case 289: 
 var $1229=((($1224)+(1048320))|0);
 var $1230=$1229>>>16;
 var $1231=$1230&8;
 var $1232=$1224<<$1231;
 var $1233=((($1232)+(520192))|0);
 var $1234=$1233>>>16;
 var $1235=$1234&4;
 var $1236=$1235|$1231;
 var $1237=$1232<<$1235;
 var $1238=((($1237)+(245760))|0);
 var $1239=$1238>>>16;
 var $1240=$1239&2;
 var $1241=$1236|$1240;
 var $1242=(((14)-($1241))|0);
 var $1243=$1237<<$1240;
 var $1244=$1243>>>15;
 var $1245=((($1242)+($1244))|0);
 var $1246=$1245<<1;
 var $1247=((($1245)+(7))|0);
 var $1248=$qsize_0_i_i>>>($1247>>>0);
 var $1249=$1248&1;
 var $1250=$1249|$1246;
 var $I7_0_i_i=$1250;label=290;break;
 case 290: 
 var $I7_0_i_i;
 var $1252=((4400+($I7_0_i_i<<2))|0);
 var $_sum12_i26_i=((($_sum_i21_i)+(28))|0);
 var $1253=(($tbase_247_i+$_sum12_i26_i)|0);
 var $1254=$1253;
 HEAP32[(($1254)>>2)]=$I7_0_i_i;
 var $_sum13_i_i=((($_sum_i21_i)+(16))|0);
 var $1255=(($tbase_247_i+$_sum13_i_i)|0);
 var $_sum14_i_i=((($_sum_i21_i)+(20))|0);
 var $1256=(($tbase_247_i+$_sum14_i_i)|0);
 var $1257=$1256;
 HEAP32[(($1257)>>2)]=0;
 var $1258=$1255;
 HEAP32[(($1258)>>2)]=0;
 var $1259=HEAP32[((4100)>>2)];
 var $1260=1<<$I7_0_i_i;
 var $1261=$1259&$1260;
 var $1262=($1261|0)==0;
 if($1262){label=291;break;}else{label=292;break;}
 case 291: 
 var $1264=$1259|$1260;
 HEAP32[((4100)>>2)]=$1264;
 HEAP32[(($1252)>>2)]=$1223;
 var $1265=$1252;
 var $_sum15_i_i=((($_sum_i21_i)+(24))|0);
 var $1266=(($tbase_247_i+$_sum15_i_i)|0);
 var $1267=$1266;
 HEAP32[(($1267)>>2)]=$1265;
 var $_sum16_i_i=((($_sum_i21_i)+(12))|0);
 var $1268=(($tbase_247_i+$_sum16_i_i)|0);
 var $1269=$1268;
 HEAP32[(($1269)>>2)]=$1223;
 var $_sum17_i_i=((($_sum_i21_i)+(8))|0);
 var $1270=(($tbase_247_i+$_sum17_i_i)|0);
 var $1271=$1270;
 HEAP32[(($1271)>>2)]=$1223;
 label=305;break;
 case 292: 
 var $1273=HEAP32[(($1252)>>2)];
 var $1274=($I7_0_i_i|0)==31;
 if($1274){var $1279=0;label=294;break;}else{label=293;break;}
 case 293: 
 var $1276=$I7_0_i_i>>>1;
 var $1277=(((25)-($1276))|0);
 var $1279=$1277;label=294;break;
 case 294: 
 var $1279;
 var $1280=(($1273+4)|0);
 var $1281=HEAP32[(($1280)>>2)];
 var $1282=$1281&-8;
 var $1283=($1282|0)==($qsize_0_i_i|0);
 if($1283){var $T_0_lcssa_i28_i=$1273;label=301;break;}else{label=295;break;}
 case 295: 
 var $1284=$qsize_0_i_i<<$1279;
 var $T_055_i_i=$1273;var $K8_056_i_i=$1284;label=297;break;
 case 296: 
 var $1286=$K8_056_i_i<<1;
 var $1287=(($1294+4)|0);
 var $1288=HEAP32[(($1287)>>2)];
 var $1289=$1288&-8;
 var $1290=($1289|0)==($qsize_0_i_i|0);
 if($1290){var $T_0_lcssa_i28_i=$1294;label=301;break;}else{var $T_055_i_i=$1294;var $K8_056_i_i=$1286;label=297;break;}
 case 297: 
 var $K8_056_i_i;
 var $T_055_i_i;
 var $1292=$K8_056_i_i>>>31;
 var $1293=(($T_055_i_i+16+($1292<<2))|0);
 var $1294=HEAP32[(($1293)>>2)];
 var $1295=($1294|0)==0;
 if($1295){label=298;break;}else{label=296;break;}
 case 298: 
 var $1297=$1293;
 var $1298=HEAP32[((4112)>>2)];
 var $1299=($1297>>>0)<($1298>>>0);
 if($1299){label=300;break;}else{label=299;break;}
 case 299: 
 HEAP32[(($1293)>>2)]=$1223;
 var $_sum24_i_i=((($_sum_i21_i)+(24))|0);
 var $1301=(($tbase_247_i+$_sum24_i_i)|0);
 var $1302=$1301;
 HEAP32[(($1302)>>2)]=$T_055_i_i;
 var $_sum25_i_i=((($_sum_i21_i)+(12))|0);
 var $1303=(($tbase_247_i+$_sum25_i_i)|0);
 var $1304=$1303;
 HEAP32[(($1304)>>2)]=$1223;
 var $_sum26_i_i=((($_sum_i21_i)+(8))|0);
 var $1305=(($tbase_247_i+$_sum26_i_i)|0);
 var $1306=$1305;
 HEAP32[(($1306)>>2)]=$1223;
 label=305;break;
 case 300: 
 _abort();
 throw "Reached an unreachable!";
 case 301: 
 var $T_0_lcssa_i28_i;
 var $1308=(($T_0_lcssa_i28_i+8)|0);
 var $1309=HEAP32[(($1308)>>2)];
 var $1310=$T_0_lcssa_i28_i;
 var $1311=HEAP32[((4112)>>2)];
 var $1312=($1310>>>0)<($1311>>>0);
 if($1312){label=304;break;}else{label=302;break;}
 case 302: 
 var $1314=$1309;
 var $1315=($1314>>>0)<($1311>>>0);
 if($1315){label=304;break;}else{label=303;break;}
 case 303: 
 var $1317=(($1309+12)|0);
 HEAP32[(($1317)>>2)]=$1223;
 HEAP32[(($1308)>>2)]=$1223;
 var $_sum21_i_i=((($_sum_i21_i)+(8))|0);
 var $1318=(($tbase_247_i+$_sum21_i_i)|0);
 var $1319=$1318;
 HEAP32[(($1319)>>2)]=$1309;
 var $_sum22_i_i=((($_sum_i21_i)+(12))|0);
 var $1320=(($tbase_247_i+$_sum22_i_i)|0);
 var $1321=$1320;
 HEAP32[(($1321)>>2)]=$T_0_lcssa_i28_i;
 var $_sum23_i_i=((($_sum_i21_i)+(24))|0);
 var $1322=(($tbase_247_i+$_sum23_i_i)|0);
 var $1323=$1322;
 HEAP32[(($1323)>>2)]=0;
 label=305;break;
 case 304: 
 _abort();
 throw "Reached an unreachable!";
 case 305: 
 var $_sum1819_i_i=$989|8;
 var $1324=(($tbase_247_i+$_sum1819_i_i)|0);
 var $mem_0=$1324;label=344;break;
 case 306: 
 var $1325=$888;
 var $sp_0_i_i_i=4544;label=307;break;
 case 307: 
 var $sp_0_i_i_i;
 var $1327=(($sp_0_i_i_i)|0);
 var $1328=HEAP32[(($1327)>>2)];
 var $1329=($1328>>>0)>($1325>>>0);
 if($1329){label=309;break;}else{label=308;break;}
 case 308: 
 var $1331=(($sp_0_i_i_i+4)|0);
 var $1332=HEAP32[(($1331)>>2)];
 var $1333=(($1328+$1332)|0);
 var $1334=($1333>>>0)>($1325>>>0);
 if($1334){label=310;break;}else{label=309;break;}
 case 309: 
 var $1336=(($sp_0_i_i_i+8)|0);
 var $1337=HEAP32[(($1336)>>2)];
 var $sp_0_i_i_i=$1337;label=307;break;
 case 310: 
 var $_sum_i15_i=((($1332)-(47))|0);
 var $_sum1_i16_i=((($1332)-(39))|0);
 var $1338=(($1328+$_sum1_i16_i)|0);
 var $1339=$1338;
 var $1340=$1339&7;
 var $1341=($1340|0)==0;
 if($1341){var $1346=0;label=312;break;}else{label=311;break;}
 case 311: 
 var $1343=(((-$1339))|0);
 var $1344=$1343&7;
 var $1346=$1344;label=312;break;
 case 312: 
 var $1346;
 var $_sum2_i17_i=((($_sum_i15_i)+($1346))|0);
 var $1347=(($1328+$_sum2_i17_i)|0);
 var $1348=(($888+16)|0);
 var $1349=$1348;
 var $1350=($1347>>>0)<($1349>>>0);
 var $1351=($1350?$1325:$1347);
 var $1352=(($1351+8)|0);
 var $1353=$1352;
 var $1354=((($tsize_246_i)-(40))|0);
 var $1355=(($tbase_247_i+8)|0);
 var $1356=$1355;
 var $1357=$1356&7;
 var $1358=($1357|0)==0;
 if($1358){var $1362=0;label=314;break;}else{label=313;break;}
 case 313: 
 var $1360=(((-$1356))|0);
 var $1361=$1360&7;
 var $1362=$1361;label=314;break;
 case 314: 
 var $1362;
 var $1363=(($tbase_247_i+$1362)|0);
 var $1364=$1363;
 var $1365=((($1354)-($1362))|0);
 HEAP32[((4120)>>2)]=$1364;
 HEAP32[((4108)>>2)]=$1365;
 var $1366=$1365|1;
 var $_sum_i_i_i=((($1362)+(4))|0);
 var $1367=(($tbase_247_i+$_sum_i_i_i)|0);
 var $1368=$1367;
 HEAP32[(($1368)>>2)]=$1366;
 var $_sum2_i_i_i=((($tsize_246_i)-(36))|0);
 var $1369=(($tbase_247_i+$_sum2_i_i_i)|0);
 var $1370=$1369;
 HEAP32[(($1370)>>2)]=40;
 var $1371=HEAP32[((4088)>>2)];
 HEAP32[((4124)>>2)]=$1371;
 var $1372=(($1351+4)|0);
 var $1373=$1372;
 HEAP32[(($1373)>>2)]=27;
 assert(16 % 1 === 0);HEAP32[(($1352)>>2)]=HEAP32[((4544)>>2)];HEAP32[((($1352)+(4))>>2)]=HEAP32[((4548)>>2)];HEAP32[((($1352)+(8))>>2)]=HEAP32[((4552)>>2)];HEAP32[((($1352)+(12))>>2)]=HEAP32[((4556)>>2)];
 HEAP32[((4544)>>2)]=$tbase_247_i;
 HEAP32[((4548)>>2)]=$tsize_246_i;
 HEAP32[((4556)>>2)]=0;
 HEAP32[((4552)>>2)]=$1353;
 var $1374=(($1351+28)|0);
 var $1375=$1374;
 HEAP32[(($1375)>>2)]=7;
 var $1376=(($1351+32)|0);
 var $1377=($1376>>>0)<($1333>>>0);
 if($1377){var $1378=$1375;label=315;break;}else{label=316;break;}
 case 315: 
 var $1378;
 var $1379=(($1378+4)|0);
 HEAP32[(($1379)>>2)]=7;
 var $1380=(($1378+8)|0);
 var $1381=$1380;
 var $1382=($1381>>>0)<($1333>>>0);
 if($1382){var $1378=$1379;label=315;break;}else{label=316;break;}
 case 316: 
 var $1383=($1351|0)==($1325|0);
 if($1383){label=341;break;}else{label=317;break;}
 case 317: 
 var $1385=$1351;
 var $1386=$888;
 var $1387=((($1385)-($1386))|0);
 var $1388=(($1325+$1387)|0);
 var $_sum3_i_i=((($1387)+(4))|0);
 var $1389=(($1325+$_sum3_i_i)|0);
 var $1390=$1389;
 var $1391=HEAP32[(($1390)>>2)];
 var $1392=$1391&-2;
 HEAP32[(($1390)>>2)]=$1392;
 var $1393=$1387|1;
 var $1394=(($888+4)|0);
 HEAP32[(($1394)>>2)]=$1393;
 var $1395=$1388;
 HEAP32[(($1395)>>2)]=$1387;
 var $1396=$1387>>>3;
 var $1397=($1387>>>0)<256;
 if($1397){label=318;break;}else{label=323;break;}
 case 318: 
 var $1399=$1396<<1;
 var $1400=((4136+($1399<<2))|0);
 var $1401=$1400;
 var $1402=HEAP32[((4096)>>2)];
 var $1403=1<<$1396;
 var $1404=$1402&$1403;
 var $1405=($1404|0)==0;
 if($1405){label=319;break;}else{label=320;break;}
 case 319: 
 var $1407=$1402|$1403;
 HEAP32[((4096)>>2)]=$1407;
 var $_sum11_pre_i_i=((($1399)+(2))|0);
 var $_pre_i_i=((4136+($_sum11_pre_i_i<<2))|0);
 var $F_0_i_i=$1401;var $_pre_phi_i_i=$_pre_i_i;label=322;break;
 case 320: 
 var $_sum12_i_i=((($1399)+(2))|0);
 var $1409=((4136+($_sum12_i_i<<2))|0);
 var $1410=HEAP32[(($1409)>>2)];
 var $1411=$1410;
 var $1412=HEAP32[((4112)>>2)];
 var $1413=($1411>>>0)<($1412>>>0);
 if($1413){label=321;break;}else{var $F_0_i_i=$1410;var $_pre_phi_i_i=$1409;label=322;break;}
 case 321: 
 _abort();
 throw "Reached an unreachable!";
 case 322: 
 var $_pre_phi_i_i;
 var $F_0_i_i;
 HEAP32[(($_pre_phi_i_i)>>2)]=$888;
 var $1416=(($F_0_i_i+12)|0);
 HEAP32[(($1416)>>2)]=$888;
 var $1417=(($888+8)|0);
 HEAP32[(($1417)>>2)]=$F_0_i_i;
 var $1418=(($888+12)|0);
 HEAP32[(($1418)>>2)]=$1401;
 label=341;break;
 case 323: 
 var $1420=$888;
 var $1421=$1387>>>8;
 var $1422=($1421|0)==0;
 if($1422){var $I1_0_i_i=0;label=326;break;}else{label=324;break;}
 case 324: 
 var $1424=($1387>>>0)>16777215;
 if($1424){var $I1_0_i_i=31;label=326;break;}else{label=325;break;}
 case 325: 
 var $1426=((($1421)+(1048320))|0);
 var $1427=$1426>>>16;
 var $1428=$1427&8;
 var $1429=$1421<<$1428;
 var $1430=((($1429)+(520192))|0);
 var $1431=$1430>>>16;
 var $1432=$1431&4;
 var $1433=$1432|$1428;
 var $1434=$1429<<$1432;
 var $1435=((($1434)+(245760))|0);
 var $1436=$1435>>>16;
 var $1437=$1436&2;
 var $1438=$1433|$1437;
 var $1439=(((14)-($1438))|0);
 var $1440=$1434<<$1437;
 var $1441=$1440>>>15;
 var $1442=((($1439)+($1441))|0);
 var $1443=$1442<<1;
 var $1444=((($1442)+(7))|0);
 var $1445=$1387>>>($1444>>>0);
 var $1446=$1445&1;
 var $1447=$1446|$1443;
 var $I1_0_i_i=$1447;label=326;break;
 case 326: 
 var $I1_0_i_i;
 var $1449=((4400+($I1_0_i_i<<2))|0);
 var $1450=(($888+28)|0);
 var $I1_0_c_i_i=$I1_0_i_i;
 HEAP32[(($1450)>>2)]=$I1_0_c_i_i;
 var $1451=(($888+20)|0);
 HEAP32[(($1451)>>2)]=0;
 var $1452=(($888+16)|0);
 HEAP32[(($1452)>>2)]=0;
 var $1453=HEAP32[((4100)>>2)];
 var $1454=1<<$I1_0_i_i;
 var $1455=$1453&$1454;
 var $1456=($1455|0)==0;
 if($1456){label=327;break;}else{label=328;break;}
 case 327: 
 var $1458=$1453|$1454;
 HEAP32[((4100)>>2)]=$1458;
 HEAP32[(($1449)>>2)]=$1420;
 var $1459=(($888+24)|0);
 var $_c_i_i=$1449;
 HEAP32[(($1459)>>2)]=$_c_i_i;
 var $1460=(($888+12)|0);
 HEAP32[(($1460)>>2)]=$888;
 var $1461=(($888+8)|0);
 HEAP32[(($1461)>>2)]=$888;
 label=341;break;
 case 328: 
 var $1463=HEAP32[(($1449)>>2)];
 var $1464=($I1_0_i_i|0)==31;
 if($1464){var $1469=0;label=330;break;}else{label=329;break;}
 case 329: 
 var $1466=$I1_0_i_i>>>1;
 var $1467=(((25)-($1466))|0);
 var $1469=$1467;label=330;break;
 case 330: 
 var $1469;
 var $1470=(($1463+4)|0);
 var $1471=HEAP32[(($1470)>>2)];
 var $1472=$1471&-8;
 var $1473=($1472|0)==($1387|0);
 if($1473){var $T_0_lcssa_i_i=$1463;label=337;break;}else{label=331;break;}
 case 331: 
 var $1474=$1387<<$1469;
 var $T_014_i_i=$1463;var $K2_015_i_i=$1474;label=333;break;
 case 332: 
 var $1476=$K2_015_i_i<<1;
 var $1477=(($1484+4)|0);
 var $1478=HEAP32[(($1477)>>2)];
 var $1479=$1478&-8;
 var $1480=($1479|0)==($1387|0);
 if($1480){var $T_0_lcssa_i_i=$1484;label=337;break;}else{var $T_014_i_i=$1484;var $K2_015_i_i=$1476;label=333;break;}
 case 333: 
 var $K2_015_i_i;
 var $T_014_i_i;
 var $1482=$K2_015_i_i>>>31;
 var $1483=(($T_014_i_i+16+($1482<<2))|0);
 var $1484=HEAP32[(($1483)>>2)];
 var $1485=($1484|0)==0;
 if($1485){label=334;break;}else{label=332;break;}
 case 334: 
 var $1487=$1483;
 var $1488=HEAP32[((4112)>>2)];
 var $1489=($1487>>>0)<($1488>>>0);
 if($1489){label=336;break;}else{label=335;break;}
 case 335: 
 HEAP32[(($1483)>>2)]=$1420;
 var $1491=(($888+24)|0);
 var $T_0_c8_i_i=$T_014_i_i;
 HEAP32[(($1491)>>2)]=$T_0_c8_i_i;
 var $1492=(($888+12)|0);
 HEAP32[(($1492)>>2)]=$888;
 var $1493=(($888+8)|0);
 HEAP32[(($1493)>>2)]=$888;
 label=341;break;
 case 336: 
 _abort();
 throw "Reached an unreachable!";
 case 337: 
 var $T_0_lcssa_i_i;
 var $1495=(($T_0_lcssa_i_i+8)|0);
 var $1496=HEAP32[(($1495)>>2)];
 var $1497=$T_0_lcssa_i_i;
 var $1498=HEAP32[((4112)>>2)];
 var $1499=($1497>>>0)<($1498>>>0);
 if($1499){label=340;break;}else{label=338;break;}
 case 338: 
 var $1501=$1496;
 var $1502=($1501>>>0)<($1498>>>0);
 if($1502){label=340;break;}else{label=339;break;}
 case 339: 
 var $1504=(($1496+12)|0);
 HEAP32[(($1504)>>2)]=$1420;
 HEAP32[(($1495)>>2)]=$1420;
 var $1505=(($888+8)|0);
 var $_c7_i_i=$1496;
 HEAP32[(($1505)>>2)]=$_c7_i_i;
 var $1506=(($888+12)|0);
 var $T_0_c_i_i=$T_0_lcssa_i_i;
 HEAP32[(($1506)>>2)]=$T_0_c_i_i;
 var $1507=(($888+24)|0);
 HEAP32[(($1507)>>2)]=0;
 label=341;break;
 case 340: 
 _abort();
 throw "Reached an unreachable!";
 case 341: 
 var $1508=HEAP32[((4108)>>2)];
 var $1509=($1508>>>0)>($nb_0>>>0);
 if($1509){label=342;break;}else{label=343;break;}
 case 342: 
 var $1511=((($1508)-($nb_0))|0);
 HEAP32[((4108)>>2)]=$1511;
 var $1512=HEAP32[((4120)>>2)];
 var $1513=$1512;
 var $1514=(($1513+$nb_0)|0);
 var $1515=$1514;
 HEAP32[((4120)>>2)]=$1515;
 var $1516=$1511|1;
 var $_sum_i34=((($nb_0)+(4))|0);
 var $1517=(($1513+$_sum_i34)|0);
 var $1518=$1517;
 HEAP32[(($1518)>>2)]=$1516;
 var $1519=$nb_0|3;
 var $1520=(($1512+4)|0);
 HEAP32[(($1520)>>2)]=$1519;
 var $1521=(($1512+8)|0);
 var $1522=$1521;
 var $mem_0=$1522;label=344;break;
 case 343: 
 var $1523=___errno_location();
 HEAP32[(($1523)>>2)]=12;
 var $mem_0=0;label=344;break;
 case 344: 
 var $mem_0;
 return $mem_0;
  default: assert(0, "bad label: " + label);
 }

}
Module["_malloc"] = _malloc;

function _free($mem){
 var label=0;

 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1=($mem|0)==0;
 if($1){label=141;break;}else{label=2;break;}
 case 2: 
 var $3=((($mem)-(8))|0);
 var $4=$3;
 var $5=HEAP32[((4112)>>2)];
 var $6=($3>>>0)<($5>>>0);
 if($6){label=140;break;}else{label=3;break;}
 case 3: 
 var $8=((($mem)-(4))|0);
 var $9=$8;
 var $10=HEAP32[(($9)>>2)];
 var $11=$10&3;
 var $12=($11|0)==1;
 if($12){label=140;break;}else{label=4;break;}
 case 4: 
 var $14=$10&-8;
 var $_sum=((($14)-(8))|0);
 var $15=(($mem+$_sum)|0);
 var $16=$15;
 var $17=$10&1;
 var $18=($17|0)==0;
 if($18){label=5;break;}else{var $p_0=$4;var $psize_0=$14;label=56;break;}
 case 5: 
 var $20=$3;
 var $21=HEAP32[(($20)>>2)];
 var $22=($11|0)==0;
 if($22){label=141;break;}else{label=6;break;}
 case 6: 
 var $_sum3=(((-8)-($21))|0);
 var $24=(($mem+$_sum3)|0);
 var $25=$24;
 var $26=((($21)+($14))|0);
 var $27=($24>>>0)<($5>>>0);
 if($27){label=140;break;}else{label=7;break;}
 case 7: 
 var $29=HEAP32[((4116)>>2)];
 var $30=($25|0)==($29|0);
 if($30){label=54;break;}else{label=8;break;}
 case 8: 
 var $32=$21>>>3;
 var $33=($21>>>0)<256;
 if($33){label=9;break;}else{label=21;break;}
 case 9: 
 var $_sum47=((($_sum3)+(8))|0);
 var $35=(($mem+$_sum47)|0);
 var $36=$35;
 var $37=HEAP32[(($36)>>2)];
 var $_sum48=((($_sum3)+(12))|0);
 var $38=(($mem+$_sum48)|0);
 var $39=$38;
 var $40=HEAP32[(($39)>>2)];
 var $41=$32<<1;
 var $42=((4136+($41<<2))|0);
 var $43=$42;
 var $44=($37|0)==($43|0);
 if($44){label=12;break;}else{label=10;break;}
 case 10: 
 var $46=$37;
 var $47=($46>>>0)<($5>>>0);
 if($47){label=20;break;}else{label=11;break;}
 case 11: 
 var $49=(($37+12)|0);
 var $50=HEAP32[(($49)>>2)];
 var $51=($50|0)==($25|0);
 if($51){label=12;break;}else{label=20;break;}
 case 12: 
 var $52=($40|0)==($37|0);
 if($52){label=13;break;}else{label=14;break;}
 case 13: 
 var $54=1<<$32;
 var $55=$54^-1;
 var $56=HEAP32[((4096)>>2)];
 var $57=$56&$55;
 HEAP32[((4096)>>2)]=$57;
 var $p_0=$25;var $psize_0=$26;label=56;break;
 case 14: 
 var $59=($40|0)==($43|0);
 if($59){label=15;break;}else{label=16;break;}
 case 15: 
 var $_pre84=(($40+8)|0);
 var $_pre_phi85=$_pre84;label=18;break;
 case 16: 
 var $61=$40;
 var $62=($61>>>0)<($5>>>0);
 if($62){label=19;break;}else{label=17;break;}
 case 17: 
 var $64=(($40+8)|0);
 var $65=HEAP32[(($64)>>2)];
 var $66=($65|0)==($25|0);
 if($66){var $_pre_phi85=$64;label=18;break;}else{label=19;break;}
 case 18: 
 var $_pre_phi85;
 var $67=(($37+12)|0);
 HEAP32[(($67)>>2)]=$40;
 HEAP32[(($_pre_phi85)>>2)]=$37;
 var $p_0=$25;var $psize_0=$26;label=56;break;
 case 19: 
 _abort();
 throw "Reached an unreachable!";
 case 20: 
 _abort();
 throw "Reached an unreachable!";
 case 21: 
 var $69=$24;
 var $_sum37=((($_sum3)+(24))|0);
 var $70=(($mem+$_sum37)|0);
 var $71=$70;
 var $72=HEAP32[(($71)>>2)];
 var $_sum38=((($_sum3)+(12))|0);
 var $73=(($mem+$_sum38)|0);
 var $74=$73;
 var $75=HEAP32[(($74)>>2)];
 var $76=($75|0)==($69|0);
 if($76){label=27;break;}else{label=22;break;}
 case 22: 
 var $_sum44=((($_sum3)+(8))|0);
 var $78=(($mem+$_sum44)|0);
 var $79=$78;
 var $80=HEAP32[(($79)>>2)];
 var $81=$80;
 var $82=($81>>>0)<($5>>>0);
 if($82){label=26;break;}else{label=23;break;}
 case 23: 
 var $84=(($80+12)|0);
 var $85=HEAP32[(($84)>>2)];
 var $86=($85|0)==($69|0);
 if($86){label=24;break;}else{label=26;break;}
 case 24: 
 var $88=(($75+8)|0);
 var $89=HEAP32[(($88)>>2)];
 var $90=($89|0)==($69|0);
 if($90){label=25;break;}else{label=26;break;}
 case 25: 
 HEAP32[(($84)>>2)]=$75;
 HEAP32[(($88)>>2)]=$80;
 var $R_1=$75;label=34;break;
 case 26: 
 _abort();
 throw "Reached an unreachable!";
 case 27: 
 var $_sum40=((($_sum3)+(20))|0);
 var $93=(($mem+$_sum40)|0);
 var $94=$93;
 var $95=HEAP32[(($94)>>2)];
 var $96=($95|0)==0;
 if($96){label=28;break;}else{var $R_0=$95;var $RP_0=$94;label=29;break;}
 case 28: 
 var $_sum39=((($_sum3)+(16))|0);
 var $98=(($mem+$_sum39)|0);
 var $99=$98;
 var $100=HEAP32[(($99)>>2)];
 var $101=($100|0)==0;
 if($101){var $R_1=0;label=34;break;}else{var $R_0=$100;var $RP_0=$99;label=29;break;}
 case 29: 
 var $RP_0;
 var $R_0;
 var $102=(($R_0+20)|0);
 var $103=HEAP32[(($102)>>2)];
 var $104=($103|0)==0;
 if($104){label=30;break;}else{var $R_0=$103;var $RP_0=$102;label=29;break;}
 case 30: 
 var $106=(($R_0+16)|0);
 var $107=HEAP32[(($106)>>2)];
 var $108=($107|0)==0;
 if($108){label=31;break;}else{var $R_0=$107;var $RP_0=$106;label=29;break;}
 case 31: 
 var $110=$RP_0;
 var $111=($110>>>0)<($5>>>0);
 if($111){label=33;break;}else{label=32;break;}
 case 32: 
 HEAP32[(($RP_0)>>2)]=0;
 var $R_1=$R_0;label=34;break;
 case 33: 
 _abort();
 throw "Reached an unreachable!";
 case 34: 
 var $R_1;
 var $115=($72|0)==0;
 if($115){var $p_0=$25;var $psize_0=$26;label=56;break;}else{label=35;break;}
 case 35: 
 var $_sum41=((($_sum3)+(28))|0);
 var $117=(($mem+$_sum41)|0);
 var $118=$117;
 var $119=HEAP32[(($118)>>2)];
 var $120=((4400+($119<<2))|0);
 var $121=HEAP32[(($120)>>2)];
 var $122=($69|0)==($121|0);
 if($122){label=36;break;}else{label=38;break;}
 case 36: 
 HEAP32[(($120)>>2)]=$R_1;
 var $cond=($R_1|0)==0;
 if($cond){label=37;break;}else{label=44;break;}
 case 37: 
 var $124=1<<$119;
 var $125=$124^-1;
 var $126=HEAP32[((4100)>>2)];
 var $127=$126&$125;
 HEAP32[((4100)>>2)]=$127;
 var $p_0=$25;var $psize_0=$26;label=56;break;
 case 38: 
 var $129=$72;
 var $130=HEAP32[((4112)>>2)];
 var $131=($129>>>0)<($130>>>0);
 if($131){label=42;break;}else{label=39;break;}
 case 39: 
 var $133=(($72+16)|0);
 var $134=HEAP32[(($133)>>2)];
 var $135=($134|0)==($69|0);
 if($135){label=40;break;}else{label=41;break;}
 case 40: 
 HEAP32[(($133)>>2)]=$R_1;
 label=43;break;
 case 41: 
 var $138=(($72+20)|0);
 HEAP32[(($138)>>2)]=$R_1;
 label=43;break;
 case 42: 
 _abort();
 throw "Reached an unreachable!";
 case 43: 
 var $141=($R_1|0)==0;
 if($141){var $p_0=$25;var $psize_0=$26;label=56;break;}else{label=44;break;}
 case 44: 
 var $143=$R_1;
 var $144=HEAP32[((4112)>>2)];
 var $145=($143>>>0)<($144>>>0);
 if($145){label=53;break;}else{label=45;break;}
 case 45: 
 var $147=(($R_1+24)|0);
 HEAP32[(($147)>>2)]=$72;
 var $_sum42=((($_sum3)+(16))|0);
 var $148=(($mem+$_sum42)|0);
 var $149=$148;
 var $150=HEAP32[(($149)>>2)];
 var $151=($150|0)==0;
 if($151){label=49;break;}else{label=46;break;}
 case 46: 
 var $153=$150;
 var $154=HEAP32[((4112)>>2)];
 var $155=($153>>>0)<($154>>>0);
 if($155){label=48;break;}else{label=47;break;}
 case 47: 
 var $157=(($R_1+16)|0);
 HEAP32[(($157)>>2)]=$150;
 var $158=(($150+24)|0);
 HEAP32[(($158)>>2)]=$R_1;
 label=49;break;
 case 48: 
 _abort();
 throw "Reached an unreachable!";
 case 49: 
 var $_sum43=((($_sum3)+(20))|0);
 var $161=(($mem+$_sum43)|0);
 var $162=$161;
 var $163=HEAP32[(($162)>>2)];
 var $164=($163|0)==0;
 if($164){var $p_0=$25;var $psize_0=$26;label=56;break;}else{label=50;break;}
 case 50: 
 var $166=$163;
 var $167=HEAP32[((4112)>>2)];
 var $168=($166>>>0)<($167>>>0);
 if($168){label=52;break;}else{label=51;break;}
 case 51: 
 var $170=(($R_1+20)|0);
 HEAP32[(($170)>>2)]=$163;
 var $171=(($163+24)|0);
 HEAP32[(($171)>>2)]=$R_1;
 var $p_0=$25;var $psize_0=$26;label=56;break;
 case 52: 
 _abort();
 throw "Reached an unreachable!";
 case 53: 
 _abort();
 throw "Reached an unreachable!";
 case 54: 
 var $_sum4=((($14)-(4))|0);
 var $175=(($mem+$_sum4)|0);
 var $176=$175;
 var $177=HEAP32[(($176)>>2)];
 var $178=$177&3;
 var $179=($178|0)==3;
 if($179){label=55;break;}else{var $p_0=$25;var $psize_0=$26;label=56;break;}
 case 55: 
 HEAP32[((4104)>>2)]=$26;
 var $181=HEAP32[(($176)>>2)];
 var $182=$181&-2;
 HEAP32[(($176)>>2)]=$182;
 var $183=$26|1;
 var $_sum35=((($_sum3)+(4))|0);
 var $184=(($mem+$_sum35)|0);
 var $185=$184;
 HEAP32[(($185)>>2)]=$183;
 var $186=$15;
 HEAP32[(($186)>>2)]=$26;
 label=141;break;
 case 56: 
 var $psize_0;
 var $p_0;
 var $188=$p_0;
 var $189=($188>>>0)<($15>>>0);
 if($189){label=57;break;}else{label=140;break;}
 case 57: 
 var $_sum34=((($14)-(4))|0);
 var $191=(($mem+$_sum34)|0);
 var $192=$191;
 var $193=HEAP32[(($192)>>2)];
 var $194=$193&1;
 var $phitmp=($194|0)==0;
 if($phitmp){label=140;break;}else{label=58;break;}
 case 58: 
 var $196=$193&2;
 var $197=($196|0)==0;
 if($197){label=59;break;}else{label=112;break;}
 case 59: 
 var $199=HEAP32[((4120)>>2)];
 var $200=($16|0)==($199|0);
 if($200){label=60;break;}else{label=62;break;}
 case 60: 
 var $202=HEAP32[((4108)>>2)];
 var $203=((($202)+($psize_0))|0);
 HEAP32[((4108)>>2)]=$203;
 HEAP32[((4120)>>2)]=$p_0;
 var $204=$203|1;
 var $205=(($p_0+4)|0);
 HEAP32[(($205)>>2)]=$204;
 var $206=HEAP32[((4116)>>2)];
 var $207=($p_0|0)==($206|0);
 if($207){label=61;break;}else{label=141;break;}
 case 61: 
 HEAP32[((4116)>>2)]=0;
 HEAP32[((4104)>>2)]=0;
 label=141;break;
 case 62: 
 var $210=HEAP32[((4116)>>2)];
 var $211=($16|0)==($210|0);
 if($211){label=63;break;}else{label=64;break;}
 case 63: 
 var $213=HEAP32[((4104)>>2)];
 var $214=((($213)+($psize_0))|0);
 HEAP32[((4104)>>2)]=$214;
 HEAP32[((4116)>>2)]=$p_0;
 var $215=$214|1;
 var $216=(($p_0+4)|0);
 HEAP32[(($216)>>2)]=$215;
 var $217=(($188+$214)|0);
 var $218=$217;
 HEAP32[(($218)>>2)]=$214;
 label=141;break;
 case 64: 
 var $220=$193&-8;
 var $221=((($220)+($psize_0))|0);
 var $222=$193>>>3;
 var $223=($193>>>0)<256;
 if($223){label=65;break;}else{label=77;break;}
 case 65: 
 var $225=(($mem+$14)|0);
 var $226=$225;
 var $227=HEAP32[(($226)>>2)];
 var $_sum2829=$14|4;
 var $228=(($mem+$_sum2829)|0);
 var $229=$228;
 var $230=HEAP32[(($229)>>2)];
 var $231=$222<<1;
 var $232=((4136+($231<<2))|0);
 var $233=$232;
 var $234=($227|0)==($233|0);
 if($234){label=68;break;}else{label=66;break;}
 case 66: 
 var $236=$227;
 var $237=HEAP32[((4112)>>2)];
 var $238=($236>>>0)<($237>>>0);
 if($238){label=76;break;}else{label=67;break;}
 case 67: 
 var $240=(($227+12)|0);
 var $241=HEAP32[(($240)>>2)];
 var $242=($241|0)==($16|0);
 if($242){label=68;break;}else{label=76;break;}
 case 68: 
 var $243=($230|0)==($227|0);
 if($243){label=69;break;}else{label=70;break;}
 case 69: 
 var $245=1<<$222;
 var $246=$245^-1;
 var $247=HEAP32[((4096)>>2)];
 var $248=$247&$246;
 HEAP32[((4096)>>2)]=$248;
 label=110;break;
 case 70: 
 var $250=($230|0)==($233|0);
 if($250){label=71;break;}else{label=72;break;}
 case 71: 
 var $_pre82=(($230+8)|0);
 var $_pre_phi83=$_pre82;label=74;break;
 case 72: 
 var $252=$230;
 var $253=HEAP32[((4112)>>2)];
 var $254=($252>>>0)<($253>>>0);
 if($254){label=75;break;}else{label=73;break;}
 case 73: 
 var $256=(($230+8)|0);
 var $257=HEAP32[(($256)>>2)];
 var $258=($257|0)==($16|0);
 if($258){var $_pre_phi83=$256;label=74;break;}else{label=75;break;}
 case 74: 
 var $_pre_phi83;
 var $259=(($227+12)|0);
 HEAP32[(($259)>>2)]=$230;
 HEAP32[(($_pre_phi83)>>2)]=$227;
 label=110;break;
 case 75: 
 _abort();
 throw "Reached an unreachable!";
 case 76: 
 _abort();
 throw "Reached an unreachable!";
 case 77: 
 var $261=$15;
 var $_sum6=((($14)+(16))|0);
 var $262=(($mem+$_sum6)|0);
 var $263=$262;
 var $264=HEAP32[(($263)>>2)];
 var $_sum78=$14|4;
 var $265=(($mem+$_sum78)|0);
 var $266=$265;
 var $267=HEAP32[(($266)>>2)];
 var $268=($267|0)==($261|0);
 if($268){label=83;break;}else{label=78;break;}
 case 78: 
 var $270=(($mem+$14)|0);
 var $271=$270;
 var $272=HEAP32[(($271)>>2)];
 var $273=$272;
 var $274=HEAP32[((4112)>>2)];
 var $275=($273>>>0)<($274>>>0);
 if($275){label=82;break;}else{label=79;break;}
 case 79: 
 var $277=(($272+12)|0);
 var $278=HEAP32[(($277)>>2)];
 var $279=($278|0)==($261|0);
 if($279){label=80;break;}else{label=82;break;}
 case 80: 
 var $281=(($267+8)|0);
 var $282=HEAP32[(($281)>>2)];
 var $283=($282|0)==($261|0);
 if($283){label=81;break;}else{label=82;break;}
 case 81: 
 HEAP32[(($277)>>2)]=$267;
 HEAP32[(($281)>>2)]=$272;
 var $R7_1=$267;label=90;break;
 case 82: 
 _abort();
 throw "Reached an unreachable!";
 case 83: 
 var $_sum10=((($14)+(12))|0);
 var $286=(($mem+$_sum10)|0);
 var $287=$286;
 var $288=HEAP32[(($287)>>2)];
 var $289=($288|0)==0;
 if($289){label=84;break;}else{var $R7_0=$288;var $RP9_0=$287;label=85;break;}
 case 84: 
 var $_sum9=((($14)+(8))|0);
 var $291=(($mem+$_sum9)|0);
 var $292=$291;
 var $293=HEAP32[(($292)>>2)];
 var $294=($293|0)==0;
 if($294){var $R7_1=0;label=90;break;}else{var $R7_0=$293;var $RP9_0=$292;label=85;break;}
 case 85: 
 var $RP9_0;
 var $R7_0;
 var $295=(($R7_0+20)|0);
 var $296=HEAP32[(($295)>>2)];
 var $297=($296|0)==0;
 if($297){label=86;break;}else{var $R7_0=$296;var $RP9_0=$295;label=85;break;}
 case 86: 
 var $299=(($R7_0+16)|0);
 var $300=HEAP32[(($299)>>2)];
 var $301=($300|0)==0;
 if($301){label=87;break;}else{var $R7_0=$300;var $RP9_0=$299;label=85;break;}
 case 87: 
 var $303=$RP9_0;
 var $304=HEAP32[((4112)>>2)];
 var $305=($303>>>0)<($304>>>0);
 if($305){label=89;break;}else{label=88;break;}
 case 88: 
 HEAP32[(($RP9_0)>>2)]=0;
 var $R7_1=$R7_0;label=90;break;
 case 89: 
 _abort();
 throw "Reached an unreachable!";
 case 90: 
 var $R7_1;
 var $309=($264|0)==0;
 if($309){label=110;break;}else{label=91;break;}
 case 91: 
 var $_sum21=((($14)+(20))|0);
 var $311=(($mem+$_sum21)|0);
 var $312=$311;
 var $313=HEAP32[(($312)>>2)];
 var $314=((4400+($313<<2))|0);
 var $315=HEAP32[(($314)>>2)];
 var $316=($261|0)==($315|0);
 if($316){label=92;break;}else{label=94;break;}
 case 92: 
 HEAP32[(($314)>>2)]=$R7_1;
 var $cond69=($R7_1|0)==0;
 if($cond69){label=93;break;}else{label=100;break;}
 case 93: 
 var $318=1<<$313;
 var $319=$318^-1;
 var $320=HEAP32[((4100)>>2)];
 var $321=$320&$319;
 HEAP32[((4100)>>2)]=$321;
 label=110;break;
 case 94: 
 var $323=$264;
 var $324=HEAP32[((4112)>>2)];
 var $325=($323>>>0)<($324>>>0);
 if($325){label=98;break;}else{label=95;break;}
 case 95: 
 var $327=(($264+16)|0);
 var $328=HEAP32[(($327)>>2)];
 var $329=($328|0)==($261|0);
 if($329){label=96;break;}else{label=97;break;}
 case 96: 
 HEAP32[(($327)>>2)]=$R7_1;
 label=99;break;
 case 97: 
 var $332=(($264+20)|0);
 HEAP32[(($332)>>2)]=$R7_1;
 label=99;break;
 case 98: 
 _abort();
 throw "Reached an unreachable!";
 case 99: 
 var $335=($R7_1|0)==0;
 if($335){label=110;break;}else{label=100;break;}
 case 100: 
 var $337=$R7_1;
 var $338=HEAP32[((4112)>>2)];
 var $339=($337>>>0)<($338>>>0);
 if($339){label=109;break;}else{label=101;break;}
 case 101: 
 var $341=(($R7_1+24)|0);
 HEAP32[(($341)>>2)]=$264;
 var $_sum22=((($14)+(8))|0);
 var $342=(($mem+$_sum22)|0);
 var $343=$342;
 var $344=HEAP32[(($343)>>2)];
 var $345=($344|0)==0;
 if($345){label=105;break;}else{label=102;break;}
 case 102: 
 var $347=$344;
 var $348=HEAP32[((4112)>>2)];
 var $349=($347>>>0)<($348>>>0);
 if($349){label=104;break;}else{label=103;break;}
 case 103: 
 var $351=(($R7_1+16)|0);
 HEAP32[(($351)>>2)]=$344;
 var $352=(($344+24)|0);
 HEAP32[(($352)>>2)]=$R7_1;
 label=105;break;
 case 104: 
 _abort();
 throw "Reached an unreachable!";
 case 105: 
 var $_sum23=((($14)+(12))|0);
 var $355=(($mem+$_sum23)|0);
 var $356=$355;
 var $357=HEAP32[(($356)>>2)];
 var $358=($357|0)==0;
 if($358){label=110;break;}else{label=106;break;}
 case 106: 
 var $360=$357;
 var $361=HEAP32[((4112)>>2)];
 var $362=($360>>>0)<($361>>>0);
 if($362){label=108;break;}else{label=107;break;}
 case 107: 
 var $364=(($R7_1+20)|0);
 HEAP32[(($364)>>2)]=$357;
 var $365=(($357+24)|0);
 HEAP32[(($365)>>2)]=$R7_1;
 label=110;break;
 case 108: 
 _abort();
 throw "Reached an unreachable!";
 case 109: 
 _abort();
 throw "Reached an unreachable!";
 case 110: 
 var $368=$221|1;
 var $369=(($p_0+4)|0);
 HEAP32[(($369)>>2)]=$368;
 var $370=(($188+$221)|0);
 var $371=$370;
 HEAP32[(($371)>>2)]=$221;
 var $372=HEAP32[((4116)>>2)];
 var $373=($p_0|0)==($372|0);
 if($373){label=111;break;}else{var $psize_1=$221;label=113;break;}
 case 111: 
 HEAP32[((4104)>>2)]=$221;
 label=141;break;
 case 112: 
 var $376=$193&-2;
 HEAP32[(($192)>>2)]=$376;
 var $377=$psize_0|1;
 var $378=(($p_0+4)|0);
 HEAP32[(($378)>>2)]=$377;
 var $379=(($188+$psize_0)|0);
 var $380=$379;
 HEAP32[(($380)>>2)]=$psize_0;
 var $psize_1=$psize_0;label=113;break;
 case 113: 
 var $psize_1;
 var $382=$psize_1>>>3;
 var $383=($psize_1>>>0)<256;
 if($383){label=114;break;}else{label=119;break;}
 case 114: 
 var $385=$382<<1;
 var $386=((4136+($385<<2))|0);
 var $387=$386;
 var $388=HEAP32[((4096)>>2)];
 var $389=1<<$382;
 var $390=$388&$389;
 var $391=($390|0)==0;
 if($391){label=115;break;}else{label=116;break;}
 case 115: 
 var $393=$388|$389;
 HEAP32[((4096)>>2)]=$393;
 var $_sum19_pre=((($385)+(2))|0);
 var $_pre=((4136+($_sum19_pre<<2))|0);
 var $F16_0=$387;var $_pre_phi=$_pre;label=118;break;
 case 116: 
 var $_sum20=((($385)+(2))|0);
 var $395=((4136+($_sum20<<2))|0);
 var $396=HEAP32[(($395)>>2)];
 var $397=$396;
 var $398=HEAP32[((4112)>>2)];
 var $399=($397>>>0)<($398>>>0);
 if($399){label=117;break;}else{var $F16_0=$396;var $_pre_phi=$395;label=118;break;}
 case 117: 
 _abort();
 throw "Reached an unreachable!";
 case 118: 
 var $_pre_phi;
 var $F16_0;
 HEAP32[(($_pre_phi)>>2)]=$p_0;
 var $402=(($F16_0+12)|0);
 HEAP32[(($402)>>2)]=$p_0;
 var $403=(($p_0+8)|0);
 HEAP32[(($403)>>2)]=$F16_0;
 var $404=(($p_0+12)|0);
 HEAP32[(($404)>>2)]=$387;
 label=141;break;
 case 119: 
 var $406=$p_0;
 var $407=$psize_1>>>8;
 var $408=($407|0)==0;
 if($408){var $I18_0=0;label=122;break;}else{label=120;break;}
 case 120: 
 var $410=($psize_1>>>0)>16777215;
 if($410){var $I18_0=31;label=122;break;}else{label=121;break;}
 case 121: 
 var $412=((($407)+(1048320))|0);
 var $413=$412>>>16;
 var $414=$413&8;
 var $415=$407<<$414;
 var $416=((($415)+(520192))|0);
 var $417=$416>>>16;
 var $418=$417&4;
 var $419=$418|$414;
 var $420=$415<<$418;
 var $421=((($420)+(245760))|0);
 var $422=$421>>>16;
 var $423=$422&2;
 var $424=$419|$423;
 var $425=(((14)-($424))|0);
 var $426=$420<<$423;
 var $427=$426>>>15;
 var $428=((($425)+($427))|0);
 var $429=$428<<1;
 var $430=((($428)+(7))|0);
 var $431=$psize_1>>>($430>>>0);
 var $432=$431&1;
 var $433=$432|$429;
 var $I18_0=$433;label=122;break;
 case 122: 
 var $I18_0;
 var $435=((4400+($I18_0<<2))|0);
 var $436=(($p_0+28)|0);
 var $I18_0_c=$I18_0;
 HEAP32[(($436)>>2)]=$I18_0_c;
 var $437=(($p_0+20)|0);
 HEAP32[(($437)>>2)]=0;
 var $438=(($p_0+16)|0);
 HEAP32[(($438)>>2)]=0;
 var $439=HEAP32[((4100)>>2)];
 var $440=1<<$I18_0;
 var $441=$439&$440;
 var $442=($441|0)==0;
 if($442){label=123;break;}else{label=124;break;}
 case 123: 
 var $444=$439|$440;
 HEAP32[((4100)>>2)]=$444;
 HEAP32[(($435)>>2)]=$406;
 var $445=(($p_0+24)|0);
 var $_c=$435;
 HEAP32[(($445)>>2)]=$_c;
 var $446=(($p_0+12)|0);
 HEAP32[(($446)>>2)]=$p_0;
 var $447=(($p_0+8)|0);
 HEAP32[(($447)>>2)]=$p_0;
 label=137;break;
 case 124: 
 var $449=HEAP32[(($435)>>2)];
 var $450=($I18_0|0)==31;
 if($450){var $455=0;label=126;break;}else{label=125;break;}
 case 125: 
 var $452=$I18_0>>>1;
 var $453=(((25)-($452))|0);
 var $455=$453;label=126;break;
 case 126: 
 var $455;
 var $456=(($449+4)|0);
 var $457=HEAP32[(($456)>>2)];
 var $458=$457&-8;
 var $459=($458|0)==($psize_1|0);
 if($459){var $T_0_lcssa=$449;label=133;break;}else{label=127;break;}
 case 127: 
 var $460=$psize_1<<$455;
 var $T_071=$449;var $K19_072=$460;label=129;break;
 case 128: 
 var $462=$K19_072<<1;
 var $463=(($470+4)|0);
 var $464=HEAP32[(($463)>>2)];
 var $465=$464&-8;
 var $466=($465|0)==($psize_1|0);
 if($466){var $T_0_lcssa=$470;label=133;break;}else{var $T_071=$470;var $K19_072=$462;label=129;break;}
 case 129: 
 var $K19_072;
 var $T_071;
 var $468=$K19_072>>>31;
 var $469=(($T_071+16+($468<<2))|0);
 var $470=HEAP32[(($469)>>2)];
 var $471=($470|0)==0;
 if($471){label=130;break;}else{label=128;break;}
 case 130: 
 var $473=$469;
 var $474=HEAP32[((4112)>>2)];
 var $475=($473>>>0)<($474>>>0);
 if($475){label=132;break;}else{label=131;break;}
 case 131: 
 HEAP32[(($469)>>2)]=$406;
 var $477=(($p_0+24)|0);
 var $T_0_c16=$T_071;
 HEAP32[(($477)>>2)]=$T_0_c16;
 var $478=(($p_0+12)|0);
 HEAP32[(($478)>>2)]=$p_0;
 var $479=(($p_0+8)|0);
 HEAP32[(($479)>>2)]=$p_0;
 label=137;break;
 case 132: 
 _abort();
 throw "Reached an unreachable!";
 case 133: 
 var $T_0_lcssa;
 var $481=(($T_0_lcssa+8)|0);
 var $482=HEAP32[(($481)>>2)];
 var $483=$T_0_lcssa;
 var $484=HEAP32[((4112)>>2)];
 var $485=($483>>>0)<($484>>>0);
 if($485){label=136;break;}else{label=134;break;}
 case 134: 
 var $487=$482;
 var $488=($487>>>0)<($484>>>0);
 if($488){label=136;break;}else{label=135;break;}
 case 135: 
 var $490=(($482+12)|0);
 HEAP32[(($490)>>2)]=$406;
 HEAP32[(($481)>>2)]=$406;
 var $491=(($p_0+8)|0);
 var $_c15=$482;
 HEAP32[(($491)>>2)]=$_c15;
 var $492=(($p_0+12)|0);
 var $T_0_c=$T_0_lcssa;
 HEAP32[(($492)>>2)]=$T_0_c;
 var $493=(($p_0+24)|0);
 HEAP32[(($493)>>2)]=0;
 label=137;break;
 case 136: 
 _abort();
 throw "Reached an unreachable!";
 case 137: 
 var $495=HEAP32[((4128)>>2)];
 var $496=((($495)-(1))|0);
 HEAP32[((4128)>>2)]=$496;
 var $497=($496|0)==0;
 if($497){var $sp_0_in_i=4552;label=138;break;}else{label=141;break;}
 case 138: 
 var $sp_0_in_i;
 var $sp_0_i=HEAP32[(($sp_0_in_i)>>2)];
 var $498=($sp_0_i|0)==0;
 var $499=(($sp_0_i+8)|0);
 if($498){label=139;break;}else{var $sp_0_in_i=$499;label=138;break;}
 case 139: 
 HEAP32[((4128)>>2)]=-1;
 label=141;break;
 case 140: 
 _abort();
 throw "Reached an unreachable!";
 case 141: 
 return;
  default: assert(0, "bad label: " + label);
 }

}
Module["_free"] = _free;

function __ZNSt9bad_allocC2Ev($this){
 var label=0;


 var $1=(($this)|0);
 HEAP32[(($1)>>2)]=56;
 return;
}


function __ZNSt9bad_allocD0Ev($this){
 var label=0;


 var $1=(($this)|0);

 var $2=$this;
 __ZdlPv($2);
 return;
}


function __ZNSt9bad_allocD2Ev($this){
 var label=0;


 var $1=(($this)|0);

 return;
}


function __ZNKSt9bad_alloc4whatEv($this){
 var label=0;


 return 8;
}


function _memcmp($vl,$vr,$n){
 var label=0;

 label = 1; 
 while(1)switch(label){
 case 1: 
 var $1=($n|0)==0;
 if($1){var $14=0;label=5;break;}else{var $_03=$n;var $l_04=$vl;var $r_05=$vr;label=2;break;}
 case 2: 
 var $r_05;
 var $l_04;
 var $_03;
 var $2=HEAP8[(($l_04)>>0)];
 var $3=HEAP8[(($r_05)>>0)];
 var $4=(($2<<24)>>24)==(($3<<24)>>24);
 if($4){label=3;break;}else{label=4;break;}
 case 3: 
 var $6=((($_03)-(1))|0);
 var $7=(($l_04+1)|0);
 var $8=(($r_05+1)|0);
 var $9=($6|0)==0;
 if($9){var $14=0;label=5;break;}else{var $_03=$6;var $l_04=$7;var $r_05=$8;label=2;break;}
 case 4: 
 var $11=($2&255);
 var $12=($3&255);
 var $13=((($11)-($12))|0);
 var $14=$13;label=5;break;
 case 5: 
 var $14;
 return $14;
  default: assert(0, "bad label: " + label);
 }

}



// EMSCRIPTEN_END_FUNCS
// EMSCRIPTEN_END_FUNCS

// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}



//# sourceMappingURL=microflo-runtime.html.map