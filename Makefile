# User configuration options
GRAPH=examples/blink.fbp
MODEL=uno
AVRMODEL=at90usb1287
MBED_GRAPH=examples/blink-mbed.fbp
LINUX_GRAPH=examples/blink-rpi.fbp
STELLARIS_GRAPH=examples/blink-stellaris.fbp
UPLOAD_DIR=/mnt

# SERIALPORT=/dev/somecustom
# ARDUINO=/home/user/Arduino-1.0.5

AVRSIZE=avr-size
AVRGCC=avr-g++
AVROBJCOPY=avr-objcopy
DFUPROGRAMMER=dfu-programmer
VERSION=$(shell git describe --tags --always)
OSX_ARDUINO_APP=/Applications/Arduino.app
AVR_FCPU=1000000UL

# Not normally customized
CPPFLAGS=-ffunction-sections -fdata-sections -g -Os -w
DEFINES='-DHAVE_DALLAS_TEMPERATURE -DHAVE_ADAFRUIT_NEOPIXEL -DHAVE_ADAFRUIT_WS2801'


INOOPTIONS=--board-model=$(MODEL)

ifdef SERIALPORT
INOUPLOADOPTIONS=--serial-port=$(SERIALPORT)
endif

ifdef ARDUINO
INOOPTIONS+=--arduino-dist=$(ARDUINO)
endif

# Platform specifics
ifeq ($(OS),Windows_NT)
	# TODO, test and fix
else
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Darwin)
        AVRSIZE=$(OSX_ARDUINO_APP)/Contents/Resources/Java/hardware/tools/avr/bin/avr-size
	AVRGCC=$(OSX_ARDUINO_APP)/Contents/Resources/Java/hardware/tools/avr/bin/avr-g++
	AVROBJCOPY=$(OSX_ARDUINO_APP)/Contents/Resources/Java/hardware/tools/avr/bin/avr-objcopy
    endif
    ifeq ($(UNAME_S),Linux)
        # Nothing needed :D
    endif
endif

# Rules
all: build

build-arduino: install
	mkdir -p build/arduino/src
	mkdir -p build/arduino/lib
	ln -sf `pwd`/microflo build/arduino/lib/
	unzip -q -n ./thirdparty/OneWire.zip -d build/arduino/lib/
	unzip -q -n ./thirdparty/DallasTemperature.zip -d build/arduino/lib/
	cd thirdparty/Adafruit_NeoPixel && git checkout-index -f -a --prefix=../../build/arduino/lib/Adafruit_NeoPixel/
	cd thirdparty/Adafruit_WS2801 && git checkout-index -f -a --prefix=../../build/arduino/lib/Adafruit_WS2801/
	cd build/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/DallasTemperature.patch
	cd build/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/OneWire.patch
	touch build/arduino/lib/patched
	node microflo.js generate $(GRAPH) build/arduino/src/firmware.cpp arduino
	cd build/arduino && ino build $(INOOPTIONS) --verbose --cppflags="$(CPPFLAGS) $(DEFINES)"
	$(AVRSIZE) -A build/arduino/.build/$(MODEL)/firmware.elf

build-avr: install
	mkdir -p build/avr
	node microflo.js generate $(GRAPH) build/avr/firmware.cpp avr
	cd build/avr && $(AVRGCC) -o firmware.elf firmware.cpp -I../../microflo -DF_CPU=$(AVR_FCPU) -DAVR=1 -Wall -Werror -Wno-error=overflow -mmcu=$(AVRMODEL) -fno-exceptions -fno-rtti $(CPPFLAGS)
	cd build/avr && $(AVROBJCOPY) -j .text -j .data -O ihex firmware.elf firmware.hex
	$(AVRSIZE) -A build/avr/firmware.elf

build-mbed: install
	cd thirdparty/mbed && python2 workspace_tools/build.py -t GCC_ARM -m LPC1768
	rm -rf build/mbed
	mkdir -p build/mbed
	node microflo.js generate $(MBED_GRAPH) build/mbed/main.cpp mbed
	cp Makefile.mbed build/mbed/Makefile
	cd build/mbed && make ROOT_DIR=./../../

build-stellaris:
	rm -rf build/stellaris
	mkdir -p build/stellaris
	node microflo.js generate $(STELLARIS_GRAPH) build/stellaris/main.cpp stellaris
	cp Makefile.stellaris build/stellaris/Makefile
	cp startup_gcc.c build/stellaris/
	cp stellaris.ld build/stellaris/
	cd build/stellaris && make ROOT=../../thirdparty/stellaris

build-linux: install
	rm -rf build/linux
	mkdir -p build/linux
	node microflo.js generate $(LINUX_GRAPH) build/linux/main.cpp linux
	cd build/linux && g++ -o firmware main.cpp -std=c++0x -I../../microflo -DLINUX -Wall -Werror -lrt

build: build-arduino build-avr

upload: build-arduino
	cd build/arduino && ino upload $(INOUPLOADOPTIONS) $(INOOPTIONS)

upload-dfu: build-avr
	cd build/avr && sudo $(DFUPROGRAMMER) $(AVRMODEL) erase
	sleep 1
	cd build/avr && sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex || sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex || sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex || sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex || sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex
	sudo $(DFUPROGRAMMER) $(AVRMODEL) start

upload-mbed: build-mbed
	cd build/mbed && sudo cp firmware.bin $(UPLOAD_DIR)

debug-stellaris:
	arm-none-eabi-gdb build/stellaris/gcc/main.axf --command=./stellaris.load.gdb

upload-stellaris: build-stellaris
	sudo lm4flash build/stellaris/gcc/main.bin

clean:
	git clean -dfx --exclude=node_modules

install:
	npm install

release-arduino:
	rm -rf build/microflo-arduino
	mkdir -p build/microflo-arduino/microflo/examples/Standalone
	cp -r microflo build/microflo-arduino/
	cp build/arduino/src/firmware.cpp build/microflo-arduino/microflo/examples/Standalone/Standalone.pde
	cd build/microflo-arduino && zip -q -r ../microflo-arduino.zip microflo

release-mbed: build-mbed
    # TODO: package into something usable with MBed tools

release-linux: build-linux
    # TODO: package?

release-stellaris: build-stellaris

release: install build release-mbed release-linux release-microflo release-arduino release-stellaris
	rm -rf build/microflo-$(VERSION)
	mkdir -p build/microflo-$(VERSION)
	cp -r build/microflo-arduino.zip build/microflo-$(VERSION)/
    # FIXME: copy in a README/HTML pointing to Flowhub app, and instructions to flash device
	cd build && zip -q --symlinks -r microflo-$(VERSION).zip microflo-$(VERSION)

check-release: release
	rm -rf build/check-release
	mkdir -p build/check-release
	cd build/check-release && unzip -q ../microflo-$(VERSION)
    # TODO: check npm and component.io packages
    # TODO: check arduino package by importing with ino, building

.PHONY: all build install clean release release-microflo release-arduino check-release

