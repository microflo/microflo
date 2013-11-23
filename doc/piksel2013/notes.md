Piksel Festival 2013, Bergen
==============================
* 23 November, 15:15 at Østre
* [Blurb](http://13.piksel.no/2013/11/07/microflo-flow-based-programming-for-microcontrollers)
* [Recording](http://bambuser.com/v/4122524#t=13518s)
* Slides [ODT](./slides.odt)|[PDF](./slides.pdf)

Status
------
Done

Goals
----------------
* Spark interest around visual programming models for microcontrollers
* Gather feedback from artists that have used Arduino etc: what do they find lacking

Storyarc
-----------
?

Outline
--------
?

Perspectives / Motivation
--------------------------
Consumer
* Opportunity to tweak, hack, learn -> become a hobbyist
* Feel in control of the device


Hobbyist
* Fun, instant gratification
* Fast, but unbounded learning curve -> become a professional
* Exploratory learning and making


Professional
* Correctness, testability
* Predictable, short development times
* Self-documenting, easy-to-understand systems


The Digital Divide
--------------------
* Technical systems encode assumptions about people/processes
Can be used to restrict/enforce what is allowed and what is not.
Will always have a set of allowances and disallowances -
things it makes easy and hard. This also shapes peoples behavior

* Technical systems become ever more pervasive in our lives.
In the home, at the workplace, in governance.
Embedded systems are, and will by definition, be in the forefront of this

* Power asymmetry between those who can make/create, and those who can only use/consume
Used to be divided between those who have the financial means (capital)
to produce things and those who did not.
Traditionally this was physical property like resources, soil, machinery.
As we in the tech. industry increasingly make capital less important,
knowledge and "intellectual property" gains importance.

* Existing disadvantaged groups at highest risk
Low income, small populations, socially unfavored
Financial interests in maintaining the status quo of large disparities


Democratize Digital Creation
---------------------------
* Hardware is becoming general purpose, re-programmable
What is the difference between a toaster and a solder-owen for electronics? Software (and pricetag)
"There are no airplanes, only computers that fly. There are no cars, only computers we sit in.
There are no hearing aids, only computers we put in our ears" - [Cory Doctorow](http://boingboing.net/2012/01/10/lockdown.html)

* Free software and Open Hardware required
Removes practical barrier of having to ask anyone, all permissons granted up-front.
Freedom to study, improve, redistribute;
for everyone (regardless of nationality, income) and for any purpose.

* But not enough!
Very practical concerns and problems remain.
Teaching people that they have freedom and ability to change things as they like.
Encouraging them to grab and make use of this freedom, providing the tools
and documentation neccesary, teaching them how. Also, the freedom must have concrete
benefits for the person. Being able to earn a living, feed oneself and family important.
Put pointedly, achieving Digital Freedom is just as much about reprogramming society,
to make people refuse the idea of being a passive consumer, that it is about technology.
Of course brings up the philosophical questions: "Can one give someone freedom?" and
"Do all people (or any at all) have the capability of own, creative thought?"

* Usefulness and usability at the forefront

* Physical computing and safety
When reprogramming has real-world effects, safety of users becomes a very real concern


Imperative, textual programming
----------------------

* Hard to program on touch-centric devices, where text input and navigation is slow and error-prone

* Imperative programming presumes an sequential, one-thing-at-a-time computing model
OK for Van Neumann-like processors,
but multi-core CPU, DSP, FPGA, GPUs not well represented.
Also does not map well to problems where the computer wants to do other things
while waiting for high-latency operations like disk I/O, network, user input, physical changes.
Asyncronous or event-driven models.

* Models used when programming often don't map easily to the systems they represent.
Diagrams and other rich, high-level system descriptions usually stay at the whiteboard,
and cease to reflect the realized system very fast as changed are introduced as we learn more.
The mapping between the inputs of a system, the state of the system and its outputs (intended or actual)
extremely hard to know and understand without knowing all of the (low-level) code
"Code is blindly manipulating symbols" - [Bret Victor](http://vimeo.com/66085662)

* Many programmers seem to fear not having instruction-level control
Possibly a fear that the machine (or machinery) will have more control over us than we over it.
Paradoxially, the machine does end up dictating us - because we've tailored our notational systems 
to how the machine works - not to how most humans understand things.

* Programmers are a special breed, and they should not be
We've trained, and we continue to, train large amounts of people to speak the language of machines
Instead of changing the machines to understand something closer to our language.

"There should be no automotive software engineers, only people that make computers drive.
No aerospace software engineers, only people that make computers fly."

* Everyone have the ability to learn to program
Anyone who can catch a ball can correctly calculate the outcome of multi-dimensional parabolas,
someone who can answer a question can understand someones elses thoughts from varying air pressure!
Most people can do both without thinking twice.
Sidenote: playing out these two scenarios would be a very fun rethorical device in a presentation.
Could prompt the question "Does anyone here believe that not everyone can become a programmer?",
toss the ball to such a person in audience. Have multiple balls, case person does not get it on first ;)


Visual progamming models
------------------------
* Sequence-diagrams
* Data-flow
* Finite state machines
* Ladder-based
* Imperative symbolic
* UML


Code generation FAIL
------------------------
Tools that do code generation assumes waterfall,
that design/modelling stage ends up in code,
never need to go back to modelling stage.

We need to support fast iterative workflows,
high-level descriptions staying in sync with the realization.
Need strong two-way mappings when debugging,
working ones way back from a certain outcome to its origin/reason.

Tools used for mapping high-level description to low-level
cannot only be used by certain groups of people ("architects"),
introduces a human/organizational communication barrier

Vision
-------
* Electronic/embedded devices that come with (re-)programming tools built in
* Easy transition between "normal" user interface, and the IDE.
* Blurry boarders beween using, configuring, tweaking, reprogramming, repurposing
* The program is a live, rich, visual and interactive representation of the system
* Multiple abstraction/architectural levels, starting high-level, increasing level of detail

Why FBP
---------
* Decent theoretical foundation, much thanks to J.P. Morrisons book.
* Data-flow a proven concept for domain-specific modelling.
* Has a community of practiconers, with some livelyness right now, much thanks to NoFlo kickstarter

Status
-------
* What pieces to we have
* What works, what can it be used for
* Current limitations
* Concrete TODOs

Future
-----------
* Hetrogenous systems
* Distributed & collaborative programs
* "Internet of Things"
* Live-coding on microcontrollers???


