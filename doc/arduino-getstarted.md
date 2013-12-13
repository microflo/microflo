If you have trouble
--------------------
[Get in touch](../README.md#contact)

Supported boards and operating systems
------------------------------

MicroFlo has been tested working with:
* Arduino Uno R3
* Arduino Nano R3
* Arduino Lenonardo R3
* Arduino Mega 2560

Other AVR-based Ardunino boards will probably work.
ARM- (Arduino Due) and x86-based (Intel Gallileo) boards I have no idea.

MicroFlo has been tested working with:
* Windows 8 (Windows XP SP3+ should work)
* Mac OSX 10.9 Mavericks (OSX 10.6+ should work)
* Arch Linux and Ubuntu Linux 12.04 (any GNU/Linux should work)

Prerequisites
-----------------
You should be comfortable installing software off the Internet, following technical instructions,
and not be afraid to open a terminal. Getting a working setup will take about 1 hour, most of it
due to downloading. You will in the process also get a working Node.js and plain Arduino environment.

1. Install [Arduino IDE](http://arduino.cc/en/Main/Software#toc2),
  following the [official guide](http://arduino.cc/en/Guide/HomePage)
2. Download and install [Node.js](http://nodejs.org/download/) (NB: must use 32bit for Windows and 64bit for Mac!)

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
This is the default MicroFlo program that is embedded in the firmware.
New programs can now be uploaded using MicroFlo.

Install & run MicroFlo
-----------------------

Open up a command line shell.
On Windows, run the "Node.js prompt" application. On Mac, run "Terminal".

Move to where you downloaded MicroFlo

    cd microflo

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

Create the following graph
* Use Add (+) to add each of the nodes
* Drag from the outlet of a node [ ] to the inlet of another to connect.
* Click the title of a node "Timer" to edit properties like pin & interval

```
     |--------|       |---------------|    |--------------|
     | Timer  |-------| ToggleBoolean |----| DigitalWrite |
     |--------|       |---------------|    |--------------|
       interval=100                             pin=13
```

When done, hit the Play button (>) to upload it to your Arduino. Uploading will take ~1 second,
and you will see the RX/TX LEDs on the board blink during this time.

You should now see the LED of your Arduino blinking much faster, about 7 times a second.
If so you have a working MicroFlo for Arduino setup, and can now try to build more complicated programs!

Baking in your custom app
-------------------------

Applications uploaded from the IDE are not persistent, that is: if the Arduino is reset or
loses power, the application is no longer there. To fix this we will "bake", or embedd
the program into the firmware that is uploaded to and stored in Arduino.

In the Microflo UI

    Click the menu button, next to search, then the </> button (view source)
    Now Copy & paste the text into a new text file, called "mygraph.json". Put it in the "microflo" folder

In the console, run

    node microflo.js generate mygraph.json

In the Arduino IDE

    Open the file "mygraph.pde" found in the "microflo" folder (next to mygraph.json), and hit upload

You can now try to hit the "Reset" button on your Arduino, and when the device
boots again it should now run your custom program (until you upload something different)!

Note: in the future, this functionality will be offered directly through the UI
([issue](https://github.com/jonnor/microflo/issues/20)).

Creating and modifying components
---------------------------------

At some point you will probably want to add new components, or make changes to existing components.

In a text editor

    Open the "components.cpp" and "components.json" found in the "microflo/microflo" folder
    Make your changes

In the console, run

    node microflo.js update-defs

Using a file browser

    Copy all the files in the "microflo/microflo" folder into the "microflo" folder found in your Arduino sketchbook.

You can now run the Microflo runtime again (and hit "Connect"), upload new firmware using Arduino IDE,
and your new/changed component will be available.

For a list of components that people have requested and/or made,
see the [component wishlist](https://github.com/jonnor/microflo/issues/11).

Note: in the future, this functionality be offered directly through the UI
([issue](https://github.com/jonnor/microflo/issues/21)).
It will also become easier to add components without changing the files of MicroFlo itself.
