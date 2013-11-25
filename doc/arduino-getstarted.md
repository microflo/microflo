Prerequisites
-----------------

1. Install [Arduino IDE](http://arduino.cc/en/Main/Software#toc2),
  following the [official guide](http://arduino.cc/en/Guide/HomePage)
2. Download and install [Node.js](http://nodejs.org/download/)


Download MicroFlo
-----------------

Download the latest [MicroFlo release](https://github.com/jonnor/microflo/releases)

Unpack the .zip file to a well-known directory.


Flash MicroFlo runtime to your Arduino
-------------------------------------
Open the Arduino IDE

Import the MicroFlo library

    Sketch -> Import Library -> Add Library... -> Chose microflo-arduino.zip

Open the provided MicroFlo example

    File -> examples -> microflo -> Standalone

Flash to device

    Click "Upload"

Your Arduino should now have a blinking LED, blinking around 2 times per second.
This is the default MicroFlo program that is embedded in the firmware,
and new programs can now be uploaded using MicroFlo.

Install & run MicroFlo
-----------------------

Open up a command line shell.
On Windows, run the "Node.js prompt" application. On Mac, run "Terminal".

Move to where you downloaded MicroFlo

    cd microflo

Install it

    npm install

Start it. Check that serial port is guessed correctly.

    node ./microflo.js runtime


Run Microflo UI
--------------------

Open a modern web browser (Safari/Chrome/Firefox)

    File -> Open -> Chose microflo-ui/index.html

Create first application
------------------------

Create a new sketch.
* Name it "Blink"
* Chose "MicroFlo" as runtime

Create the following graph, using Add (+) to add each of the components, and dragging to connect.

    |--------|       |---------------|    |--------------|
    | Timer  |-------| ToggleBoolean |----| DigitalWrite |
    |--------|       |---------------|    |--------------|
     interval=100		            pin=13

When done, hit the Play button (>) to upload it to your Arduino.

You should now see the LED of your Arduino blinking much faster, about 7 times a second.
If so you have a working MicroFlo for Arduino setup, and can now try to build more complicated programs!

