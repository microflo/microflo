/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

// Server meant to run on OpenShift as an online demo of MicroFlo

var http = require('http');
var microflo = require("./microflo");

var wsPort = process.env.OPENSHIFT_NODEJS_PORT;
var ip = process.env.OPENSHIFT_NODEJS_IP;

console.log("Trying to use port", wsPort, "and IP", ip);

microflo.setupRuntime({"parent": {"port": wsPort, "ip": ip}});
