MicroFlo: flow-based programming for microcontrollers
========================================================
[![Build Status](https://travis-ci.org/jonnor/microflo.png?branch=master)](https://travis-ci.org/jonnor/microflo)

Implementation of [Flow-based programming](http://en.wikipedia.org/wiki/Flow-based_programming).
Inspired by and designed for integration with [NoFlo](http://noflojs.org/).
The first hardware target is [Arduino](http://arduino.cc)-compatible boards.

Different from most other physical computing involving Node.JS/JavaScript in that it
aims to allow build _standalone_ microcontroller applications, that can also be
reconfigured at runtime and programmed visually.

One can program with MicroFlo either:
* Visually, using the [NoFlo UI](https://github.com/noflo/noflo-ui)
* Textually, using the declarative [.fbp DSL](http://noflojs.org/documentation/fbp)
or [.json definition](http://noflojs.org/documentation/json) specced by NoFlo
* Programatically, by embedding it and building a graph using the C++ API

Status
-------
**Experimental**. Simple programs work, components exists for most I/O on standard Arduino devices.
Suitable for those curious to play with alternative microcontroller programming models. Probably
too early to use it for general tasks.

Has been used to make simple applications, like a fridge which reads out temperature
using a DS1820 digital thermometer and turns on/off the cooler to maintain desired temperature.

Contact
----------
Use the Google Group [Flow Based Programming](https://groups.google.com/forum/#!forum/flow-based-programming)
or IRC channel [#fbp@freenode.org](irc://fbp.freenode.org).


Milestones
-----------

* [0.3.0](https://github.com/jonnor/microflo/issues?milestone=3), "Runtime persistable, Introspectable":
Uploaded graphs can be persisted to EEPROM, be monitored at runtime, and be composed of sub-graphs
* [0.4.0](https://github.com/jonnor/microflo/issues?milestone=4), "Hetrogenous FBP":
One can create systems using FBP in NoFlo UI which spans rich clients (browser), servers (Node.js) and microcontrollers (MicroFlo)
* 0.5.0, "Simulated":
One can program and test MicroFlo programs in a simulator, before putting it on device
* 0.?.0, "Generally useful":
Most of Arduino tutorial have been, or can easily be, reproduced
* ?.0.0, "Production quality":
A commercial product based on MicroFlo has been shipped.
* ?.0.0, "Device freedom":
An open source hardware, free software electronics product based on MicroFlo with an integrated IDE
allowing and encouraging the user to customize the code has been shipped.

[Past milestones](../CHANGES.md)

TODO
-----
    git grep -E 'TODO|FIXME|XXX|IDEA|PERF'


Using
-----------------
For visual programming your Arduino, follow the [MicroFlo for Arduino tutorial](./doc/arduino-getstarted.md).
If interested in extending MicroFlo, using it for other microcontrollers, see the next section.


Developing/Hacking
-----------------

Instructions below valid for
* Arch Linux and Ubuntu (any GNU/Linux should be OK),
* Mac OSX 10.8 Mountain Lion (10.6 -> 10.9 should be OK)

Note: Uploading as shown below not work on Windows atm, as [Ino](http://inotool.org/#limitations) does not support it.
You can however use the Arduino IDE or another tool for flashing your microcontroller.

Note: Mostly tested on Arduino Uno R3 and Arduino Nano R3. Other Arduino devices should however work.

Get the code

    git clone https://github.com/jonnor/microflo.git
    cd microflo

Install prerequsites; Arduino and Ino

    apt-get install arduino # Ubuntu
    # On OSX, download Arduino.app, move to /Applications
    pip install ino

To build and run tests

    npm install && npm test

To flash your Arduino with the MicroFlo runtime, including an embedded graph:

    make upload GRAPH=examples/blink.fbp MODEL=uno

For a list of models, use

    ino list-models

To see existing or add new components, check the files

* [./microflo/components.json](./microflo/components.json)
* [./microflo/components.cpp](./microflo/components.cpp)

To see existing or add microcontroller targets, see

* [./microflo/main.hpp](./microflo/main.hpp)
* [./microflo/arduino.hpp](./microflo/arduino.hpp)

When you find issues: [file bugs](https://github.com/jonnor/microflo/issues)
and/or submit [pull requests](https://github.com/jonnor/microflo/pulls)!

License
-------
MIT for the code in MicroFlo, see [./LICENSE](./LICENSE).

Note that MicroFlo currently uses the Arduino, DallasTemperature and OneWire libraries,
which are under the GNU LGPL.

Goals
----------
1. People should not need to understand text-based, C style programming to be able to program microcontrollers.
But those that do know it should be able to use that knowledge, and be able to mix-and-match it
with higher-level paradims within a single program.
2. It should be possible to verify correctness of a microcontroller program in an automated way,
and ideally in a hardware-independent manner.
3. It should be possible to visually debug microcontroller programs.
4. Microcontroller functionality should be reprogrammable on the fly.
5. Microcontrollers should easily integrate into and with higher-level systems:
other microcontrollers, host computers, and the Internet.
6. Microcontroller programs should be portable between different uC models and uC architectures.

Design
------
* Run on 8bit+ uCs with 32kB+ program memory and 1kB+ RAM
    * Primarily as bare-metal, but embedded Linux also possible in future
    * For initial component implementations, wrap Arduino/LUFA/etc
    * Components that are not tied to a particular I/O system shall have host-equivalents possible
* Take .fbp/.json flow definition files used by NoFlo as the canonical end-user input
    * Use NoFlo code to convert this to a more compact and easy-to-parse binary format, architecture-independent flow representation
    * Flows in binary format can be baked into the firmware image.
* Allow to introspect and manipulate graphs at runtime from a host over serial/USB/Ethernet.
    * Use a binary protocol derived from the binary graph representation for this.
* Allow a flow network to be embedded into an existing C/C++ application, provide API for manipulating
* Port and I/O configuration is stored in a central place, to easily change according to device/board deployed to.

Contributors
-------------
[Jon Nordby](http://www.jonnor.com)


