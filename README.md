MicroFlo: flow-based programming for microcontrollers
========================================================
[![Build Status](https://travis-ci.org/microflo/microflo.png?branch=master)](https://travis-ci.org/microflo/microflo)

Implementation of [Flow-based programming](http://en.wikipedia.org/wiki/Flow-based_programming)
for microcontrollers and embedded devices.
MicroFlo supports multiple targets, including [Arduino](http://arduino.cc), Atmel AVR,
ARM Cortex M devices (mbed, TI Tiva/Stellaris), ESP8266 and Embedded Linux.

Unlike most other visually programmable systems, MicroFlo programs runs _standalone_ on the microcontroller,
does not make use of code generation, can be introspected and reconfigured at runtime,
and supports automated testing.

One can program with MicroFlo either:

* Visually, using [Flowhub](https://flowhub.io)/[NoFlo UI](https://github.com/noflo/noflo-ui)
* Textually, using the declarative [.fbp DSL](http://noflojs.org/documentation/fbp)
or [.json definition](http://noflojs.org/documentation/json)
* Programatically, by embedding it and building a graph using the C++ API

MicroFlo is designed to integrate with other FBP runtimes,
like [NoFlo](http://noflojs.org/) and [msgflo](https://github.com)

Using
-----------------
For visual programming your Arduino, follow the [microflo-example-arduino](https://github.com/microflo/microflo-example-arduino).

Status
-------
**Minimally useful**.

* Works fine for simple programs
* Components exists for standard I/O on Arduino devices
* Live programming supported for most changes
* Basic support for automated testing

MicroFlo in the wild:

* [Jon's fridge thermostat](http://www.jonnor.com/2013/09/microflo-0-1-0-and-an-arduino-powered-fridge/)
has been running uninterrupted since September 2013.
* The [Ingress table](http://bergie.iki.fi/blog/ingress-table/) at [c-base station](http://en.wikipedia.org/wiki/C-base), Berlin uses MicroFlo
to control the lights. One major upgrade/bugfix since March 2014.
* The lights on the CNC-milled Christmas tree at [Bitraf](http://bitraf.no),
Oslo ran for 4 weeks during Christmas 2013.

Contact
----------
When you find issues: [file bugs](https://github.com/microflo/microflo/issues)
and/or submit [pull requests](https://github.com/microflo/microflo/pulls)!

You can also use the Google Group [Flow Based Programming](https://groups.google.com/forum/#!forum/flow-based-programming),
make sure to mark your email with `Microflo`.

Changelog
-----------
[Past milestones](./CHANGES.md)


## Extending
For porting MicroFlo to other microcontrollers, see [how-microflo-works](,/doc/how-it-works.md) and [bringup](./doc/bringup.md).


License
-------
MicroFlo is released under the [MIT license](./LICENSE).

Note that the platform MicroFlo runs on (like Arduino), and MicroFlo components may be under other licenses!

