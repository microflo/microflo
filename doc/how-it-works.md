
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
    const unsigned char graph[] = {
    0x75,0x43,0x2f,0x46,0x6c,0x6f,0x30,0x31, // magic string, opens communication
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
    0xe,0x0,0x0,0x0,0x0,0x0,0x0,0x0 // end-of-transmission
    };
    #define MICROFLO_EMBED_GRAPH
    #include "microflo.h"
    #include "microflo/arduino_main.hpp" // or a custom file which provides entrypoint


When the program starts, the MicroFlo engine will parse the command-stream,
load the graph and then start the network.

The network executes entirely on-device (standalone).

Packet
-------

Message sent between nodes in a graph are encapsulated into `Packet`s.
It is a simple implementation of an "any-type" (type-erasure).

Packets can contain

* *primitive data* like a (byte, integer, float, etc),
* *brackets* (which are used to group primitive data),
* special non-data packets (setup, tick) used to delegate execution time

Support for [enumerated values](https://github.com/jonnor/microflo/issues/33)
and [error values](https://github.com/jonnor/microflo/issues/6) is planned.

Component API
-------------

The nodes in a MicroFlo graph are instances of `Component`.
For components with only one output ports, the `SingleOutputComponent` convenience can be used.
Other baseclasses include `PureFunctionalComponent2`

A Component must implement one virtual function: `process()`

        class Forward : public SingleOutputComponent {
            public:
            virtual void process(Packet in, MicroFlo::PortId port) {
                if (in.isData()) {
                    send(in, port);
                }
            }
        };

Apart from adhering to this interface, components can essentially do what they want.
However, well behaved components should follow these guidelines:

* Be *inert* when constructed: do not execute anything (besides member initialization) until `process()` is called
* Do not access or store state outside of what is receives on input ports
I/O should preferrably be done using the `IO` abstraction provided by MicroFlo.
* Do not block the `process()` call for long amounts of time:
Long-running tasks should be split up across multiple invocations or done asyncronously if possible.

Component metadata
--------------------

The component metadata, like ports, of a Component is declared in a .json format.
This allows programatic access without tools having to parse and/or execute C++ code.

        "BreakBeforeMake": { "id": 16,
            "description": "Break-before-make switch logic. Monitor ports must....",
            "inPorts": {
                "in": { "id": 0 },
                "monitor1": { "id": 1 },
                "monitor2": { "id": 2 }
            },
            "outPorts": {
                "out1": { "id": 0 },
                "out2": { "id": 1 }
            }
        },

The `id` values are what is used during execution and in the command stream format.
The human-readable text definition is never stored or transmitted to the device.

I/O abstraction
-----------------

Components have access to an instance of an `IO` class, which abstracts away common hardware *I/O pheripherals*.
This includes GPIO (analog, digital), serial, timers, etc

This allows common component implementations to be used on most platforms,
and can act as as a testing surface for automated tests.

Components can of course opt to do their own I/O if desired.

Network execution
------------------

The current scheduling semantics of MicroFlo are very simple,
and matches how many bare-metal programs structure the execution of independent "modules".

    for each iteration of the main loop
        for each message in queue
            deliver message to target through process()
        for each node in running network
            deliver a tick message through process()

It is expected that scheduling will grow more complicated over time,
and [take into account](https://github.com/jonnor/microflo/issues/39):

* Per-connection limitations on number of packets
* Asyncronous input events/interrupts
* Time-deterministic execution of an entire flow (for real-time use)
* (possibly) Ensuring fair division of processing time between components


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

Command stream -> human names
---------------------------------------

When building the command stream, a node and component map is kept in memory.
This can be used to look up the human readable string names from the numeric ids.
The maps are [currently not persisted](https://github.com/jonnor/microflo/issues/63).


Interactive programming with Flowhub
-------------------------------------

MicroFlo also includes some host code which implements the FBP runtime protocol.
It can run either on node.js or in browser.
This translates message into the command stream understood by MicroFlo devices.

This allows the [Flowhub](http://flowhub.io) visual progamming IDE to interactively
reprogram the graphs on the device.

    TODO: screenshot


Simulator
----------

Use the same I/O abstraction as for different hardware target.
I/O backend sends commands across the command-stream protocol instead of to real hardware.

One can build automated tests against this simulator. Using high-level languages like CoffeeScript
![Automated tests of MicroFlo program](https://pbs.twimg.com/media/Be7H7DiCIAA9nvX.png)

Support for [on-device testing](https://github.com/jonnor/microflo/issues/13) is planned.
An interactive [user interface is planned](https://github.com/jonnor/microflo/issues/9).

