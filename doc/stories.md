Status quo
===========
How microcontroller development happens today.

Fredrik is trained in electronics service/repair, and designs, produces and sells
automated dip-coating tools for use in research laboratories.
He uses LabVIEW with a programmable Native Instruments board to control the stepper motors
and heating elements - because this allows him to program visually.
The standard LabVIEW license is 500+ USD, and each board costs him ~500 USD.
Each setup also requires a Windows PC for running the UI.
He also uses an Arduino as an I/O multiplexer to reduce costs on
wiring between different sensors in the system and the main board.
He subcontracts someone to write the firmware, as he does not know C++.

Anton is an experienced DJ, musician and producer who now goes to art academy,
making interactive media art.
He uses Arduino with stock Firmata firmware to avoid programming the Arduino,
and then uses PureData on a computer - to program visually.
This requires every piece he makes on his own to have a computer attached,
limiting artistic freedom due to the costs, size and power consumption of the computer.
He sometimes asks his more technical friends to rewrite the functionality in C++ for the
Arduino to get around this.

Jens is an industrial designer who specializes in personalized parametric design and
digital manufacturing tools.
He uses Rhino3d, Grasshopper and RhinoCAM (1000+ USD) to visually program models and
custom toolpaths for the CNC mill or 3d printer that realizes the physical product.
When he wants to add motion, light or sound to his products he uses Grasshopper
to simulate the interaction.
If the program is simple enough, he can write C++ for Arduino to realize a prototype.
Otherwise, he has to get someone else to do it for them.
In both cases, the interactive+visual Grasshopper sketch is thrown away.

Audun works as an engineer in the hardware department of a company making industrial electronics products.
He writes the software for the microcontrollers used in the companys products and testing tools,
using C/C++ with Eclipse and the AVR-GCC toolchain.
All development happens on-device, with all testing done manually.
Debugging is done ad-hoc using the serialport.
He is uncertain how to best structure the program to manage concurrency and state,
and does not know how to do automated testing of microcontroller code.
Nearly all the microcontrollers communicate with a host system,
and a new protocol is usually made for each project.


MicroFlo
==========
How microcontroller development could be with MicroFlo.


Instant prototyping, no-install, no-hardware required
--------------------------------------
When a user wants to experiment and protype something
they can openthe hosted version of MicroFlo in their browser,
sign-in and at once start prototyping their program in
an interactive simulator.

The simulator allows to add mock components for hardware pheripherals.

At any point the user can decide to order a microcontroller,
and be confident that when it shows up in the mail 2 weeks later,
they already have a working program to put on it.

Quick start, large library of components and examples
------------------------------------------
When user wants to accomplish a task, they can search in existing
examples, tutorials and component libraries for the key words to
find good starting points for a new project.
When developing a project, the natural structure for an application is
components and graphs, which can be reused as a library in another app
without extra effort. A button in the IDE allows to share the project with the community.

High-quality programs, verified with automated testing
-------------------------------------------
When creating a program or component, the user is encouraged to describe
the desired behavior as a set of automated BDD tests. The tests are
automatically executed as part of the development in the IDE, giving
the user confidence that the program is working as intended.
Tests can also be integrated into existing CI-systems and be run on-device.

Design patterns and tools exist to allow to design programs where
one can know how much of the program is tested (and how much is not).

Portable, use any microcontroller
------------------------
When creating a physical prototype, the user is free use any
microcontroller that satisfies his requirements for performance and I/O.
If it makes sense to change the microcontroller between prototyping phase
and production, or to create a new production run with different a microcontroller - the
user can be comfortable that the software stays compatible.

Also embedded Linux devices can be used for prototyping and/or production.
Manufacturers like ST, Atmel, MicroChip, TI, EnergyMicron should all be supported.
Prices for a minimal device should be as low as 1USD/piece bulk and 10 USD for development boards.

Not an island, easy to integrate in bigger system
--------------------------------------------
When user wants to communicate between a microcontroller and host computer,
the MicroFlo program can be used as a component in the host. The IDE allows to program
FBP on the host using NoFlo and other FBP runtimes, but one can also use traditional
frameworks and languages. The underlying communication protocol is seamlessly managed,
and USB, serial, Ethernet, Bluetooth, CAN-bus can all be used as transports.

Liberally licensed, use for any purpose
----------------------------------------
MicroFlo is MIT licensed, and can be used for commercial purposes.
The community enourages all components to be made available as open source for reuse,
and also that individuals and companies make their firmware available as free and open source
software - but does not mandate this.
