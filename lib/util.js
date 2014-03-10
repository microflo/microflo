/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2014 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

exports.isBrowser = function() {
  return !(typeof(process) !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1)
}
