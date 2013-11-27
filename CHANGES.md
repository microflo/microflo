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
