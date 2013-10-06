Next
=====
Released: N/A

Added components: AnalogRead, PwmWrite, MapLinear, Split

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
