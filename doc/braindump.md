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

Human interface devices
-------------
* Piezo drums

Components: AnalogRead,filters

IoT
-----
* Door system. API for unlocking, local logic door/openers

Process regulation
----
* Water mixer for shower, temp/flow control
* Solar water heating. Pump control, temp reporting.
* 3d-printer filament extruder. Width measurements, motor control

Robotics: ?
---------------
* Line-follower
* Wheel balancer
* Sumorobot, Folkrace

Components: Servo, UltrasonicDistance

Interactive art: ?
------------------
Should have at least basic integration with SuperCollider, PureData and/or Processing.

Idea: run a NoFlo UI program that has a component which represents an Arduino running MicroFlo,
and have one or more components that expose the functionality over an OSC interface.

Ideally it would be possible to also program video/audio using FBP/NoFlo(UI), and combine it seamlessly with MicroFlo.

Distributed systems: ?
--------------------
Multiple microcontroller collaboration, co-processors.
Dedicated kinematic unit for robotics, communication/planning/actions on another


Thoughts on best practices and code style
======================

Components must have a single, well defined, task.
The input and output data (interface) must be minimal.
It is 'preferable' that the component has minimal internal state, and low internal complexity.
Design the component for black-box testing: effects and state changes must be observable.

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


Work by others
-------

* [Cucumber BDD implementation for embedded targets](https://github.com/ihassin/cucumber-wire-c)
* [Deputy, dependent types for C](http://www.cs.berkeley.edu/~necula/Papers/deputy-esop07.pdf).
Can handle mutation of variables, used hybric static/runtime checking, and uses inference where type annotations are missing.
* [Ivy, language around set of projects researching safe C](ivy.cs.berkeley.edu/ivywiki/index.php/Main/Projects)
* [mbedder, IDE with FSM, contracts and units built in](http://mbeddr.com/).
Built on top of Jetbrains MPS, allows extending such custom programming constructs and integrating with imperative C code.


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
* User must learn to read and write C/C++
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
* For clusters, MsgFlo?
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

* Invidual components
    * Unittests. Component behaviour.
    * Run same tests against host simulation (in subprocess) and real target (on device)
    * https://github.com/flowbased/fbp-spec
* MicroFlo framework
    * Behaviour tests. Graph manipulation, message passing.
    * Build tests around JavaScript interface to the MicroFlo graph.
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

> The problem with UML is not that it's graphical,
> but because it's not the ultimate source of truth in your software.
> The UML isn't executable.
https://news.ycombinator.com/item?id=10834315


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

[PSpice simulator in JavaScript](https://github.com/zupolgec/circuit-simulator)



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



Rapid prototyping, simulation and MicroFlo
==============================

Rich, interachive simulations of embedded electronics products (constisting of mechanics, hardware, software)
are becoming more and more popular, both in startups and established enterprises.
The motivations are many:
* Communicating core concept within team/company, and towards potential investors and customers
* Validation of overall product concept, including feasibility, cost and risk factors
* Validation of user interaction concepts before hardware+software is ready
* Fast experimentation with several different approaches to the problem
* Using parts of simulation as a "mock", both for developing real solution against, reducing interdependence between teams,
and for making it easier to run continious testing (reducing test dependencies on speciality hardware)

However, the conventional tools used for simulation often live in isolation from the tools used for implementation.
For simulation, companies use tools like SolidWorks, Rhino, Grasshopper - but neither of these are suitable for realizing
an embedded electronics product, at least not the software parts of it. This often means that one builds the two things
separately; the simulated version and the real implementation. This leads to a duplication of effort, reducing the value
of the simulation as the implementation cannot reuse the validated pieces as-is, creating a risk of the simulation being
correct, but the implementation differing. Usually, when the implementation is "done", the simulation is discarded due to
the maintenance costs - even if it could provide value for continious validation, future product modifications and enhancements.
A notable exception is LabVIEW.

Ideally one would be able to build a simulation, that can run entirely on commodity hardware, with exectutable acceptance tests (the spec) againts this simulation.
Then once can seamlessly move parts of the simulation into the real target environment and product, and replace the low-level simulated parts
with real implementations. The acceptance tests should continue to run with no/minimal modifications, and be able to target both the simulation and implementation seamlessly.
This way one ensures that both the simulation and implementation is correct, and thus that one can use either for validation.

# Simulations in software development

http://www.embedded.com/design/real-time-and-performance/4007090/Using-simulation-tools-for-embedded-systems-software-development-Part-1

> Ironically, while simulation is almost universally implemented as software on computers,
> the use of simulation to develop computer software itself is still quite rare.
> ...
> The ability to inject extreme and faulty cases is a key benefit from simulation. 

* Abstraction vs. Detail
* Simulating the Environment
* Simulating the Human User Interface (of the device)
* Simulating the Network (that the system talks to)

https://www.infoq.com/articles/simulation-based-embedded-agile-development

* Using simulation environment for early and continious integration of code from different teams
* Evaluating consequences of changes to product dependencies
* Simulation highlights areas of low performance, guiding what to focus on
* Simulation-first requires system architecture and requirements to be fleshed out earlier, uncovering unknowns.

## Simulation tools

AVR8
* https://github.com/buserror/simavr
* http://www.nongnu.org/simulavr/download.html

ARM Cortex-M
* Upstream includes basic ARM Cortex devices.
https://github.com/gnuarmeclipse/qemu contains lots more.

Arduino

* [simuino](https://github.com/bsaxen/simuino). Open-source, 
* [Arduinosim](https://sourceforge.net/projects/arduinosim/). Open-source, Python-based
* CodeBlocks for Arduino.
* Virtronics Simulator for Arduino. Proprietary
* 123d.circuits.io. Proprietary, web-based. Includes simple circuit sim, digital/analog. Seems mature
* Virtual Breadboard. Proprietary, Windows-only


# Embedded systems and Internet of Things challenges

Aspects

* Reliability
Best practices: Automated testing, static analysis, model-driven development, simulation of extreme cases, safe-subset languages, formal verification, property-based testing
* Robustness
Best practices: FMEA, graceful degradation, watchdogs
* In-field upgrades
Best practices: image-based update, builtin self-test, separating system from application (see ParticleIO)
* Hardware dependencies pushing software development back.
Best practices: Simulation, early definition of protocols
* Slow & unreliable network connectivity
Best practices: acknowledgement required, on-edge-temporary storage
* Large data volumes
Best practices: Compression, on-edge processing
* Low latency, real-time requirements
Best practices: Compile-time definitions, worst-case analysis, bounded loops, lockfree. 
* Power requirements, battery-only
Best practices: Radio shutoff, processor sleep w/periodic wakeups.
* Distributed systems
Best practices: Message passing
* Heterogenous nodes
Best practices: Well-defined protocols

Usecases

* [50 IoT sensor applications](http://www.libelium.com/resources/top_50_iot_sensor_applications_ranking/),
various types of environment monitoring, warning and automatic regulation, optimization of resource usage - agross major industries.
* [IEEE: IoT scenarios](http://iot.ieee.org/iot-scenarios.html), hundreds of community contributed small stories/papers
about how IoT could make an impact on everyday scenarios.

Related

[Data dissemination](http://www.embedded.com/design/real-time-and-performance/4237947/Build-wireless-M2M-and-IoT-sensor-networks--Data-dissemination), using peer2peer models like flodding, gossip protocols.

## Network connectivity

Recommented solution: MQTT, possibly via [msgflo.org](https://msgflo.org).
Can be done directly on Ethernet,WiFi and cellular. For LoRa,NB-IoT can use standardized bridging?
For non-Internet protocol, might want to have tools to bridge. Serial/USB/Bluetooth.

# Persistent message queues

When network connectivity is unreliable / intermittent, sensors producing data should
hold the data locally until it can be sent (and message reception is confirmed).
When the device is battery powered and utilizing sleep, the to-be-sent data should be persisted
to a non-volatile storage medium.
This again is challening because both EEPROM and Flash support very few write/erase cycles on the cell level.
Naive implementations will just last for months/weeks for per-minute updates.


Existing implementations

* [kentfitch/Simple-message-queue](https://github.com/kentfitch/Simple-message-queue). Java
* [Persistent pipes in Linux](https://gist.github.com/CAFxX/571a1558db9a7b393579)
* [RingFS](https://github.com/cloudyourcar/ringfs). C99, optimized for NOR flash
* [flashee](https://github.com/m-mcgowan/spark-flashee-eeprom). Implements wear-levelling and circular buffers on external SPI Flash.
For Spark Photon/Particle, but pluggable IO backends.

References

* [ELF: An Efficient Log-Structured Flash File System For Micro Sensor Nodes](https://www.cs.colorado.edu/~rhan/Papers/sensys_elf_external.pdf)
* [ournaled Flash Storage – Emulating EEPROM over Flash, ACID Transactions, and More](http://ithare.com/journaled-flash-storage-emulating-eeprom-over-flash-acid-transactions-and-more-part-ii-existing-implementations-by-atmel-silabs-ti-stm-and-microchip/)
* [Avoiding EEPROM wearout](https://betterembsw.blogspot.com.es/2015/07/avoiding-eeprom-wearout.html)


Dataflow instruction-set and processsors
==========================================
[Alan Kay argues](http://vimeo.com/82301919) that not only should our programming models and languages
be created/shaped to reflect what is best for the task at hand,
processors and their instruction sets should too.

What kind of processor would fit MicroFlo?

* Isolated memory per component
* Hardware queues for inter-component communication
* Realizable as FPGA soft-core(s)
* Fast thread switching
* Address space smaller than register unit? (16bit/32bit)
* Allow component to be implemented in hardware, transparently

Challenges:

* Implementing the thing in VHDL/Verilog
* Creating a C/C++ (or similar) toolchain. Some Forth might be a good start
* Avoiding too much waste in fitting memory regions to a program

### References

Open hardware soft-cpus

* [The Supersmall soft processor](http://www.eecg.toronto.edu/~jayar/pubs/robinson/robinsonspl10.pdf)
* [Navre, AVR8 compatible, used in Milkymist](http://opencores.org/project,navre)
* [J1, 200-line Forth machine](http://excamera.com/sphinx/fpga-j1.html)
* [gr0040, small 16-bit core, custom LLVM/llc backend](http://www.fpgacpu.org/papers/soc-gr0040-paper.pdf)

Stack computers (as opposed to register)

* [Stack Computers: the new wave (1989)](https://users.ece.cmu.edu/~koopman/stack_computers/index.html)
* [Programming a 144-computer Chip to Minimize Power](http://www.infoq.com/presentations/power-144-chip),
discusses GreenArray . 37 opcodes.
Can 'jump to a port (memory mapped by neighbouring processor)', which allows waiting for instructions from it.
* [4stack](https://en.wikiversity.org/wiki/Computer_Architecture_Lab/WS2007/SHWH/Processor_Comparison#4stack),
four-way instruction-parallell processor.



### Questions/ideas:

* Can one save/avoid per-thread program counters
by having one entrypoint for component and executing to completion always?
* Can one use a stack-based language inside components,
where the dataflow engine places variables on stack before component execution,
and a 'send' word passes data to an outport
* Altenatively a stack-based language, that uses 'read' word to do blocking read on a port,
syncronized in hardware for more classical-FBP type interaction

Direct manipulation when programming physical devices
====================================================

Motivations: 

* Establish connections between outside ("user interface" / "environment")
and inside ("the program")
* Build appropriate mental models for how device works
* Manipulate virtually the user interface and environment,
seeing virtually or physically the results
* Programming in terms of (desired) actions on UI/environment
instead of symbols in the program

Considerations:

* Device can be stationary, or operating over a space
* Visualizations can be UI/IO-centric or model-centric
* Preview/simulation should always be in sync with device

Implementation:

* Device should in addition to information about its internals,
send interactive models representing its externals
* In Flowhub this could be a URL to a NoFlo-browser preview runtime
* Requires preview runtime to be loadable from URL
* Changes in device should be reflected in simulation,
changes should be possible to make in simulation refected on device
* Communicate using edge data subscriptions/injections,
or through dedicated channel/subprotocol??
On MicroFlo we have the I/O abstraction to hook into
* Might require additional components designed for preview
* Perhaps the same ones can be used for end-to-end tests?

Possible testcases: 

* Fridge
* Mirobot
* Lasercutter/mill

Robotics, smart-physical device development
=============================================

Moved to [bitraf/mirusumo](https://github.com/bitraf/mirusumo) project

# Functional programming embedded devices

## Ideas

## Time-dependent logic

Expressing time-dependent logic as a function of time, by passing monotonic timestamps,
including current time to the function from the outside.
For instance done in [dlock13-msgflo](https://github.com/bitraf/dlock13/blob/master/dlock13-msgflo/dlock13.cpp#L83),
and in [rebirth](https://github.com/jonnor/rebirth).

## Separate state calculation and application

Separating calculation of new state from the realization of such a state.

Express the entire state as a datastructure of plain-old-data, with value semantics.
On each event which may change state, re-calculate the state.
If new state depends on old state, pass the previous state in (as immutable value).
The I/O parts can now be hidden inside the function which realizes the passed state value.
It can be implemented from scratch, or using existing libraries.
But, we can also use alternative implementations.
For instance a function which renders a (virtual) graphical representation of the state.
Now we can develop & validate large parts of our app off-target, in a way very suited for automated testing (TDD/BDD).

Verification of the IO application can also be done rigoriously, as the possiblities
are stated in the datastructure (assuming static typing).
The state can be (de)serialized, enabling data-driven tests.

Because state is just a value, we can represent many states, for instance for time-travel debugging,
or to explore impacts of changing an input, or the code ('alternative universes'), on a whole sequence of state changes.

This is similar to functional-reactive-programming (FRP), and webapplication tools like React/Redux, Elm etc.
One could see the I/O of the microcontroller/embedded-system as a very thin "View" layer.

Some of this being explored in https://github.com/jonnor/projects/blob/master/introspectable-computing/neopixels-frp/neopixels.cpp


References

* [The Functional Paradigm in Embedded Real-Time Systems](http://www.idt.mdh.se/utbildning/exjobb/files/TR1636.pdf) (2014)
Case study on re-implementing imperative/OOP with functional programming in C.
Includes implementation of the I/O monad and Maybe monad.
Cons: garbage collection from enforcement of immutability.
* [Threading the Arduino with Haskell](https://tfp2016.org/papers/TFP_2016_paper_5.pdf),
Haskino.
* [frp-arduino](https://github.com/frp-arduino/frp-arduino).
Haskell embedded DSL, with streams and operators as the main primitives. Compiles to C.
* [Juniper](http://www.juniper-lang.org/), functional reactive programming language for Arduino,
compiles to C++.
* [The Curse of the Excluded Middle](http://queue.acm.org/detail.cfm?id=2611829), 
"Mostly functional" programming does not work.
* [Functional Reactive Programming for Real-Time Reactive Systems](http://haskell.cs.yale.edu/wp-content/uploads/2011/02/wan-thesis.pdf)
includes a comparison of syncronous dataflow and FBP.
* [Emfrp: A Functional Reactive Programming Language for Small-Scale Embedded Systems](http://www.psg.cs.titech.ac.jp/files/crow2016.pdf)
* [Higher-Order Functional Reactive Programming without Spacetime Leaks](https://www.mpi-sws.org/~neelk/simple-frp.pdf)
* [Practical Functional Reactive Programming](http://www.cs.jhu.edu/~roe/padl2014.pdf), using Python as host language.
* [Building Embedded Systems with Embedded DSLs](https://www.cs.indiana.edu/~lepike/pubs/embedded-experience.pdf)



Introspective programs
=======================

Goal-based programming
-----------------------

One way of implementing introspective programs: goal-trees.
Can explain not only what they are, but also how they work.
Using goal-trees one can answer how something is done
by looking downwards in tree, and why something was done by looking up.

[OpenCourseWare MIT 2010 Artifical 3. Reasoning: Goal Trees and Rule-Based Expert Systems](https://www.youtube.com/watch?v=leXa7EKUPFk)

Should enable interactive user interfaces which
allows to build up rule-based systemes, and probably
be used to build programming-by-example/demonstration interfaces.

Because the goal-tree is expressed as a graph of and+or-nodes,
they can also be done directly in Flowhub. Or, one could use
Flowhub to visualize goal-tree developed in another way.
Could for instance be a subcomponent.

Heuristics for developing knowledge (to build goal-tree):

* Look at how a specific case should be handled
* Ask questions about cases which are handled diffently, but are seemingly the same
* Run the system until failure -> find what knowledge was missing

http://c2.com/cgi/wiki?GoalBasedProgramming


"Arch Learning"
----------------
[OpenCourseWare MIT 2010 Artifical 15. Learning: Near Misses, Felicity Conditions](https://www.youtube.com/watch?v=sh3EPjhhd40&list=PLUl4u3cNGP63gFHB6xb-kVBiQHYe_4hSi&index=15)

Represents a model of things/knowledge, as a graph of relationships to properties/objects.
There is an initial model being evolved over multiple iterations.

Can be taught by presenting with new items and an evalutation.
If item matches the model "is an example of" -> we generalize the relevant relationship.
If it almost, but not quite matches the model "near miss" -> we specialize or create new relationship.

Or can be taught by presenting two sets of items and a statement about how they are disjoint.
Iteratively we can then mutate the relationships to generalize and specialize, such that
we find for which modified model items are grouped correctly.

Notable because it learns something from every iteration. "one shot"

Could be implemented with a graph database, and then have interactive or batch-based
interface for teaching the model.


Related tools,project,links
============================

Flow-based/dataflow concepts

* http://www.jpaulmorrison.com/fbp/
* http://c2.com/cgi/wiki?DataFlowBasedProgramming
* http://www.reddit.com/r/dataflowprogramming/

Physical computing with JavaScript

* https://github.com/rwaldron/johnny-five
* https://github.com/jgautier/firmata
* http://breakoutjs.com/
* https://github.com/jadonk/bonescript

Visual programming for Arduino/microcontrollers/embedded etc.

* http://babuinoproject.blogspot.de/2009/09/software.html
* http://dimeb.informatik.uni-bremen.de/eduwear/about/
* http://blog.ardublock.com/
* https://github.com/gasolin/BlocklyDuino
* http://www.mindplus.cc/
* http://www.modkit.com/
* http://blog.minibloq.org/
* http://s4a.cat/
* http://sourceforge.net/projects/qpc/
* http://playground.arduino.cc/Code/QP
* http://ardomotic.com/ (web-UI GUI builder)
* http://sourceforge.net/projects/ktechlab (poorly maintained)
* http://www.embrio.io/ (non-free, Windows-only).
* http://www.flowol.com/InterfaceArduino.aspx (non-free)
* http://microuml.net/microuml.html (non-free service)
* http://www.3d-svs.com/3dmicro-toolkit (non-free LabVIEW addon)
* http://www.axoloti.com Audio/DSP oriented, has visual 'patching' UI, open source.

Modelling and meta-programming tool
* http://www.oooneida.org/RD_projects_ODC_Environment.html
* http://www.jetbrains.com/mps
* http://www.eclipse.org/modeling/emf/
* http://openembedd.org/MDE

Online Arduino IDEs

* https://codebender.cc/ (open source)
* https://mbed.org/handbook/mbed-Compiler (proprietary)

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

Visions on programming
========

* http://www.lighttable.com/2014/05/16/pain-we-forgot/


## Protocol improvements

* Fix truncating 32bit values
* Get build ID. For looking up componentmap

Subgraph support
* ?

Dynamic exports
* Get exported port ids
* Get exported port name
* Update export port name
* Export/unexport port

Persist programmable
* Get current graph/stream
* Support persist commandsteam
* Get node name
* Update node name

Component info
* List available components (ids)
* Get component name, num ports
* Get component port type
* Get component port name
* Get component port description

Complex types
* De/serialize composite datatypes

### FBP direct
* Implement FBP protocol directly, or trivial 1-1 mapping



Authenticatin is done once, not per message
Client can enforce limit on string lengths.
Low progmem requirements.
  
Low RAM requirements.
  Parseable as a stream
  Sendable as a stream
  
Can also represent program data
  Maybe as a structured two-way mapping of JSON
  Or just

{ "protocol": "graph", "command": "addnode", "payload": { "graph" } } -> INT messageType 

messageType,requestNo,componentName,graphName,nodeName
ENUM/INT,   INT      ,(LENGTH,UTF8),(LENGTH,UTF8),(LENGTH,UTF8)
1,          32,      ,(8,foo/Baar) ,()           ,(4,myFoo)

responseType,responseTo(requestNo)
ENUM/INT    ,INT

However need to know when message ends... In MsgPack, using a map for entire message would give both that and
Would probably require keys to be integers, and that key,values come in ascending order.

graph:addnode schema/transformation
{ 'messageType': 0, 'request': 1, 'componentName': 2, 'graphName': 3, 'nodeName': 4, '__newthing': 5 }

{ 0:1,          1:32,      2:(8,foo/Baar) 3:(5,mygraph)           ,(4,myFoo)

Prototype implementation on microcontroller. Initially separately from MicroFlo.
Check memory/program usage etc

https://github.com/clwi/CWPack has nice API features: incremental reading. But 
https://github.com/ludocode/mpack . Maybe nice error handling. Only need to check for errors once when finalizing a read
Question: Does it work with streams?



## Execution model
Two aspects: packet delivery and component triggering

As of MicroFlo 0.5, packet delivery is breadth-first:
Packets generated from one iteration are delivered to all targets.
Outputs are stored temporarily, then delivered in the next iteration (in order).
Each iteration yields back to the main loop, which keeps the time blocked.
This is desirable when used together with other pieces of code.

Component triggering is up to each component. There exists some special convenience functions,
like `SingleOutputComponent` and `PureFunctionComponent2`.
Pure2 has problems with double-triggering, and SingleOutput is not that convenient.

### Generate port sizes/length
For input/outports. Can then be used to hold outports, which makes SingleOutputComponent no longer needed. 

### Mark triggering ports

Should have FBP protocol support for annotating component port as 'triggering' > meaning will produce output.
That would allow Flowhub IDE to visually mark these as distinct from non-triggering ports
(sometimes called 'parameter' / param ports). Also applies to NoFlo

### Dataflow-style triggering
As implemented in PureData and similar.

When packet is sent to non-triggering port:
Store the data as the current value for that port

When packet is sent to triggering port:
If type is bang/void, the computation is triggered with current port-values.
For other packet types, the new value is stored, then computation triggered. 

Typically a single triggering port exists, all other are non-triggering.

To trigger updates on a non-triggering port, a Bang node is used in-between.
It takes an input, sends it out on one output, and on another output sends a bang/void to triggering port.

Primary advantages are:
* Prevents unecessary triggering.
May cause intermittent invalid/wrong data, or extraneous data (multiple output values for what should have been one)
* Lets graph author control triggering
* Predictable/consistent component behavior
* Quite simple
* Known from other dataflow systems
* Close mapping to functional programming

Disadvantages:
* Order of packet receiption is significant
* Connections cannot have capacity (>1)?
No way to implement backpressure in

What about errors on non-triggering ports?
Would have to defer checking to when triggering, since failures will produce error packets.
Problem then is that multiple errors will mask eachother?
And might get disconnected in time, since triggering might happens way later.

But the 'activation' set of input packets that is associated with an output message.
can be recontructed from the packet stream (last values sent).
One could also dump it explicitly along with component state for deeper debugging.


### Convention and convenience
Is it too much work to implement this pattern in each component?
It means a higher likelihood of a component deviating or being buggy.

Allowing deviation can be useful, allows to have edge cases find independent solutions.
However, if deviation is too common then consistency/predictability suffers.

Can be addressed instead with tooling. Easy tests checking/demonstrating component behavior.


### Default component skeleton

```
// Prefer to use pure functions for most of the logic, call from component
Packet doSomething(int a, Packet b, bool c) {
    return Packet(1337);
}

class SomeComponent : public Component {
private:
    Packet portData[InPortsLength];
    Connection outPorts[OutPortsLength];

public:
    SomeComponent()
        : Component(outPorts, OutPortsLength)
    {}

    void process(MicroFlo::Packet pkg, MicroFlo::PortId port) {

        // Note: room for optimization memory usage a bit, by using more specific types
        MICROFLO_ERROR_UNLESS(port < PortsLength, ErrorUnsupportedPort);

        // Store input data
        if (pkg.isData() && !pkg.isVoid()) {
            portData[port] = pkg;
        }

        // triggering port
        if (port == Ports::in) {
            // check preconditions
            const bool correctTypes = (portData[0].type == MsgInteger
                    && portData[1].type == MsgInteger
                    && portData[2].type == MsgBoolean);
            MICROFLO_ERROR_UNLESS(correctTypes, ErrorUnsupportedType);
            // do the work
            const auto out = doSomething(portData[0], portData[1], portData[2]);
            // send output(s)
            // check postconditions
            MICROFLO_ERROR_UNLESS(out.type == MsgError, ErrorComponentBug);
            send(Ports::out, out);
         }
    }

};
```

### Error checking macro
Helper for use in components

```
MICROFLO_ERROR_UNLESS(expr, errorKind)
  if (!expr) {
    return send(OutPorts::error, errorKind)
  }
```

### Avoiding many (triggering) inports
I/O type components like DigitalWrite, LedChainWS have a 'multi-stage' use.
First all data to initialize the hardware correctly must be provided,
and then initialization/setup happens.
Then the data to send/set on the hardware.

### Generators??
These are 'self-triggering', which doesn't really fit in?
`Timer` is a prime example. Another is interrupts. 

### Timers and sleeping

Timer should really have an alternative which puts microcontroller to sleep.
This could be done by having a shared `Scheduler` instance,
which keeps track of next event (for a set of timers).
Should then attempt to sleep until that time, possibly corrected by a drift factor.
Will run for a long time, so must handle overflows in time gracefully.
Could use a priority queue, but for small number of timers an array is just fine.
Can possibly be a regular Arduino library? Should also have implementation for Linux.
Should dispatch be a callback? Or should it be poll-based in mainloop?
Less threading/control issues with the latter, easy to call a function/callback from there (but not v.v).

### Function -> component transformation
Can we do the component boilerplate automatically, from a C++ function?

```
int myfunction(int triggeringValue, int paramA, int paramB = 10)
```

Can it trigger when no paramA has been received?
Could mark the port as `required`. Ports with defaults cannot be required, default value should then be used.

How to represent errors in such a function? Exceptions are not suitable on embedded targets.
Could require function to return Packet in that case, which may contain Error type/value.

```
Packet maybeerrors(int triggering);
```

### Subgraph optimizations

Would an opinionated approach allow to automatically compile down a subgraph of nodes to a function?
This would be desirable optimization for enabling especially large and performance sensitive programs.
A challenge is the storage needed for 'temporaries' in the packet delivery. For breadth-first

### Network execution time

Aside, it could be useful for debugging to keep track of network execution 'time'.
monotonic integer, either increasing with each tick/iteration - or each packet emitted.
Note: Tracking packet emissions/delivery are relevant for started/stopped semantics also.
On the Network, and possibly stamped onto packets (w/time).



## Demo v0.5
MicroFlo - visual live-coding for microcontrollers 
"Powered by Flowhub IDE"
version 0.5
Get started: microflo.org

Setup:

Start with git repo
Show inital graph .FBP
Run generate command
Open Arduino IDE, plug in Arduino, flash
Start runtime, open in Flowhub

Live-coding:

Default: Blinking LED
Changing blink rate in SW
Adding an LED on different pin, switching the pin over
Adding a button. Attaching this to turn LED on/off. Invert LED control. Keep the original LED blinking
Add a potmeter. Use to control LED on/off rate.
Change to analogWrite for PWM control. Use potmeter to control brightness.
Reset -> back to scratch

XXX: end up with an OK example in the end? Some interactive LED animated thing?

Make it persistent:

Save JSON in Flowhub, put into folder
Change filenames
Generate anew
Flash in Arduino IDE
Reset -> still works like before

Maybe:

Add a wire+1mohm resistor. Use capacitive touch. Threshold to boolean control, touch, or distance sense
Add a ultrasonic distance sensor

the-graph: Make command for rendering SVG/PNG from .fbp/.json.
Use to generate docs. Use wiring diagrams from Arduino docs, link them



## Flowhub IoT demo kit
MicroFlo + MsgFlo

### Nodes

Base
* Wemos D1 mini
[1x](https://www.banggood.com/WeMos-D1-Mini-V2-NodeMcu-4M-Bytes-Lua-WIFI-Internet-Of-Things-Development-Board-Based-ESP8266-p-1115398.html)
* Wemos Battery base
[5x](https://www.banggood.com/5Pcs-WeMos-D1-Mini-Single-Lithium-Battery-Charging-And-Battery-Boost-Shield-p-1123520.html)
* LiPo battery

Shields 
* OLED
* Protoboard
[3x](https://www.banggood.com/3Pcs-WeMos-ProtoBoard-Shield-For-WeMos-D1-Mini-Double-Sided-Perf-Board-Compatible-p-1185111.html) 

Missing shields?
* Microphone / soundlevel
* Accelerometer
* PIR motion detect

UI modules
* Button + RGB LED.
* 2x Button+Red+Green LEDs
* Rotary encoder + LED array

I/O modules
* 3out+3in+analog, 5-24V range.

### Gateway

* MQTT broker
* MsgFlo coordinator
* FBP runtime protocol
* Serve minimal Flowhub
* Allows connect from full Flowhub
* Support/default WiFi station mode, allows to switch to client
* Bridge to other transports and Internet. Ethernet, Bluetooth
* Timeseries database
* Forwards communication to/from nodes
* Can serve custom webUIs/dashboards
* Device/node monitoring support, alerting
* Push updates to nodes

Probably some Linux box, with ARM multicore.
Different pieces running as Docker containers?
Should have solid storage solution. RPi not good...
https://www.olimex.com/Products/OLinuXino/A20/A20-OLinuXino-LIME2/open-source-hardware
https://www.olimex.com/Products/OLinuXino/BOXES/BOX-LIME/

Or fuck all this and put it as a VM up in the cloud?
Use standard networking gear to establish connectivity up there.


### Ideas

Replicate WiFi credentials from master -> node.
Ie over serialport. Should be simple plugin/tap/connect, impossible to do wrong


## Dream IoT
Device running -> automatically discovered, connectable
No/minimal fucking with connectivity/credentials
Local only fully supported, Internet connectivity optional

Connections happen using visual UI.
Can reprogram individual devices from same UI, in same way.
Also "upload" ready-made on-edge functionality
! need to know hardware capabilities of device, incl peripherals

