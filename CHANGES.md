MicroFlo 0.4.0
===========================
Released: N/A, 2014

Serial support has now been integrated in Flowhub Chrome app, starting with version 0.1.12.
[Download](https://chrome.google.com/webstore/detail/flowhub/aacpjichompfhafnciggfpfdpfododlk)

The simulator and automated tests are now using Emscripten to compile to JavaScript instead
of the node.js C++ addon, and can run also in web browser.

Several program size optimations have been made, which lets MicroFlo fit in devices with 16kB memory.
One can now specify which component set to include using `make build LIBRARY=arduino-minimal`.
A new `PureFunctionComponent2` component base-class simplifies implementation of components which
are pure functions with 2 arguments.

Also fixes compatibility with Flowhub version 0.2.0 due to stricter protocol handling
(earlier MicroFlo versions will not work).

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
