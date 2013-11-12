Next
=====
Released: N/A

Visually programmmable. When using NoFlo UI, one can create MicroFlo graphs visually
and upload to an Arduino while running.

Added support for running on Mac OSX and Windows, in addition to GNU/Linux.

Added components: AnalogRead, PwmWrite, MapLinear, Split, Gate, Route
Modified components: ToggleBoolean (added reset port), Timer (added enable+reset port)
Removed components: ToString (to be replaced by graph introspection/debug tools)

MicroFlo 0.1.0: "The Fridge"
==========================
Released: September 22, 2013

Minimally useful. Can write a .fbp program implementing the thermostat and
cooler control for a fridge, without any hardcoding or hacks.
[Link](http://www.jonnor.com/2013/09/microflo-0-1-0-and-an-arduino-powered-fridge)

Added IIP support in .fbp for configuring pins, timer intervals etc.

Added components: DigitalRead, InvertBoolean, ReadDallasTemperature, HysteresisLatch,
BreakBeforeMake, ArduinoUno, ToString, Delimit

MicroFlo 0.0.2: "A blink, an echo"
=========================
Released: September 9, 2013

Proof-of-concept working on an Arduino Uno. Can write .fbp program which
echos back communication on the serial port, or blinks an LED at a hardcoded interval and pin.

Added components: SerialIn, SerialOut, DigitalWrite, Timer, Forward
