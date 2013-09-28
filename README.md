MicroFlo: flow-based programming for microcontrollers
========================================================
[![Build Status](https://travis-ci.org/jonnor/microflo.png?branch=master)](https://travis-ci.org/jonnor/microflo)

Implementation of [Flow-based programming](http://en.wikipedia.org/wiki/Flow-based_programming).
Inspired by and designed for integration with [NoFlo](http://noflojs.org/).
First hardware target will be [Arduino](http://arduino.cc)-compatible boards.

Different from most other physical computing involving Node/JavaScript in that it
aims to allow build _standalone_ microcontroller applications, that can also be reconfigured at runtime.

Status
-------
**Experimental**. Simple things work, but not tested thoroughly. Several things in the architecture has not been validated.
Suitable for interested hackers only, not for general consumption.

Can run simple applications defined by .fbp files,
like a fridge flow which reads out temperature using a DS1820 digital thermometer
and turns on/off the cooler to maintain desired temperature.

See [examples](./examples).

Milestones
-----------
* 0.1.5, "Introspectable": One can monitor graphs running on the device from host
* 0.2.0, "Runtime reconfigurable": Graphs can be changed on the fly
* 0.3.0, "Generally useful": Implements Firmata protocol, most of Arduino tutorials works

TODO
-----
    git grep -E 'TODO|FIXME|XXX|IDEA|PERF'


Using/developing
-----------------
Note: Only tested on Arch Linux and Ubuntu, but should work on any GNU/Linux.
May also work on Mac OSX. Windows not, as [Ino](http://inotool.org/#limitations) does not support it.

Note: Only tested with Arduino Uno R3 and Arduino Nano R3. Other Arduino devices should however work.

Get the code

    git clone https://github.com/jonnor/microflo.git
    cd microflo

Install prerequsites; Arduino and Ino

    apt-get install arduino
    pip install ino

To build and run tests

    npm install && make && make check

To flash your Arduino with a graph

    make upload GRAPH=examples/blink.fbp MODEL=uno

For a list of models, use

    ino list-models

To see existing or add new components, check the files

* [./microflo/components.json](./microflo/components.json)
* [./microflo/components.cpp](./microflo/components.cpp)

When you find issues: file bugs and/or provide patches!

License
-------
MIT for the code in MicroFlo, see ./LICENSE.
Note that MicroFlo currently relies on the Arduino, DallasTemperature and OneWire libraries,
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

Testing strategy
----------------
This is all TODO at the moment.

* MicroFlo framework
    * Behaviour tests. Graph manipulation, message passing.
    * Build tests around JavaScript interface to the MicroFlo graph.
    * Run same tests against host simulation (in subprocess) and real target (on device)
* Invidual components
    * Unittests. Component behaviour.
    * Something similar to noflo-test
    * Maybe a DSL for simple message send/expect tests.
    * Run same tests against host simulation (in subprocess) and real target (on device)
* Target implementation (I/O)
    * Functional tests. Analog/Digital in/out, Serial/UART in/out, PWM/ADC
    * Ideally automated on real hardware coupled back-to-back
* Performance
    * Benchmarks to be done on device
    * Message throughput, as function of number of nodes/edges
    * Overhead of component interface, as function of component complexity
    * Maximum number of nodes (limited by RAM usage)
    * Program size (progmem/Flash)
    * Input->output latency, average and distribution
    * Graph setup/teardown time
* Applications
    * Allow to use stub/mock I/O components, and test/simulate on host
    * Allow to build test fixtures using graphs
    * Allow to drive BDD tests on device from host in JavaScript

Contributors
-------------
[Jon Nordby](http://www.jonnor.com)


Related
---------
Physical computing with JavaScript

* https://github.com/rwaldron/johnny-five
* https://github.com/jgautier/firmata
* http://breakoutjs.com/
* https://github.com/jadonk/bonescript

Visual programming for Arduino etc.

* http://www.modk.it/
* http://blog.minibloq.org/
* http://seaside.citilab.eu/scratch/arduino
* http://sourceforge.net/projects/qpc/
* http://playground.arduino.cc/Code/QP
* http://www.flowol.com/InterfaceArduino.aspx (non-free)
* http://microuml.net/microuml.html (non-free service)
