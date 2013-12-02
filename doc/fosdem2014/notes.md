FOSDEM 2014, Brussels
=====================
* 1-2 February
* Embedded or Internet-of-Things devroom
* https://fosdem.org/2014/
* https://groups.google.com/forum/?hl=en#!forum/iot-devroom

Status
------
Proposal in progress, deadline 1. December

Goals
-------
* Introduce flow-based programming as a potential programming paradigm for hetrogenous systems
* Gather interest around NoFlo,MicroFlo as projects. Invite feedback, use and experimentation in embedded systems

Proposal
---------
Title:

Flow-based programming for heterogeneous systems, with NoFlo and MicroFlo

Abstract:

Hetrogenous systems as found in the Internet of Things are made of many devices of different types working together.
Each device class is typically developed with separate tools using different paradigms.
We propose that using NoFlo and MicroFlo one can develop heterogenous systems consisting of
microcontrollers, servers and mobile devices using flow-based programming (FBP) as an unifying programming model.

Full description:

Systems qualifying for the label "Internet of Things" are often complex hetrogenous systems
consisting of many nodes spanning over several device classes, working together to realize the intended function:
Microcontrollers w/peripherals are used as sensors and actuators, servers used for data-aggregation and analysis,
desktops and mobile devices as user interfaces for monitoring and configuration.
Typically each of these classes of device are programmed with separate tools, by different people using different paradigms:
for example C/C++ for microcontrollers, Python for servers, JavaScript+HTML5 for user interfaces.

This talks aim to introduce flow-based programming (FBP) as a programming paradigm that can be used
across and between device classes, and to show how NoFlo and MicroFlo can be used to implement heterogeneous systems.

About:
NoFlo is a JavaScript-based FBP runtime by Henri Bergius, which runs on Node.js and in the browser. http://noflojs.org
MicroFlo is a C++ based FBP runtime by Jon Nordby. It runs on AVR and Cortex-M microcontrollers, including Arduino. http://microflo.org

NoFlo and MicroFlo can both be targeted by the NoFlo UI, an IDE for flow-based programming currently in development.
Systems can be programmed visually, using a domain-specific language or the runtimes can be embedded and controlled programmatically.


Storyarc
----------
?

Demo/case
----------
System architecture

* A couple of microcontrollers (sensors/actuators)
    * USB/Bluetooth/2.4Ghz ->
* An embedded Linux system, Raspberry PI etc (data aggregator, storage, analytics)
    * Ethernet/WiFi ->
* Computer/mobile device with web browser (user interface)

Story

Each device runs a program defined by FBP graph, running on NoFlo/MicroFlo.
The entire system shows up as one connected graph in NoFlo UI (high-level system view)
One can drill down to individual components, and can monitor and reprogram them live.

Arguments
----------
* Flow-based programming is a model that can be used on each device class of system,
and also for combining each device into a larger (logical) program
    * With the status quo, different programming languages, frameworks, patterns are used on each class
    * This usually also means having different people programming each device class
* Need autonomy of devices in IoT systems, also those on edge. Want reprogrammability
    * Communication availability might be sporadic
    * Need to minimize amounts of communication, keep power down
* FBP lends itself well to system visualization and monitoring (manual and automatic)



