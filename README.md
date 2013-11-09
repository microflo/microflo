MicroFlo: flow-based programming for microcontrollers
========================================================
[![Build Status](https://travis-ci.org/jonnor/microflo.png?branch=master)](https://travis-ci.org/jonnor/microflo)

Implementation of [Flow-based programming](http://en.wikipedia.org/wiki/Flow-based_programming).
Inspired by and designed for integration with [NoFlo](http://noflojs.org/).
First hardware target will be [Arduino](http://arduino.cc)-compatible boards.

Different from most other physical computing involving Node/JavaScript in that it
aims to allow build _standalone_ microcontroller applications, that can also be reconfigured at runtime.

Contact
----------
[Flow Based Programming Google Group](https://groups.google.com/forum/#!forum/flow-based-programming)

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
* 0.2.0, "Runtime reconfigurable": Graphs can be uploaded from commandline without reflashing, and persisted to EEPROM
* 0.3.0, "Visually programmable": Graphs can be uploaded from NoFlo UI, and monitored
* 0.4.0, "Simulated": One can program and test MicroFlo programs in a simulator, before putting it on device
* 0.5.0, "Hetrogenous FBP": MicroFlo as components in NoFlo, allows a host FBP program to (re)configure the device
* 0.?.0, "Generally useful": Implements Firmata protocol, most of Arduino tutorials works

TODO
-----
    git grep -E 'TODO|FIXME|XXX|IDEA|PERF'


Using/developing
-----------------
Tested on
* Arch Linux and Ubuntu (any GNU/Linux should be OK),
* Mac OSX 10.8 Mountain Lion (10.6 -> 10.9 should be OK)

Note: Does not work on Windows atm, [Ino](http://inotool.org/#limitations) does not support it.

Note: Only tested with Arduino Uno R3 and Arduino Nano R3. Other Arduino devices should however work.

Get the code

    git clone https://github.com/jonnor/microflo.git
    cd microflo

Install prerequsites; Arduino and Ino

    apt-get install arduino # Ubuntu
    # On OSX, download Arduino.app, move to /Applications
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

When you find issues: [file bugs](https://github.com/jonnor/microflo/issues)
and/or submit [pull requests](https://github.com/jonnor/microflo/pulls)!

License
-------
MIT for the code in MicroFlo, see [./LICENSE](./LICENSE).

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

Contributors
-------------
[Jon Nordby](http://www.jonnor.com)


Related
---------

Flow-based/dataflow concepts

* http://www.jpaulmorrison.com/fbp/
* http://c2.com/cgi/wiki?FlowBasedProgramming
* http://www.reddit.com/r/flowbasedprogramming/

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
* http://sourceforge.net/projects/ktechlab (poorly maintained)
* http://www.flowol.com/InterfaceArduino.aspx (non-free)
* http://microuml.net/microuml.html (non-free service)

Other notable dataflow programming environments

* http://puredata.info
* http://en.wikipedia.org/wiki/Simulink (dsp, non-free)
* http://en.wikipedia.org/wiki/Labview (dsp, non-free)
* http://en.wikipedia.org/wiki/Reaktor (audio, non-free)
* http://en.wikipedia.org/wiki/Quartz_Composer (graphics, non-free)
