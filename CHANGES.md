# MicroFlo 0.4.3
Released: 10.10.207

Bugfixes

* Avoid exception and crash if on protocol errors

Added

* microflo generate `--mainfile file.hpp`, allows chosing which file to include to the firmware entrypoint (`main()` or similar).
Defaults value is based on the existing `--target ` option.
* microflo generate `--enable-maps` option, allows enabling arrays used with component/node/port/command name strings.

Platform support

* ESP8266: Experimental support for MQTT/Msgflo,
by automatically exposing exported in/outports of the graph 

# MicroFlo 0.4.2
Released: 02.08.207

Bugfixes

* Fix exception after removing node/edge

Platform support

* ESP32: Avoid using unimplemented `analogWrite` in Arduino backend on ESP32 devices

# MicroFlo 0.4.1
Released: 24.07.207

Bugfixes

* Support `--wait-connect 3` option for `microflo runtime`,
needed devices like Arduino Uno that reset upon serial connection.

Internal changes

* Bumped most NPM dependencies to latest version

# MicroFlo 0.4.0
Released: 11.07.2017

Documentation

* New Arduino tutorial available at [microflo-example-arduino](https://github.com/microflo/microflo-example-arduino#microflo-example-arduino)
* Updated README and CHANGES to reflect progress in 2015-2016

Platform support

* ESP8266: Dedicated backend removed in favor of the Arduino,
with the [ESP8266 Arduino core](https://github.com/esp8266/Arduino)

# MicroFlo 0.3.55
Released: 02.06.2017

Removed

* No longer include Arduino libraries under `thirdparty/`.
These are not used, since the components have moved out to `microflo-core`.
Users of such components are now responsible for including the libraries themselves.
* `microflo flash`. Never worked well, and uploading/flashing device is out-of-scope.
Instead users should use the upload tools included with their platform (Arduino etc).
* No longer produces Arduino library .zip. Instead users should install microflo via NPM,
and use `microflo generate` to create the Arduino sketch to open/upload.

# MicroFlo 0.3.54
Released: 01.06.2017

Bugfixes

* `microflo runtime`: No longer hangs if engine does not reply on serialport, instead times out and exits.
* `microflo runtime`: Fix live url missing host/port defaults

Removed

* component.json file for component.io package manager.
Instead use `microflo` package from `NPM`, which supports both browser and Node.js.

# MicroFlo 0.3.53
Released: 16.05.2017

New features

* `microflo runtime` outputs a Flowhub live URL for opening IDE
* Opt-in support in `microflo runtime` for signalling aliveness to Flowhub registry.
Specify a runtime id using `--id UUID` (or `MICROFLO_RUNTIME_ID` envvar),
and enable using `--ping-interval SECONDS`.

Removed

* `microflo register`. Instead Flowhub IDE will do registration when opening live URL,
or one can use the `flowhub-registry-register` CLI tool from [flowhub-registry](http://github.com/flowhub/flowhub-registry).

# MicroFlo 0.3.52
Released: 07.05.2017

Platform support

* Arduino: Baudrate used is configurable via `MICROFLO_ARDUINO_BAUDRATE`
* Tiva/Stellaris: Dedicated backend removed in favor of using Arduino, with Tiva core from Energia project
* Arduino: Implement `TimerMicros()`, used by `core/PseudoPWM`

# MicroFlo 0.3.50
Released: 10.05.2017

New features

* Added a `Error` Packet type, with a set of pre-defined errors:
`ComponentBug`, `UnsupportedType`, `UnsupportedValue`,`InvalidInput`, `OperationFailed`, `OperationTimeout` and `Other`.
Used to signal errors in components, and for error handling components.

Bugfixes

* Fix crash if attempting to remove non-existing node
* Fix exception when used with NoFlo `RemoteSubgraph` due to unsupported `connect` event

# MicroFlo 0.3.48
Released: 17.03.2017

New features

* Added a `Pointer` Packet type, a tagged boxed pointer.
Used when embedding MicroFlo and wishing to pass non-trivial datastructures through graph.
Not copyable, so packet lifetime must be (carefully!) handled by the embedding code.
Not serialize/deserializable either.

Platform support

* MQTT: Support de/serializing `float` and `byte` packets
* Linux: Serial transport working, creates a device which `microflo runtime --serial` can connect to

Testing

* Added C++ unit test setup for engine, and new packet types
* Tests now run against the native Linux backend (with serial) instead of microflo-emscripten
* Tests now have their own components under `test/components` instead of depending on microflo-core

# MicroFlo 0.3.47
Released: 17.03.2017

Bugfixes

* Fixed edge data subscriptions.
Would crash with newer Flowhub version which started sending these messages again.

# MicroFlo 0.3.45
Released: 16.03.2017

New features

* Live programming now default. Changes in Flowhub applies immediately,
no need to hit start/stop to activate the new graph.
* `microflo generate` can output `.ino` sketch
which can be opened and uploaded using the standard Arduino IDE.

Internal changes

* Removed separate `componentlib` build, was unused.
* `microflo generate` outputs absolute file paths for includes,
makes resolving them work regardless of build setup.

# MicroFlo 0.3.44
Released: 16.01.2017

New features

* *Opt-in* support for live programming, graph changes applied automatically when made

Internal changes

* Protocol commands now stored in a dispatch object
* Support start/stop command separately from network reset
* Support removing/deleting individual nodes

Platform support

* Linux

# MicroFlo 0.3.42
Released: 09.01.2017

Bugfixes

* Fix wrong format in MsgFlo discovery message. Now compatible with `msgflo 0.7+`

Internal changes

* Use Arduino IDE 1.8+ with official `arduino-builder` instead of third-party `ino` tool
* Reworked protocol handling to map FBP/FBCS messages more 1-1. Needed for future live programming support.


# MicroFlo 0.3.39
Released: 18.12.2016

New features

* More shorthand syntax in `.fbp` DSL, see [fbp 1.4 changelog](https://github.com/flowbased/fbp/blob/master/CHANGES.md#fbp-140---released-17062016)

Internal changes

* Updated to `serialport 4.x.x`

# MicroFlo 0.3.38
Released: 10.06.2016

Platform support:

* Emscripten/browser support moved to [microflo-emscripten](https://github.com/microflo/microflo-emscripten)

# MicroFlo 0.3.36
Released: 19.04.2016

Testing

* Added tests for roundtripping data to microcontroller and back (using fbp-spec)
* Run Msgflo testa against MQTT Linux support

# MicroFlo 0.3.34
Released: 19.04.2016

Platform support

* MQTT on Linux supports send/receive on exported ports

# MicroFlo 0.3.32
Released: 17.04.2016

New features

* Support define `MICROFLO_MESSAGE_LIMIT` for specifying max number of messages.
* Added `MessageQueue` API, allows to customize how messages are stored.

Bugfixes

* Fix exporting of outports which are not connected to an inport. Previously needed to workaround by sending to a `Forward`.

Platform support

* Initial Linux backend for MQTT with [Msgflo](http://msgflo.org) discovery protocol.

# MicroFlo 0.3.29
Released: 12.05.2015

*Experimental* support for ESP8266, using a custom backend.

# MicroFlo 0.3.21
Released: 03.03.2015

All host-side code converted to CoffeeScript.

# MicroFlo 0.3.18
Released: January 4, 2015

Initial support for Texas Instruments Stellaris/Tiva

# MicroFlo 0.3.14
Released: December 16, 2014

Project moved to [MicroFlo Github organization](https://github.com/microflo)


MicroFlo 0.3.3
===========================
Released: October 12, 2014

Serial support has now been integrated in Flowhub Chrome app, starting with version 0.1.12.
[Download](https://chrome.google.com/webstore/detail/flowhub/aacpjichompfhafnciggfpfdpfododlk)

The simulator and automated tests are now using Emscripten to compile to JavaScript instead
of the node.js C++ addon, and can run also in web browser.

Several program size optimations have been made, which lets MicroFlo fit in devices with 16kB memory.
One can now specify which component set to include using `make build LIBRARY=arduino-minimal`.

A new `PureFunctionComponent2` component base-class simplifies implementation of components which
are pure functions with 2 arguments.


MicroFlo 0.3.2
===========================
Released: July 5, 2014

Removed MicroFlo Chrome app in favor of integrated MicroFlo serial support
in NoFlo UI. A release of NoFlo UI is bundled with this release.


MicroFlo 0.3.1
===========================
Released: June 30, 2014

TODO: document


MicroFlo 0.3.0: "Node in a Node, to infinity"
===========================
Released: May 8, 2014

The IDE used is now the officially supported app.flowhub.io, and there is basic support for several
non-Arduino platforms. A Chrome app can act as the communications adapter between IDE and runtime on device,
making running node.js in the terminal no longer neccesary.

New:
* One can now introspect data flowing along edges in NoFlo UI
* Upload output is now shown in NoFlo UI
* _Experimental_ Atmel AVR8 backend, without any Arduino dependencies. Tested on AT90USB1287 w/ AT90USBKEY
* Basic mbed backed, tested on mbed LPC 1768
* Basic Tiva/Stellaris backed, tested on Tiva-C TM4C123G
* _Experimental_ Embedded Linux backend, using standard sysfs GPIO interface.
* Makefile now has additional variables for overriding: ARDUINO, SERIALPORT
* Host/simulator API has been extended to also cover HostCommunication/commandstream
* Programs can be automatically tested when running in simulator, driven from JavaScript/CoffeeScript

Added components:
* LedMatrixMax, LedChainWS, LedChainNeoPixel, PseudoPwmWrite, NumberEquals, BooleanAnd


MicroFlo 0.2.1
===================
Released: December 21, 2013

Installing on Mac OSX and Windows no longer requires a C++ compiler,
as node-serialport binaries for those platforms are included.

New:
* Documentation extended to cover persisting graphs on device, and creating custom components.
* Message and node capacity is now configurable at compiletime, to adapt to different devices
Example: -DMICROFLO_NODE_LIMIT=10 -DMICROFLO_MESSAGE_LIMIT=10 reduces SRAM usage to ~350 bytes

Added components:
* ReadCapacitivePin

MicroFlo 0.2.0: "The start of something visual"
===============================
Released: November 27, 2013

Visually programmmable. When using NoFlo UI, one can create MicroFlo graphs visually
and upload to an Arduino while running.

New features
* Releases now contains both an pre-made Arduino library and a customized NoFlo UI IDE.
* Added support for running on Mac OSX and Windows, in addition to GNU/Linux.
* Added a tutorial documenting how to get started with MicroFlo on Arduino devices.
* Added commandline options for configuring debug levels, serial port and WebSocket port

In addition many improvements were made to host<->microcontroller communication and runtime scalability.
Basic Node.JS bindings were added to be able to run MicroFlo programs and tests also in the host
(temporarily disabled for release).

Added components:
* AnalogRead, MonitorPin, PwmWrite, MapLinear, Split, Gate, Route, BooleanOr

Modified components:
* ToggleBoolean (added reset port), Timer (added reset port)

Removed components:
* ToString (being replaced by graph introspection/debug tools)

Known issues:
* [Upload command fails on Windows](https://github.com/jonnor/microflo/issues/14)
* [No good way to communicate with host on devices with only one serial](https://github.com/jonnor/microflo/issues/15)

MicroFlo 0.1.0: "The Fridge"
==========================
Released: September 22, 2013

Minimally useful. Can write a .fbp program implementing the thermostat and
cooler control for a fridge, without any hardcoding or hacks.
[Link](http://www.jonnor.com/2013/09/microflo-0-1-0-and-an-arduino-powered-fridge)

New features:
* Added IIP support in .fbp for configuring pins, timer intervals etc.

Added components:
* DigitalRead, InvertBoolean, ReadDallasTemperature, HysteresisLatch,
BreakBeforeMake, ArduinoUno, ToString, Delimit

MicroFlo 0.0.2: "A blink, an echo"
=========================
Released: September 9, 2013

Proof-of-concept working on an Arduino Uno. Can write .fbp program which
echos back communication on the serial port, or blinks an LED at a hardcoded interval and pin.

Added components:
* SerialIn, SerialOut, DigitalWrite, Timer, Forward
