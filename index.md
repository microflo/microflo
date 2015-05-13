---
title: "MicroFlo: flow-based programming for microcontrollers & embedded devices"
---

MicroFlo: flow-based programming for microcontrollers & embedded devices
========================================================

Implementation of [Flow-based programming](http://en.wikipedia.org/wiki/Flow-based_programming)
for microcontrollers and embedded devices.
MicroFlo supports multiple targets, including [Arduino](http://arduino.cc), Atmel AVR,
ARM Cortex M devices (mbed, TI Tiva/Stellaris), ESP8266 and Embedded Linux.

Unlike most other visually programmable systems, MicroFlo programs runs _standalone_,
does not make use of code generation, can be introspected and reconfigured at runtime,
and supports automated testing.

One can program with MicroFlo either:

* Visually, using [Flowhub](https://flowhub.io)/[NoFlo UI](https://github.com/noflo/noflo-ui)
* Textually, using the declarative [.fbp DSL](http://noflojs.org/documentation/fbp)
or [.json definition](http://noflojs.org/documentation/json)
* Programatically, by embedding it and building a graph using the C++ API

MicroFlo is designed to integrate with other FBP runtimes,
like [NoFlo](http://noflojs.org/) and [msgflo](https://github.com)

Status
-------
**Minimally useful**.
Simple programs work, most I/O on standard Arduino devices is supported,
some 50 components for various tasks exists. Minimal support for automated testing.

Suitable for those curious to play with alternative microcontroller programming models.
Probably a bit early to use it for general tasks.

MicroFlo in the wild:

* [Jon's fridge thermostat](http://www.jonnor.com/2013/09/microflo-0-1-0-and-an-arduino-powered-fridge/)
has been running uninterrupted since September 2013.
* The [Ingress table](http://bergie.iki.fi/blog/ingress-table/) at [c-base station](http://en.wikipedia.org/wiki/C-base), Berlin uses MicroFlo
to control the lights. One major upgrade/bugfix since March 2014.
* The lights on the CNC-milled Christmas tree at [Bitraf](http://bitraf.no),
Oslo ran for 4 weeks during Christmas 2013.

Contact
----------
Use the Google Group [Flow Based Programming](https://groups.google.com/forum/#!forum/flow-based-programming)
or IRC channel [#fbp@freenode.org](irc://fbp.freenode.org).
Alternatively, file issues [on Github](http://github.com/microflo/microflo/issues).

Using
---------
Get Started:
[MicroFlo for Arduino](https://github.com/microflo/microflo/blob/master/doc/arduino-getstarted.md)
[MicroFlo for Embedded Linux](https://github.com/microflo/microflo/blob/master/doc/linux-getstarted.md)


