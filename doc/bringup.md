
MicroFlo: board/microcontroller bringup
=================================

MicroFlo is very portable and can run bare-metal on microcontroller
families from multiple vendors, as well as in standard desktop OSes and in a web browser.
This document describes the overall process of porting MicroFlo to run on a new device.
If you have any issues, [get in touch](../README.md#contact).

Minimally useful support for a new hardware requires adding
* An I/O backend
* Firmware entry point
* Default program graph

Optionally, you may want to add
* Custom host transport
* Device-specific components

In the future, one may also include UI components for the interactive simulator.

Supported
----------------

* [Arduino](./arduino-getstarted.md), both AVR devices and others
* [Embedded Linux](./linux-getstarted.md)
* ARM Cortex M0-M4
* Simulator ([no UI yet](https://github.com/jonnor/microflo/issues/9))
Running on node.js and browser, compiled to JavaScript using Emscripten.

Planned devices
----------------
See [platform wishlist](https://github.com/jonnor/microflo/issues/24).
Feel free to share your wishes and plans there.


Getting started
---------------
Highly recommended: build, install and run MicroFlo on one of the existing
platforms, like Arduino, before attempting a port.

Have a look at the platform implementations that comes [included with MicroFlo](../microflo).

Program graph
-------------------
Create a `blink.fbp` file under to serve as the default program.
`examples/blink.fbp` can be used as a starting point.

Pass this file to microflo.js generate in the build system to embed the graph commandstream
into program memory, so it can be read on startup.

I/O backend
------------
The I/O backend is the main platform abstraction layer in MicroFlo, and gives
access to common pheripirals.

Add a file `$PLATFORM.hpp`, with an implementation of the *IO* based class.
See microflo/arduino.hpp for an example.

Recommended: Start with digital write, timer and digital read before continuing
to more advanced I/O functions. Implementing serial support early is useful, because
then you can use the `SerialHostTransport` to communicate with the runtime from the host.

Note: the numeric identifiers used for pins in the IO interface can be defined any way
you like. On Arduino these map to the pin numbers used by the Arduino interface, or for
AVR pin 0 is PORTA.0, 1 is PORTA.1, 8 is PORTB.0 and so on.

Firmware entry point
---------------
The firmware entry point is the function which sets up and runs MicroFlo, typically by providing `main()`.
It should:

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

