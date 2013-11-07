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
* Gather interest around NoFlo,MicroFlo as projects. Invite feedback, use and experimentation

Storyarc
----------
?

Arguments
----------
* Flow-based programming is a model that can be used on each device class of system,
and also for combining each device into a larger (logical) program
* Need autonomy of devices in IoT systems, also those on edge. Want reprogrammability
    * Communication availability might be sporadic
    * Need to minimize amounts of communication, keep power down
* FBP lends itself well to visualization and monitoring


Demo/case
----------

System architecture
* A couple of microcontrollers. USB/Bluetooth ->
* An embedded Linux system, Raspberry PI etc. Ethernet/WiFi ->
* Client computer with web browser.

Each device runs a program defined by FBP, running on MicroFlo/NoFlo.
Programmed, and can be live reprogrammed
