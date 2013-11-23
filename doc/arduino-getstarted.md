Prerequisites
-----------------

1. Install [Arduino IDE](http://arduino.cc/en/Main/Software#toc2),
  following the [official guide](http://arduino.cc/en/Guide/HomePage)
2. Download and install [Node.js](http://nodejs.org/download/)


Download MicroFlo
-----------------

Download the latest [MicroFlo release](https://github.com/jonnor/microflo/releases)


Flash MicroFlo runtime to your Arduino
-------------------------------------
Open the Arduino IDE

Import the MicroFlo library

    Sketch -> Import Library -> Add Library... -> Chose microflo-arduino-XX.zip

Open the provided MicroFlo example

    examples -> microflo -> Standalone

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

Start it

    node ./microflo.js runtime


Run Microflo UI
--------------------

Open a modern web browser (Safari/Chrome/Firefox)

    File -> Open -> Chose microflo-ui-XX/index.html
