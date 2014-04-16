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
You should be comfortable installing software off the Internet and following technical instructions.
Getting a working setup may take up to 1 hour, most of it due to downloading.
You will in the process also get a working plain Arduino environment.

1. Install [Arduino IDE](http://arduino.cc/en/Main/Software#toc2),
  following the [official guide](http://arduino.cc/en/Guide/HomePage)
2. Install [Google Chrome](https://www.google.com/chrome) or Chromium


Start Flowhub 
----------------

The IDE used for MicroFlo is Flowhub, please complete the first step
in the [setup instructions](http://flowhub.io/documentation/getting-started-microflo) before continuing.

Download MicroFlo
-----------------

Download the latest [MicroFlo release](https://github.com/jonnor/microflo/releases).
It should be version 0.3.0-alpha2 or later.

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

Install & run the MicroFlo app
---------------------------

Open Chrome and go to Menu -> Tools -> [Extensions](chrome://extensions)

* Enable developer mode
* Click "Load unpacked extension", select the microflo-app directory from where you downloaded MicroFlo

You should now see "MicroFlo" listed in your extensions, and in your Chrome [apps](chrome://apps).
Click it to open the app.

* Paste in your Flowhub user identifier in the top field.
* Select the correct serial port and baudrate.
* Click "Run"

If you go back to Flowhub now, and refresh your runtimes you should see "MicroFlo" listed.


Program with Flowhub
----------------

You should now have everything needed for programming your Arduino with Flowhub,
[continue there](http://flowhub.io/documentation/getting-started-microflo).


Advanced topics
=================

Baking in your custom app
-------------------------

Note: in the future, this functionality will be offered directly through the UI
([issue](https://github.com/jonnor/microflo/issues/20)).

Right now you need to use the commandline, see [README](../README.md)


Creating and modifying components
---------------------------------

In the future, this functionality be offered directly through the UI
([issue](https://github.com/jonnor/microflo/issues/21)).
It will also become easier to add components without changing the files of MicroFlo itself.

Right now you need to use the commandline, see [README](../README.md)
