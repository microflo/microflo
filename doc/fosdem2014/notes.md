FOSDEM 2014, Brussels
=====================
* 1-2 February
* Embedded or Internet-of-Things devroom
* https://fosdem.org/2014/

Status
------
Proposal in progress, deadline 1. December

Goals
-------
* Introduce flow-based programming as a potential programming paradigm for hetrogenous systems
* Gather interest around NoFlo,MicroFlo as projects. Invite feedback, use and experimentation in embedded systems

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



