Just random ramblings and ideas :)

Use/test-cases
==============

Home automation: fridge
------------------------
* http://www.jonnor.com/2013/09/microflo-0-1-0-and-an-arduino-powered-fridge/

Making music: digitally controlled analog synth
-----------------------------------------------
Components: Envelope generator, low-frequency oscillators, sequencer, MIDI

HW
* http://sound.westhost.com/articles/vca-techniques.html
* http://www.beavisaudio.com/Projects/CMOS_Synthesizers/
* http://www.experimentalistsanonymous.com/ve3wwg/doku.php?id=noise_generator
* http://www.csgnetwork.com/ne555c1.html

Physical computing: uController as I/O expansion for computer
----------------------------
Components: Firmata

Data aquisition/sensor logging: position logger?
-----------------------------------------------
Components: SD-card, NMEA parsing, Accelerometer/Gyro


Robotics: ?
---------------

Interactive art: ?
------------------

Distributed systems: ?
--------------------
Multiple microcontroller collaboration, co-processors.


User Interface
==============

Foundations
------------
Microprocessor programs are embedded software; they make little sense without their hardware environment.

How to avoid "blindly manipulating symbols"? [ref](http://vimeo.com/66085662)
Need direct manipulation, interactive parametrization.

How to go from telling the machine HOW to do things, to defining WHAT it does?

Ideas
-------

Realist

* Show serial console(s), allow to send data to uController
* Allow to subscribe to data flowing through connections, inspect
* Allow to change the graph, upload new config at runtime and persist a new config to device
* Visualize the state of the uController in/out ports/peripherals
* Allow to add mock HW components and attach to uController

Idealist

* Monitor the graph, recording the events by default - then be able to
go back in time and replay the events - maybe export to regression test?
* Visualizations for data flowing through graph and components. Interactive, custom
* Dynamic changes to graph while running
* Data breakpoints/conditionals and expressions
* Allow to parameterize behaviour, explore classes of systems, relationships
* Allow defining components/graphs/programs by "macro recording" and defining input-output relationships
* Let HW components be properly simulated electronics, allow to output schematics/layouts


Hardware targets
===================
ARM Cortex-M3/M4(F) most interesting. Dirty-cheap modules available from TI (Launchpad) and STM (Discovery)
* http://www.st.com/web/en/catalog/tools/FM116/SC959/SS1532/PF250863
* http://www.st.com/web/catalog/tools/FM116/SC959/SS1532/PF252419
* http://www.ti.com/tool/EK-TM4C123GXL
* https://estore.ti.com/Stellaris-LaunchPad.aspx

Correctness, Testing
=================
Can one generate/create some general tests for component describing/classifying the component?
Classes, Invariants. "state-free", "side-effect-free", "pure", "1in->1out", "1in->Nout"

