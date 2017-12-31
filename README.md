MicroFlo: Live dataflow programming for microcontrollers
========================================================
[![Build Status](https://travis-ci.org/microflo/microflo.png?branch=master)](https://travis-ci.org/microflo/microflo)

Unlike most other [dataflow](https://en.wikipedia.org/wiki/Dataflow_programming) runtimes for constrained devices,
MicroFlo run _standalone_ on the microcontroller, can be introspected and reconfigured at runtime,
and has built-in support for automated testing.

One can program with MicroFlo either:

* Visually, using [Flowhub](https://flowhub.io)
* Textually, using the declarative [.fbp DSL](http://noflojs.org/documentation/fbp)
or [.json definition](http://noflojs.org/documentation/json)
* Programatically, by embedding it and building a graph using the C++ API

MicroFlo is portable C++99 and includes support for multiple platforms,
including [Arduino](http://arduino.cc) and Embedded Linux. It has been used on many different devices,
from Atmel AVR8 to ARM Cortex M0/M1/M3/M4 devices (LPC mbed, TI Tiva/Stellaris), ESP8266 and Raspberry PI.

MicroFlo is designed to integrate with other data-driven programming tools, including
[msgflo](https://msgflo.org) for easy building of distributed systems (IoT).

Using
-----------------
For visual programming your Arduino, follow the [microflo-example-arduino](https://github.com/microflo/microflo-example-arduino).

Support
---------
[![Flowhub logo](https://flowhub.io/assets/banner-github.png)](https://flowhub.io)

MicroFlo is a part of [Flowhub](https://flowhub.io), a platform for building robust [IoT systems](https://flowhub.io/iot) and web services.<br>
We offer an [Integrated Development Environment](https://app.flowhub.io) and [consulting services](https://flowhub.io/consulting).

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

Changelog
-----------
[Past milestones](./CHANGES.md)


## Extending
For porting MicroFlo to other microcontrollers, see [how-microflo-works](./doc/how-it-works.md) and [target bringup](./doc/bringup.md).


License
-------
MicroFlo is released under the [MIT license](./LICENSE).

Note that the platform MicroFlo runs on (like Arduino), and MicroFlo components may be under other licenses!

