
# Meta

Short talk at [Meshcon](http://meshcon.net) during [Maker Faire Berlin 2015](http://makerfaire.berlin)

Audience

1. makers/hackers
2. professional software developers

Problemareas

1. Embedded microcontrollers in electronics
2. Internet of Things

Talk arch/thread

1. The problem (of current programming models for microcontrollers)
2. A solution (FBP, Microflo, Flowhub)


# Programming today
About microcontrollers, but representative of most domains/fields.
Exceptions: game industry, music programing, video/VFX

textual 'code'
C++, Arduino
-> write -> compile -> upload -> restart -> manually check
   repeat

# Disadvantages

## Thinking like the machine

Executing one instruction at a time. First this, then that.
Specifying exactly how to perform a task

Hard to do multiple things 'at same time'.
Arduino beginners struggle merging two program snippets

We want to think in terms of the problem.
If we're dealing with robotics, want to see and operate
around sensors, motors, motion planning

What the programmer had in his mind hard to deduce from the code

## Slow feedback loop

Making a minor change takes a long time.
Example: tuning some parameter
Hard to exploring your way to a solution

## Making sure it works

Manual process. Very tedious to always have to trigger code directly
For some things quite hard.
Like effects of timers that run over many minutes,
some things that happen only once a day.

Strict encapsulation means you can be fairly confident what changes affect
[Automated testing with fbp-spec](https://github.com/flowbased/fbp-spec)


# Enter MicroFlo, FBP

Sick of the current state. Started in 2013
Other people working on same problems. NoFlo UI kickstarter

FBP 101. Black boxes, independent, no knowledge of outside world
Communicating with eachother by sending messages

Can also program MicroFlo textually.
Can embed MicroFlo into existing programs

# How it works

Demo [Flowhub](http://app.flowhub.io) live

Example projects:

* [Ingress Table](http://bergie.iki.fi/blog/ingress-table)
* [fridge](www.jonnor.com/2013/09/microflo-0-1-0-and-an-arduino-powered-fridge)
 

# Current status

Can be used for simple programs

Supports many microcontrollers.
Arduino, ARM-Cortex M* (TI, mbed, NXP).
Very easy to port to new ones (1-2 days)

New release out very soon!


# Get Involved

* [MsgFlo, MicroFLo and MQTT workshop @ c-base, Monday at 17.00](https://plus.google.com/events/c532t23tqd6h901i3f6hv81mlps)
* Catch me here at Meshcon / MakerFaire!
* microflo.org
* Flowhub.io



# Overflow

Differences to Scratch.
dataflow, not imperative
