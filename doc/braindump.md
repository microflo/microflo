Just random ramblings and ideas. Several things are mostly opinion :)

Use/test-cases
==============

Home automation: fridge
------------------------
* http://www.jonnor.com/2013/09/microflo-0-1-0-and-an-arduino-powered-fridge/

Lab/fabrication tools
---------------------
* PCB solder oven
* Dip coater
* CNC mill
* 3d-printers

Components: PID control, stepper-motor

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
* Line-follower
* Autonomous N-copters

Components: Servo,

Interactive art: ?
------------------
Should have at least basic integration with SuperCollider, PureData and/or Processing.

Idea: run a NoFlo UI program that has a component which represents an Arduino running MicroFlo,
and have one or more components that expose the functionality over an OSC interface.

Ideally it would be possible to also program video/audio using FBP/NoFlo(UI), and combine it seamlessly with MicroFlo.

Distributed systems: ?
--------------------
Multiple microcontroller collaboration, co-processors.

Thoughts on best practices and code style
======================

Components must have a single, well defined, task.
The input and output data (interface) must be minimal.
It is 'preferable' that the component has minimal internal state, and low internal complexity.
Design the component for black-box testing.

A programmer may chose to make one "fat" component in C++, or compose the same ''logical''
function as a graph of many small/"thin" MicroFlo components. The latter may result in larger reusability.
But if the straightforward solution is a fat component, maybe make that first, then decompose as an (optional)
second step. Reasons for this can include reuse/retrofitting existing code, flow-based thinking not familiar
or not easily applicable to the problem domain.
Conversely, if and when a graph of thin components does not perform well enough, combining into a supercomponent may
be a viable strategy.

Sub-systems representing what is logically one function should be encapsulated into a component, defined by a subgraph.

The size of a node should be proportional to its importance in the graph.

When using hetrogenous systems, consistent of both microcontroller and host,
important to make sure that the tasks selected for each device (class) is that which
the device/runtime is most suited for. Example: RealTime->uC, CPU-intense->host.

User Interface
==============

Foundations
------------
Microprocessor programs are embedded software; they make little sense without the
accompaning hardware and the real-life environment on which they act.

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

Stories
--------
Example -> Custom program

* Example programs readily available, searchable
* Programs initially shown as one component, possibly with ports for config
* Can change these parameters, couple to user interface elements easily
* Two main methods of modding program to become something new
    * Drive input parameters and capture output of original program with other components
    * Drill down into the program, to change the subgraph it consists of

Custom program -> Share

* Upload directly to github?
* Perhaps make no difference between program and library!
* Other people can reuse program "as lib"

Platforms/Hardware targets
===================
ARM Cortex-M3/M4(F) most interesting. Dirty-cheap modules available from TI (Launchpad) and STM (Discovery)
* http://www.st.com/web/en/catalog/tools/FM116/SC959/SS1532/PF250863
* http://www.st.com/web/catalog/tools/FM116/SC959/SS1532/PF252419
* http://www.ti.com/tool/EK-TM4C123GXL
* https://estore.ti.com/Stellaris-LaunchPad.aspx

FPGA soft-processors also very interesting. Most likely target is [Papilio](http://papilio.cc/) boards (Xilinx-based).

It could also be interesting for some to combine MicroFlo with an existing RTOS. Examples: FreeRTOS, eCos

Correctness, Testing
=====================
Testing needs to be an integral part of development, with a strong level of testing being done by default,
also of application/thirdparty code that uses the framework. This should be achieved through painfree tools/infrastructure,
demonstrated usefulness, and culture building.

* Static analysis. TODO: Integrate clang-analyzer, cppcheck as minimum?
* Testing coverage. TODO: Integrate llvm-cov/gcov as a minimum?
* Code quality metrics?

Can we apply black-box testing techniques to component (and graph/app) testing?
* Fuzz testing inputs, assert no crashes/hangs
* Boundary/equivalence partitioning by guessing on input values?

IDEA: Can one generate/create some fairely-general grey box tests for a component by describing/classifying the component?

Possible Classes, Invariants.

* I/O: has real-world side-effect / external state
* Pure: not stateful, without side-effects
* Syncronous: Sends message out as direct result of message in
* Generator: Creates messages on its own (without requiring input)
* 1-1: One message out for every message out
* Deterministic: Same sequence of inputs results in same sequence of outputs
* State-free: Same input message always results in same output message
* Real-time/bounded-time: A message in is guaranteed to have its corresponding output within a certain time
* Cooperative: Yields the compute within a certain time

Are there formalisms which can be provably correct that are suited for components?

* Finite State Machine
* Truth tables
* Boolean algebra/logic
* Mathematical expression

Simulators
-----------
AVR8
* https://gitorious.org/simavr
* http://www.nongnu.org/simulavr/download.html


Arduino, advancements and lacks
================================
Arduino is a massively succesfull project which has made it much easier
to program microcontrollers, both for hobbyists and professionals.

Advancements
* Microcontroller can be programmed without speciality HW programmer
* Development boards are cheap, and can be used directly in small-scale production
* User does not have to care about registers and interrupts
* Large open software ecosystem: libraries and example sketches
* Large open hardware ecosystems: boards,shields,peripherals
* Cross-platform, minimal IDE for starting out
* Easy to extend computer I/O and do programming there (Firmata)
* Breadboard diagrams for easy HW layout, compared to schematics+PCB (Fritzing)

Lacks
* User has to learn to read and write C/C++
* Few best practices for organizing and architecting non-trivial programs
* No device simulator or emulator widely available
* Very few practices around structured and automated testing
* Mostly focused on polling based syncronous code
* LGPL license, unclear if use in proprietary products OK
* No freely available IDE which does both hardware and software
* Purely textual programming, not making use of peoples visual capabilities


Free (as in freedom) electronics devices
=====================================================
The Free Software movement aims to provide end-users of software the freedom to
use, study, modify and redistribute the software. After 30 years, this is still
an exception, not the rule. Reasons are many, including some hard to change:
* Few incentives for manufacturers to provide such freedom
* Many users do not care for such freedom, most of the time

One failing which the movement itself have to take responsibility for,
is that the ways to discover, make use of, and benefit from these freedoms have placed
a high burden on the user.
* Programs are often shipped to the end-user without the required tools.
* These tools often require extensive training/experience to use.
* The archetypical programming model establishes next to no direct connections
between the behaviour of the system and the recipe (source code) which define it.
* Sharing modified programs has required lengthy registration/setup of online project sites,
and because programs are not easily tested on different targets, often incur a large support cost

Electronics devices, which traditionally were thought of as mostly hardware (electronics and mechanics),
are increasingly defined by their software components. This trend is likely to continue and accellerate.
This means that the software freedom also applies to such devices, from your TV to your oven and fridge.

Additional complications with HW include
- significant cost of reproduction (inherent)
- software on these devices has real-life effects: misconfigured SW may destroy hardware or surroundings


* [Open Source Hardware Association](http://www.oshwa.org/)
* [Free Hardware Movement](http://www.fsmk.org/?q=free-hardware-movement)
* [Free Software definition](http://www.gnu.org/philosophy/free-sw.html)


Complex hetrogenous systems and the Internet of Things
=============================================================================
There is a tendency for more and more interconnected systems, whos realization
spans multiple architectural levels and domains.
- Embedded devices. One or more microcontrollers, microprocessors.
Potentially also reconfigurable hardware; FPGA, analog blocks, external digital logic
- Host computers.
- Server clusters.
- The cloud. Distributed online services that collaborate.
- End-user clients. Mobile devices; tablet and phones. Workstations and laptops.

Each of these are traditionally tackled with separate tools, programming languages and mindsets.

Flow-based programming is language and detail-level agnostic concept, and may
be well suited for programming hetrogenous systems. Each level in the architecture
may be best targetted with a dedicated runtime optimizing for the specific concerns.
But the systems should be interoperable and the tools allow to navigate seamlessly between
flows on different levels and in different "domains". Merely being able to visualize and monitor
such complex systems as they run may prove of enormous value.

* NoFlo targets computers and clients.
* MicroFlo targets embedded devices.
* For clusters, perhaps something based on ZeroMQ?
* For the cloud, ???

Other interesting domains...
----------------------------
That could be part of a hetrogenous system
* 3d generative modelling, animation and simulations. Hook into Blender?
* Real-time audio synthesis, algoritmic composition. Hook into SuperCollider?
* GPU programming, both GLSL shaders and GPGPU with OpenCL.
* FPGA devices. Sadly extremely propritary, would probably need to generate HDL/Verilog
** Start of open FGPA toolchain:  http://www.clifford.at/yosys
* Modelling and manufacturing of physical objects.
http://openjscad.org/ and http://joostn.github.io/OpenJsCad/ provides pure-JS+WebGL parametric solid modelling library
http://www.freecadweb.org provideds a Python API to C++ library for solid modelling
One could also go crazy and consider whole manufacturing processes to be FBP modelled:
http://www.reddit.com/r/DataflowProgramming/comments/1x6r11/why_3d_printing_is_a_pure_function_and_dataflow/


Testing strategy
----------------
This is all TODO at the moment.

* MicroFlo framework
    * Behaviour tests. Graph manipulation, message passing.
    * Build tests around JavaScript interface to the MicroFlo graph.
    * Run same tests against host simulation (in subprocess) and real target (on device)
* Invidual components
    * Unittests. Component behaviour.
    * Something similar to noflo-test
    * Maybe a DSL for simple message send/expect tests.
    * Run same tests against host simulation (in subprocess) and real target (on device)
* Target implementation (I/O)
    * Functional tests. Analog/Digital in/out, Serial/UART in/out, PWM/ADC
    * Ideally automated on real hardware coupled back-to-back
* Performance
    * Benchmarks to be done on device
    * Message throughput, as function of number of nodes/edges
    * Overhead of component interface, as function of component complexity
    * Maximum number of nodes (limited by RAM usage)
    * Program size (progmem/Flash)
    * Input->output latency, average and distribution
    * Graph setup/teardown time
* Applications
    * Allow to use stub/mock I/O components, and test/simulate on host
    * Allow to build test fixtures using graphs
    * Allow to drive BDD tests on device from host in JavaScript


Error handling
===============
Classes of errors
* From runtime versus from components/graph
* From programmer error verus from from user interaction
* Handled versus unhandled
* Different severity levels: Useful or not? Warnings and maybe-errors?

Error handling
* Error prevention: much better to eliminate possible errors then handle them
* Applications may want a centralized error handler
* App may want to handle errors depending on which instance it comes from?
    * Should this info be stored in the error, or only encoded in which port it comes in on.
    * The error handler needs to be able to understand this info easily
* Ideally want to avoid custom C++ component for error handling
* Can we provide a sane default behavior / best-practices?

Displaying errors
* Generally needs to fit with the modality of the user-interface
    * Visual/audio signal that error has occurred
    * LED/BCD with error code sequence
    * LCD or other rich displays
    * Communicating error over to a host device
* Mechanism needs to be simple and robust, avoid failures in error handling

Testing error handling
* Knowing which errors may occur and their effects
* Stimulating specific error conditions, verifying handling

Possible implementation
'error' port on components, MsgTypeError packets sent.
Error contains:
* domain. Ex: CoreComponents, Runtime
* errno. uchar/uint, enumeration. Should map to one specific failure mode?
Errors declared in components.json, including description.
Should components declare which errors they may emit?


Random
=======
[Tangible Functional Programming](http://www.youtube.com/watch?v=faJ8N0giqzw)

Compared to dataflow:
* First-order functions: they are just values, no separation between values/data and functions.
* Types are composable (as in Haskell), each types have a corresponding GUI. "Tangible values": type TV a = (Out a, a)
* Main composability operation is "fusion", which combines two components, gives a new component, but hides all the intermediate data.

[The future of software, the end of apps, and why UX designers should care about type theory](http://pchiusano.blogspot.no/2013/05/the-future-of-software-end-of-apps-and.html) argues that the application is an uncessesary paradim, artifically treating computers like physical machines. Furthermore,
that the economy of the Internet is flawed due to the boundaries between applications and lack of composability - they derive most of their value by
amassing data behind their application boundary. Highlighting that maybe the most serious challenges to achieving a world were "programming" is not
limited to a (self-)selected and limited few is the economic and social state of the software industry.

[Programming Without Text Files](http://pointersgonewild.wordpress.com/2013/07/19/programming-without-text-files/) argues that
a natural evolution of our IDEs and current textual-imperative languages is to go from operating on source code as text files,
to source code as Abstract Syntax Trees (AST). With macros which are functions operating on the AST, enabling to add primitives
to the language used. And with GUIs for navigating, introspecting and viewing the AST defining the program at the level of detail
wanted by the programming.
I'd love to be able to add pre- and post-conditions to my programs for instance... Or create a custom visual tool for defining state-machines.

[Why type systems matter for UX: an example](http://pchiusano.blogspot.no/2013/09/why-type-systems-matter-for-ux-example.html)

[UI as an Act of Programming](http://awelonblue.wordpress.com/2013/09/11/ui-as-an-act-of-programming)


Arduino opinions/criticisms
============================
"After all, it’s not as though each person using an arduino is having to invent the wheel all over again from scratch,
and it’s not as if the arduino offers unlimited or limitless possibilities and
therefore requires as flexible and efficient as possible a language to control it.
Most stuff is the same as most other people’s stuff, most of the time.
The common use cases cover almost all of what most people want to do with it in the first few years of their experience.
Anything outside of those use cases can be programmed with custom ‘code’.
The bulk, however, might as well be encapsulated into a very predictable and very efficient to use framework
— one that doesn’t frustrate or infuriate or deter. "
 [u0421793 @ Arduino Forums](http://forum.arduino.cc/index.php?PHPSESSID=fa4rk3oaohe5hclnghldp9lss0&topic=55937.msg432977#msg432977)

[Why I'm ditching the Arduino software platform](http://bleaklow.com/2012/02/29/why_im_ditching_the_arduino_software_platform.html)


Software defined sensor/actuator systems
===============================
Arduino provides cheap, standardized microcontroller boards which are programmable
- but they do not include any sensor or actuator pheriperals, and does not solve any
of the mechanical challenges faced when making a thing. Also, it is conceived as "the" controller
of a project, not so much geared towards collaboration in larger systems.
Can one provide a cheap, encapsulated box which provides a standard set of sensors/actuators,
running on battery power and with wireless communication to allow it to easily form larger
systems in addition to running autonomously?

See [Sensorblock](http://github.com/jonnor/sensorblock) project


Marketing/Outreach
==================

Target audiences

* Embedded software engineers
* Electronics/electromechanical engineers
* Lab/research toolmakers
* Interactive media artists
* Tinkerers/makers/hackers
* Academics/researchers

Avenues

* Hacker/maker-spaces, fab/media-labs. Bitraf, Fellesverkstedet, Hackeriet, CBase.
* Art/design schools. KHiO
* Technical/engineering schools. UiO, HiVe, UiB, NITH
* Adjacent communities. Arduino, Raspberry Pi, Beagleboard. PureData, SuperCollider.
* Technical conferences. FOSDEM, LGM, Piksel,
* Companies using it in own products.
* Companies intergrating with it to sell related products.
    * Adafruit, Olimex, Element14
    * EnergyMicron, NordicSemiconductor

Methods

* Social media
* Hands-on workshops
* Guest lectures
* Presentations/talks
* Joint projects
* Consulting
* Technical demos
* Academic papers

Core advantages

over traditional Arduino/uC prog. Some of these are planned, not realized fully yet.
* Visual programming, C++ optional
* Visual, interactive debugging
* Interactive simulation, without special tools
* Instant program changes
* Portability across microcontroller families
* Automated BDD testing, both on host and on-device


In the press
-------------
* [LWN.net - A bit of visual programming with MicroFlo](http://lwn.net/Articles/575524)
* [Makezine.com - Maker Faire Oslo: Maker Tech](http://makezine.com/2014/01/21/maker-faire-oslo-maker-tech)

Network
========
People that have expressed an interest in using MicroFlo

* Jens Dyvik, Jens Brynhildsen, Alex. Bitraf, Oslo
* Wolfgang Spahn. Artist+Educator, Berlin.
* Elisabeth Nesheim. University of Bergen.
* Eirik Blekesaune. Verdensteateret/NOTAM, Oslo.

Other contacts
* Henri Bergius, creator of NoFlo. TheGrid, Berlin
* Brendan Howell. Artist+Educator, Berlin.
* Jørgen Lien. Høyskolen i Vestfold.


Finite State Machines & Flow-based programming
==============================================

TODO: check for prior art around this design pattern. Ask on FBP mailing list

Consider the StateMachine (SM) as a FBP component, containing one flows/graphs for
each of the possible states.

All the in and outports of the contained graphs are exposed on the SM,
and it routes packets to the appropriate state sub-flow depending on current state.

A set of nodes listening to data from inports (and/or intermediate nodes of state flows)
acts as predicates, and decides when to transition to a new state.

Enter/leave is modeled by special messages (or special ports),
sent by the SM to state sub-flows on transitions.

It may or may not be desirable to be able to visualize the setup in the traditional FSM way,
a graph with circular nodes for states, directed edges for transitions.

It is desirable that the ST is easily testable. We at least want to be able to
* Mock the input and check succesful transition
* Assert that after a set of functional tests, all states have been visited
* Assert that there are no ambigious transitions

It is desirable that one can easily introspect the ST at runtime,
both get current state and subscribe to state transitions.

Related to this high-level FSM, it would be nice to be able to create small FBP components
using a structured/visual FSM, for cases where a dynamic ST is not performant enough.
It may be neccesary to do code-generation to realize this, and that predicates and enter/leave/run
functions are standard C++ code.
Challenges:
* Having a sensible mapping from C++ code back to model definition, especially for debugging
* Injecting code snippets into the appropriate context when generating, so they have access to the state/data needed

See [Finito](http://github.com/jonnor/finito) project


Arduino versus RPi
===================

Criteria            Arduino             RPi
Cost (USD)          < 10                >25
HW customization    Easy                Impossible if not partner
Realtime            Hard, ~1uS          Soft, ~1mS
Power               mW                  ~2 Watt
SW toolchain        C++/Arduino         C++, Python, JS
I/O                 Digital,PWM,ADC     Digital GPIO
                    i2c,SPI,USART       i2c,SPI,USART
                    USB device          USB host, Ethernet, HDMI, audio out


Beautiful documentation
=========================

Web technology and JavaScript libraries often have quite aesthetically pleasing documentation,
compared to typical C++,Java etc tech. It gives a sense of quality, of thouroughness, style
and attention to detail.
At the same time, while very 'engineering' in style, typical electronics ICs datasheets can also be
quite beautiful - and also describe in details the performance/behavioural characteristics of the device
- not just reference/usage.
A combination of these two styles would be a nice documentation goal for MicroFlo.



FBP/data-flow representation of electronics hardware
====================================================

In context of Microflo, it would be interesting to integrate the electronics
hardware in a data-flow centric mindset and workflow; primarily from two perspectives:
1) Providing hardware mocks to interactively simulate, and automatically test code/behaviour
2) Allowing user who can express data-flow (and thus program uControllers) to also do HW design

Being able to do sketch out the high-level architecture of a design idea quickly
may be generally useful, especially if the system can calculate costs of the design.

Thus, it is particulary things that the microcontroller cannot do, or which is better done in HW.
Examples of this include:

* Audio processing.
Differential amplifier. Inverting amp, non-inverting amp.
Low-pass, high-pass, band-pass, notch, peak filters.
Generators, noise, sine, saw, etc.
* Signal conditioning.
DC- amplification, impedance matching and transformation
* Sensor/actuator interfacing.
Multiplexing/demultiplexing (eg shift register),
adapting logic-levels (TTL, CMOS etc),
controlling bigger devices (BJT/MOSFET as on-off switches, motor drivers, relays)

Can one use constraint solving to automatically suggest, or even implement,
the "adapter" components that the uses needs to connect two different things
together?
This would require being able to describe and evaluate all the relevant constraints
of the various components, and to calcuate if they are being exeeced.
Meaning, full-blown circuit simulation ala SPICE.
Maximum current, voltage, power. Voltage thresholds for logic levels.
Required bandwidth in analog designs. Temperature drift.

Prototyping/proof-of-concept ideas:
* A way to define a component as a schematic/layout.
http://upverter.com or http://circuits.io or one of the FOSS EDA tools (KiCad,Geda,Fritzing)?
* A set of these components, enough for a simple test case/program
* A "runtime" which can stich components together, output new schematic/layout
* A way to define component behavior as software for mock/simulation
* Produce a PCB

https://github.com/zupolgec/circuit-simulator



Value proposition
=================
Visual programming
* Self-documenting architecture, easy to understand
* Integrate non-programmers; designers, business and domain-experts
* Introspection and visual debugging built-in

Interactive simulation
* Prototyping program without device
* Validating and demonstrating concepts

Testability
* Know that your program is correct
* Minimal setup
* Continious automated testing
* On-device testing
* Acceptance testing of combined HW/SW systems

Portability
* Use any microcontroller you have available to start creating
* Take program with you from one uC to another when needed
* Use the best hardware available for your usecase

Integration
* Personal devices as user interfaces
* Seemless combination with desktop/embedded computers and cloud servers
* Domain-specific runtimes
* One programming model across device classes and domains

Performance
* Power-saving by default


Deployment scenarios
---------------------
* !Multiple microcontrollers connected
* !Connection may come and go

1:Desktop development, Windows/OSX/Linux
* MicroFlo host: Embedded in Flowhub Chrome application
* UI transport: iframe
* uC graph transport: USB-serial, Bluetooth-serial (WiFi or Ethernet)
* Build toolchain: Runs locally, or a service
* uC flashing: USB-serial, USB-mass-storage, USB-DFU or specialized programmer: ISP,JTAG

2:Embedded device, Linux
* MicroFlo host: Standalone or embedded Node.js/NoFlo service
* UI transport: websocket/webrtc
* uC graph transport: Ethernet, USB-serial, Bluetooth-serial, WiFi, RS232/485 serial, TTL serial, SPI, I2C, custom
* Build toolchain: Service or uns locally
* uC flashing: USB-serial, USB-mass-storage, USB-DFU
* !MicroFlo runtime may run on the embedded Linux device

3:Mobile development, Android/iOS
* MicroFlo host: Embedded in Flowhub Mobile Chrome application
* UI transport: iframe
* uC graph transport: Bluetooth-serial, WiFi (Ethernet, USB-serial OTG)
* Build toolchain: Service
* uC flashing: Possible for some devices with Bluetooth-serial, or USB mass-storage

4:Interactive Simulator, Windows/OSX/Linux/Android/iOS
* MicroFlo host: Embedded in Flowhub application
* UI transport: iframe
* uC graph transport: direct JS, iframe?
* Build toolchain: Service, compiles to Emscripten
* uC flashing: Load new JavaScript
* !MicroFlo runtime compiled with Emscripten, runs in browser



Project skeleton
----------------
* Allow custom MicroFlo components, graphs
* Compatible with NoFlo UI
* Allow custom NoFlo components, graphs
* Allow simulator/mock UIs
* Automated tests set up by default
* Ideally also static analysis
* Travis CI config?

Either a git repo people can clone from, or executable that
creates the skeleton.



Related tools,project,links
-------------------------------

Flow-based/dataflow concepts

* http://www.jpaulmorrison.com/fbp/
* http://c2.com/cgi/wiki?DataFlowBasedProgramming
* http://www.reddit.com/r/dataflowprogramming/

Physical computing with JavaScript

* https://github.com/rwaldron/johnny-five
* https://github.com/jgautier/firmata
* http://breakoutjs.com/
* https://github.com/jadonk/bonescript

Visual programming for Arduino etc.

* http://www.mindplus.cc/
* http://www.modk.it/
* http://blog.minibloq.org/
* http://seaside.citilab.eu/scratch/arduino
* http://sourceforge.net/projects/qpc/
* http://playground.arduino.cc/Code/QP
* http://ardomotic.com/ (web-UI GUI builder)
* http://sourceforge.net/projects/ktechlab (poorly maintained)
* http://www.flowol.com/InterfaceArduino.aspx (non-free)
* http://microuml.net/microuml.html (non-free service)
* http://www.3d-svs.com/3dmicro-toolkit (non-free LabVIEW addon)


Other alternative Arduino programming models (RTOS, event-driven)

* https://github.com/mikaelpatel/Cosa
* http://blog.ardublock.com/2013/10/29/evaluating-of-event-driven-libraries-on-arduino/
* http://code.google.com/p/duinos/
* http://jeelabs.org/2013/05/25/chibios-for-the-arduino-ide-2/

Other notable dataflow programming environments

* http://puredata.info
* http://en.wikipedia.org/wiki/Simulink (dsp, non-free)
* http://en.wikipedia.org/wiki/Labview (dsp, non-free)
* http://en.wikipedia.org/wiki/Reaktor (audio, non-free)
* http://en.wikipedia.org/wiki/Quartz_Composer (graphics, non-free)

