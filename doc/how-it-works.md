
Understanding how MicroFlo is built
======================================

It may seem like magic, but in reality it is unicorns. All the way down.

Build & initial graph
---------------------

The MicroFlo engine + a set of components (all standard C/C++) are compiled into a binary,
using a normal compiler toolchain.

    gcc -o .....

An initial graph can be specified (as .json or .fbp).
Can be created using a visual tool like [Flowhub](http://flowhub.io) or DrawFBP.

    # examples/blink.fbp 
    timer(Timer) OUT -> IN toggle(ToggleBoolean)
    toggle() OUT -> IN led(DigitalWrite)
    '300' -> INTERVAL timer()
    '13' -> PIN led()

It gets converted by a command-line tool into an compact binary "command stream".
The commands are create-node/add-edge/send-initial-packet etc.
[Definition of all commands](../microflo/commandformat.json).

    node microflo generate build/avr/firmware.cpp avr8

The command stream is embedded into the firmware image itself, as static data in RAM or FLASH (progmem).
[EEPROM support planned](https://github.com/jonnor/microflo/issues/7).

Here is an annotated example. The first byte specifies which command it is.

    // build/avr/firmware.cpp 
    #include <avr/pgmspace.h>
    const unsigned char graph[] PROGMEM = {
     
    0xa,0x0,0x0,0x0,0x0,0x0,0x0,0x0, // stop network, clear old graph
    0xf,0x1,0x0,0x0,0x0,0x0,0x0,0x0, // configure debug level etc
    0xb,0x7,0x0,0x0,0x0,0x0,0x0,0x0, // create node of component 0x7. This becomes node 0x1, next one 0x2 etc
    0xb,0xb,0x0,0x0,0x0,0x0,0x0,0x0,
    0xb,0x5,0x0,0x0,0x0,0x0,0x0,0x0,
    0xc,0x1,0x2,0x0,0x0,0x0,0x0,0x0, // connect node 0x1, outport 0x0 to node 0x2, inport 0x0
    0xc,0x2,0x3,0x0,0x0,0x0,0x0,0x0,
    0xd,0x1,0x0,0x7,0x2c,0x1,0x0,0x0, // send an initial packet of type 0x7 (integer) with data 0x2c,0x1,0x0,0x0 to inport 0x0
    0xd,0x3,0x1,0x7,0xd,0x0,0x0,0x0,
    0x14,0x0,0x0,0x0,0x0,0x0,0x0,0x0 // start network
     
    };
    #define MICROFLO_EMBED_GRAPH
    #include "microflo.h"
    #include "main.hpp"


When the program starts, the MicroFlo engine will parse the command-stream,
load the graph and then start the network.

Network execution
------------------

The started network *executes entirely on the device, standalone*.

    TODO: Document component APIs, execution model
    TODO: Document message queues, passing etc
    TODO: Document I/O hardware abstraction layer


Host<->device communication
------------------------

After loading the command stream which was "baked in",
MicroFlo will start listening for commands (same format) from a host.

The host<->device transport is *configurable and extendable*.
Currently supported are serial/UART-based: USB/Bluetooth/RS232/RS485 etc.
Support for an [IP-based transport is planned](https://github.com/jonnor/microflo/issues/38).

The host can send commands on the same format as was baked into the initial progam.
It can:

* Introspect the running network, including data flowing between nodes
* Change current graph and start/stop the network
* Send and receive packets on exported in/outports of graph

Interactive programming with Flowhub
-------------------------------------

MicroFlo also includes some host code which implements the FBP runtime protocol.
It can run either on node.js or in browser.
This translates message into the command stream understood by MicroFlo devices.

This allows the [Flowhub](http://flowhub.io) visual progamming IDE to interactively
reprogram the graphs on the device.

    TODO: screenshot


Hardware abstraction
---------------------

MicroFlo is very portable and has [support for multiple platforms](./bringup.md).

Simulator
----------

Use the same I/O abstraction as for different hardware target.
I/O backend sends commands across the command-stream protocol instead of to real hardware.

One can build automated tests against this simulator. Using high-level languages like CoffeeScript
![Automated tests of MicroFlo program](https://pbs.twimg.com/media/Be7H7DiCIAA9nvX.png)

Support for [on-device testing](https://github.com/jonnor/microflo/issues/13) is planned.
An interactive [user interface is planned](https://github.com/jonnor/microflo/issues/9).

