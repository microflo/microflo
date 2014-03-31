MicroFlo 0.3.0: "Node in a Node, to infinity"
===========================
Released: Not yet

NoFlo UI updated to latest version on 'the-graph' branch, and MicroFlo gives upload feedback and
allows basic visual debugging.

New:
* One can now introspect data flowing along edges in NoFlo UI
* Upload output is now shown in NoFlo UI
* _Experimental_ Atmel AVR8 backend, without any Arduino dependencies. Tested on AT90USB1287 w/ AT90USBKEY
* Makefile now has additional variables for overriding: ARDUINO, SERIALPORT
* Host/simulator API has been extended to also cover HostCommunication/commandstream

Added components:
* LedMatrixMax, NumberEquals, BooleanAnd


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
