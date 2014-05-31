
MicroFlo board/microcontroller bringup
=================================

MicroFlo is very portable and can run bare-metal on microcontroller
families from multiple vendors, as well as in standard desktop OSes and in a web browser.
This document describes the overall process of porting MicroFlo to run on a new device.
If you have any issues, [get in touch](../README.md#contact).

Minimally useful support for a new hardware requires adding
* Build system rules
* An I/O backend
* Firmware entry point

Optionally, you may want to add
* Custom host transport
* Device-specific components

In the future, one may also include UI components for the interactive simulator.

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

I/O backend
------------
The I/O backend is the main platform abstraction layer in MicroFlo, and gives
access to common pheripirals.

Add a file microflo/$PLATFORM.hpp, with an implementation of the *IO* based class.
See microflo/arduino.hpp for an example.

Recommended: Start with digital write, timer and digital read before continuing
to more advanced I/O functions.


Upstreaming
------------
Getting your port into mainline MicroFlo is highly encouraged.
The primary criteria for inclusion, besides being useful, is that the firmware can be automatically
built on [Travis CI](http://travis-ci.org). This ensures that all supported hardware has basic level of testing.
This requires the toolchain to run on Ubuntu 12.04 64 bit, be freely redistributable, and automatically installable.

File a [pullrequest](

