
MicroFlo: board/microcontroller bringup
=================================

MicroFlo is very portable and can run bare-metal on microcontroller
families from multiple vendors, as well as in standard desktop OSes and in a web browser.
This document describes the overall process of porting MicroFlo to run on a new device.
If you have any issues, [get in touch](../README.md#contact).

Minimally useful support for a new hardware requires adding
* Build system rules
* An I/O backend
* Firmware entry point
* Default program graph

Optionally, you may want to add
* Custom host transport
* Device-specific components

In the future, one may also include UI components for the interactive simulator.

Supported
----------------

* [Arduino](./arduino-getstarted.md) + Atmel AVR8
* [ARM Cortex M0-M4](./arm-getstarted.md)
* [Embedded Linux](./linux-getstarted.md)
* Simulator ([no UI yet](https://github.com/jonnor/microflo/issues/9))
Running on node.js and browser, compiled to JavaScript using Emscripten.

Planned devices
----------------
See [platform wishlist](https://github.com/jonnor/microflo/issues/24).
Feel free to share your wishes and plans there.


Getting started
---------------
MicroFlo hardware support is in the main git repository. [README](../README.md).

Highly recommended: build, install and run MicroFlo on one of the existing
platforms, like Arduino, before attempting a port.


Build system
-------------
Currently a hand-written Makefile is used for building firmware.

Add at least be a target for building the firmware called *build-$PLATFORM*,
and one for packaging build artifacts for release called *release-$PLATFORM*.
$PLATFORM should be the name of the microcontroller/board family.

See targets *build-arduino*, *release-arduino* and *upload-arduino* for examples.

You might want to add a preprocessor define which is only set for your platform,
to compile platform-specific code.

Default program graph
-------------------
Create .fbp file under examples/ to serve as the default program.
examples/blink.fbp can be used as a starting point.

Pass this file to microflo.js generate in the build system to embed the commandstream
into program memory, so it can be read on startup.

I/O backend
------------
The I/O backend is the main platform abstraction layer in MicroFlo, and gives
access to common pheripirals.

Add a file microflo/$PLATFORM.hpp, with an implementation of the *IO* based class.
See microflo/arduino.hpp for an example.

Recommended: Start with digital write, timer and digital read before continuing
to more advanced I/O functions. Implementing serial support early is useful, because
then you can use the SerialHostTransport to communicate with the runtime from the host.

Note: the numeric identifiers used for pins in the IO interface can be defined any way
you like. On Arduino these map to the pin numbers used by the Arduino interface, or for
AVR pin 0 is PORTA.0, 1 is PORTA.1, 8 is PORTB.0 and so on.

Firmware entry point
---------------
The firmware entry point should be added to microflo/main.hpp. It should:

* Set up the IO backend, a Network and a HostCommunicator
* Optional: Set up the HostTransport
* Read initial MicroFlo program from persistent memory (typically progmem)
* For each iteration of the main loop, call runTick() on the network and transport

Tips & Tricks
-------------

TODO: document

Upstreaming
------------
Getting your port into mainline MicroFlo is highly encouraged.
The primary criteria for inclusion, besides being useful, is that the firmware can be automatically
built on [Travis CI](http://travis-ci.org). This ensures that all supported hardware has basic level of testing.
This requires the toolchain to run on Ubuntu 12.04 64 bit, be freely redistributable, and automatically installable.

File a [pullrequest](https://github.com/jonnor/microflo/pulls).

