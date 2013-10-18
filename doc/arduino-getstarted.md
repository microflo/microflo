Prerequisites
-----------------

1. Install [Arduino IDE](http://arduino.cc/en/Main/Software#toc2),
  following the [official guide](http://arduino.cc/en/Guide/HomePage)
2. Download and install [Node.js](http://nodejs.org/download/)


Download MicroFlo
-----------------

1. Download [MicroFlo for Arduino](https://dl.dropboxusercontent.com/s/57ggloyfq9iof3k/microflo-arduino-v0.1.0-71-g20d06b2.zip?dl=1&token_hash=AAGhYrYUgGVEVoAfeaN-T6xeMVur1lplo2GosyjSROm6MQ)
2. Download [MicroFlo UI](https://dl.dropboxusercontent.com/s/9nwk0wepb5qduvd/microflo-ui-24fa1f3.zip?dl=1&token_hash=AAF-JxYJJyWaV7ulUbRTA03x64GcHouLrMExiSb-0Q54EA)


Flash MicroFlo runtime to your Arduino
-------------------------------------
Open the Arduino IDE

Import the MicroFlo library
    Sketch -> Import Library -> Add Library...

Open the provided MicroFlo application
    examples -> microflo -> standalone.ino

Flash to devick
    Click "Upload"

Your Arduino should now have a blinking LED, blinking around 2 times per second

Install & run MicroFlo
-----------------------
Open up a terminal
    npm install microflo
    cd microflo
    node ./microflo.js runtime


Run Microflo UI
--------------------


