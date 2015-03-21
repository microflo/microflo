/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#ifdef EMSCRIPTEN
#include "emscripten_main.hpp"
#endif

#ifdef ARDUINO
#include "arduino_main.hpp"
#endif

// Plain AVR, no Arduino
#ifndef ARDUINO
#ifdef AVR
#include "avr_main.hpp"
#endif
#endif

#ifdef LINUX
#include "linux_main.hpp"
#endif

#ifdef TARGET_LPC1768
#include "mbed_main.hpp"
#endif

#ifdef STELLARIS
#include "stellaris_main.hpp"
#endif

#ifdef __ets__
#include "esp_main.hpp"
#endif
