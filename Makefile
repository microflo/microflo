# User configuration options
GRAPH=examples/blink.fbp
BOARD=arduino:avr:uno
AVRMODEL=at90usb1287
MBED_GRAPH=examples/blink-mbed.fbp
LINUX_GRAPH=examples/blink-rpi.fbp
STELLARIS_GRAPH=examples/blink-stellaris.fbp
UPLOAD_DIR=/mnt
BUILD_DIR=$(shell echo `pwd`/build)
MICROFLO_SOURCE_DIR=$(shell echo `pwd`/microflo)
MICROFLO=./microflo.js

# SERIALPORT=/dev/somecustom
# ARDUINO=/home/user/Arduino-1.0.5
# ENERGIA=/opt/energia/

AVRSIZE=avr-size
AVRGCC=avr-g++
AVROBJCOPY=avr-objcopy
DFUPROGRAMMER=dfu-programmer
VERSION=$(shell git describe --tags --always)
OSX_ARDUINO_APP=/Applications/Arduino.app
AVR_FCPU=1000000UL

# Not normally customized
CPPFLAGS=-ffunction-sections -fshort-enums -fdata-sections -Os -w
DEFINES=
ifeq ($(LIBRARY),arduino-standard)
DEFINES+=-DHAVE_DALLAS_TEMPERATURE -DHAVE_ADAFRUIT_NEOPIXEL -DHAVE_ADAFRUIT_WS2801
endif

ifdef NO_DEBUG
DEFINES+=-DMICROFLO_DISABLE_DEBUG
endif

ifdef NO_SUBGRAPHS
DEFINES+=-DMICROFLO_DISABLE_SUBGRAPHS
endif

ifdef LIBRARY
LIBRARYOPTION=--library=$(LIBRARY)
endif

ESP_OPTS = ESPRESSIF_DIR=/home/jon/temp/Espressif ESPTOOL=/usr/bin/esptool.py V=1 ESPTOOL_CK=/home/jon/temp/Espressif/esptool-ck/esptool SDK_EXTRA_INCLUDES=$(MICROFLO_SOURCE_DIR) LD_SCRIPT="-T ./eagle.app.v6.ld"

ifdef SERIALPORT
ESP_OPTS+=ESPPORT=$(SERIALPORT)
else
SERIALPORT=/dev/ttyACM0
endif

ifndef ARDUINO
ARDUINO:=$(shell echo `pwd`/arduino-1.8.1)
endif

ifndef ENERGIA
ENERGIA=/opt/energia/
endif

AVRDUDE_OPTIONS=-patmega328p -carduino -b115200 # uno
ARDUINO_RESET_CMD=echo Reset command not needed

ifeq ($(BOARD),arduino:avr:leonardo)
	AVRDUDE_OPTIONS=-patmega32u4 -cavr109 -b57600 # leonardo
	ARDUINO_RESET_CMD=python2 ./tools/leonardo-reset.py $(SERIALPORT); sleep 2;
endif

BUILDER_OPTIONS=-hardware $(ARDUINO)/hardware -tools $(ARDUINO)/tools-builder -tools $(ARDUINO)/hardware/tools -fqbn $(BOARD) -libraries ./ -build-path `pwd`/build/arduino/builder

COMMON_CFLAGS:=-I. -I${MICROFLO_SOURCE_DIR} -Wall -Wno-error=unused-variable

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

update-defs:
	$(MICROFLO) update-defs $(MICROFLO_SOURCE_DIR)

build-arduino:
	rm -rf $(BUILD_DIR)/arduino || echo 'WARN: failure to clean Arduino build'
	mkdir -p $(BUILD_DIR)/arduino/src
	mkdir -p $(BUILD_DIR)/arduino/lib
	mkdir -p $(BUILD_DIR)/arduino/builder
	cp -r $(MICROFLO_SOURCE_DIR) $(BUILD_DIR)/arduino/lib/
	unzip -q -n ./thirdparty/OneWire.zip -d $(BUILD_DIR)/arduino/lib/
	unzip -q -n ./thirdparty/DallasTemperature.zip -d $(BUILD_DIR)/arduino/lib/
	cd thirdparty/Adafruit_NeoPixel && git checkout-index -f -a --prefix=$(BUILD_DIR)/arduino/lib/Adafruit_NeoPixel/
	cd thirdparty/Adafruit_WS2801 && git checkout-index -f -a --prefix=$(BUILD_DIR)/arduino/lib/Adafruit_WS2801/
	cd thirdparty/NewPing && git checkout-index -f -a --prefix=$(BUILD_DIR)/arduino/lib/NewPing/
	cd $(BUILD_DIR)/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/DallasTemperature.patch
	cd $(BUILD_DIR)/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/OneWire.patch
	touch $(BUILD_DIR)/arduino/lib/patched
	$(MICROFLO) generate $(GRAPH) $(BUILD_DIR)/arduino/src/main.ino arduino
	arduino-builder -compile $(BUILDER_OPTIONS) $(BUILD_DIR)/arduino/src/main.ino

build-avr:
	mkdir -p $(BUILD_DIR)/avr
	node microflo.js generate $(GRAPH) $(BUILD_DIR)/avr/ --target avr
	cd $(BUILD_DIR)/avr && $(AVRGCC) -o firmware.elf main.cpp -DF_CPU=$(AVR_FCPU) -DAVR=1 $(COMMON_CFLAGS) -Werror -Wno-error=overflow -mmcu=$(AVRMODEL) -fno-exceptions -fno-rtti $(CPPFLAGS)
	cd $(BUILD_DIR)/avr && $(AVROBJCOPY) -j .text -j .data -O ihex firmware.elf firmware.hex
	$(AVRSIZE) -A $(BUILD_DIR)/avr/firmware.elf

build-mbed:
	cd thirdparty/mbed && python2 workspace_tools/build.py -t GCC_ARM -m LPC1768
	rm -rf $(BUILD_DIR)/mbed
	mkdir -p $(BUILD_DIR)/mbed
	node microflo.js generate $(MBED_GRAPH) $(BUILD_DIR)/mbed/ --target mbed --library microflo-core/components/arm-standard.json
	cp Makefile.mbed $(BUILD_DIR)/mbed/Makefile
	cd $(BUILD_DIR)/mbed && make ROOT_DIR=./../../

build-stellaris:
	rm -rf $(BUILD_DIR)/stellaris
	mkdir -p $(BUILD_DIR)/stellaris/gcc
	# driverlib
	cp -r $(ENERGIA)/hardware/lm4f/cores/lm4f/driverlib $(BUILD_DIR)/stellaris/
	cp Makefile.stellaris.driverlib $(BUILD_DIR)/stellaris/driverlib/
	cp makedefs.stellaris $(BUILD_DIR)/stellaris/driverlib/makedefs
	cd $(BUILD_DIR)/stellaris/driverlib && make -f Makefile.stellaris.driverlib IPATH=$(ENERGIA)/hardware/lm4f/cores/lm4f
	# app
	cp ./startup_gcc.c $(BUILD_DIR)/stellaris/
	cp $(ENERGIA)/hardware/lm4f/cores/lm4f/lm4fcpp_blizzard.ld $(BUILD_DIR)/stellaris/gcc/standalone.ld
	$(MICROFLO) generate $(STELLARIS_GRAPH) $(BUILD_DIR)/stellaris/ --target stellaris --library microflo-core/components/arm-standard.json
	cp Makefile.stellaris.app $(BUILD_DIR)/stellaris/Makefile
	cd $(BUILD_DIR)/stellaris && make ROOT=./ IPATH="$(ENERGIA)/hardware/lm4f/cores/lm4f $(ENERGIA)/hardware/lm4f/variants/stellarpad ../../microflo/"

# Build microFlo components as an object library, build/lib/componentlib.o
build-microflo-complib:
	mkdir -p $(BUILD_DIR)/lib
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/lib/ --target linux --library microflo-core/components/linux-standard.json
	cp -r $(BUILD_DIR)/lib/componentlib.hpp $(BUILD_DIR)/lib/componentlib.cpp
	g++ -c $(BUILD_DIR)/lib/componentlib.cpp -o $(BUILD_DIR)/lib/componentlib.o -I$(BUILD_DIR)/lib $(COMMON_CFLAGS) -std=c++0x -DLINUX

# Build microFlo runtime as an object library (to be static linked with app), $(BUILD_DIR)/lib/microflolib.o
build-microflo-objlib:
	rm -rf $(BUILD_DIR)/lib
	mkdir -p $(BUILD_DIR)/lib
	# FIXME: only for internal defs...
	# node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/lib --target linux --library microflo-core/components/linux-standard.json
	g++ -c microflo/microflo.cpp -o $(BUILD_DIR)/lib/microflolib.o -std=c++0x -I$(BUILD_DIR)/lib -DLINUX $(COMMON_CFLAGS)

# Build firmware statically linked to microflo runtime as object file, $(BUILD_DIR)/lib/microflolib.o
build-linux: build-microflo-objlib build-microflo-complib build-linux-embedding
	rm -rf $(BUILD_DIR)/linux
	mkdir -p $(BUILD_DIR)/linux
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/linux/ --target linux --library microflo-core/components/linux-standard.json
	g++ -o $(BUILD_DIR)/linux/firmware $(BUILD_DIR)/linux/main.cpp -std=c++0x $(BUILD_DIR)/lib/microflolib.o -DLINUX -I$(BUILD_DIR)/lib $(COMMON_CFLAGS) -lrt

# TODO: move to separate repo
build-linux-embedding:
	rm -rf $(BUILD_DIR)/linux
	mkdir -p $(BUILD_DIR)/linux
	node microflo.js generate examples/embedding.cpp $(BUILD_DIR)/linux/ --target linux --library microflo-core/components/linux-standard.json
	cd $(BUILD_DIR)/linux && g++ -o firmware ../../examples/embedding.cpp -std=c++0x $(COMMON_CFLAGS) -DLINUX -Werror -lrt

build-linux-mqtt:
	rm -rf $(BUILD_DIR)/linux-mqtt
	mkdir -p $(BUILD_DIR)/linux-mqtt
	node microflo.js generate examples/Repeat.fbp $(BUILD_DIR)/linux-mqtt/ --target linux-mqtt --library microflo-core/components/linux-standard.json
	cd $(BUILD_DIR)/linux-mqtt/ && g++ -o repeat main.cpp -std=c++0x -lmosquitto $(COMMON_CFLAGS) -DLINUX -Werror -lrt
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/linux-mqtt/ --target linux-mqtt --library microflo-core/components/linux-standard.json
	cd $(BUILD_DIR)/linux-mqtt/ && g++ -o firmware main.cpp -std=c++0x -lmosquitto $(COMMON_CFLAGS) -DLINUX -Werror -lrt

build-esp:
	rm -rf $(BUILD_DIR)/esp
	mkdir -p $(BUILD_DIR)/esp
	cp -r thirdparty/esp8266/esphttpd/include $(BUILD_DIR)/esp/
	cp -r thirdparty/esp8266/ESP8266-EVB-blinkLED/* $(BUILD_DIR)/esp/
	rm -rf $(BUILD_DIR)/esp/{firmware,build}
	mkdir -p $(BUILD_DIR)/esp/{firmware,build}
	rm $(BUILD_DIR)/esp/user/*.c || echo 'no C files'
	rm $(BUILD_DIR)/esp/user/*.o || echo 'no .o files'
	$(MICROFLO) generate $(GRAPH) $(BUILD_DIR)/esp/user/ --target esp8266 --library microflo-core/components/esp-minimal.json
	cd $(BUILD_DIR)/esp && make $(ESP_OPTS)

flash-esp: build-esp
	cd $(BUILD_DIR)/esp && make flash $(ESP_OPTS)

build: update-defs build-arduino build-avr

upload: build-arduino
	$(ARDUINO_RESET_CMD)
	avrdude -C$(ARDUINO)/hardware/tools/avr/etc/avrdude.conf -v -P$(SERIALPORT) $(AVRDUDE_OPTIONS) -D -Uflash:w:$(BUILD_DIR)/arduino/builder/main.ino.hex:i

upload-dfu: build-avr
	cd $(BUILD_DIR)/avr && sudo $(DFUPROGRAMMER) $(AVRMODEL) erase
	sleep 1
	cd $(BUILD_DIR)/avr && sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex || sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex || sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex || sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex || sudo $(DFUPROGRAMMER) $(AVRMODEL) flash firmware.hex
	sudo $(DFUPROGRAMMER) $(AVRMODEL) start

upload-mbed: build-mbed
	cd $(BUILD_DIR)/mbed && sudo cp firmware.bin $(UPLOAD_DIR)

debug-stellaris:
	arm-none-eabi-gdb $(BUILD_DIR)/stellaris/gcc/main.axf --command=./stellaris.load.gdb

upload-stellaris: build-stellaris
	sudo lm4flash $(BUILD_DIR)/stellaris/gcc/main.bin

clean:
	git clean -dfx --exclude=node_modules

release-arduino:
	rm -rf $(BUILD_DIR)/microflo-arduino
	mkdir -p $(BUILD_DIR)/microflo-arduino/microflo/examples/Standalone
	cp -r microflo $(BUILD_DIR)/microflo-arduino/
	cp -r build/arduino/src/componentlib* $(BUILD_DIR)/microflo-arduino/microflo/
	ls -ls $(BUILD_DIR)/arduino/src
	cp -r $(BUILD_DIR)/arduino/src/*.h $(BUILD_DIR)/microflo-arduino/microflo
	cp $(BUILD_DIR)/arduino/src/main.ino $(BUILD_DIR)/microflo-arduino/microflo/examples/Standalone/Standalone.ino
	cd $(BUILD_DIR)/microflo-arduino && zip -q -r ../microflo-arduino.zip microflo

check-arduino-release:
	rm -rf $(BUILD_DIR)/microflo-arduino-check
	mkdir -p $(BUILD_DIR)/microflo-arduino-check/{src,lib}
	cd $(BUILD_DIR)/microflo-arduino-check/lib && unzip ../../microflo-arduino.zip
	cd $(BUILD_DIR)/microflo-arduino-check && cp lib/microflo/examples/Standalone/Standalone.ino src/Standalone.cpp
	cd $(BUILD_DIR)/microflo-arduino-check && ino build

# FIXME: run on Travis CI
release-esp: build-esp

release-mbed: build-mbed
    # TODO: package into something usable with MBed tools

release-linux: build-linux build-linux-embedding build-linux-mqtt
    # TODO: package?

release-stellaris: build-stellaris
    # TODO: package?

release: build release-linux release-mbed release-arduino release-stellaris
	rm -rf $(BUILD_DIR)/microflo-$(VERSION)
	mkdir -p $(BUILD_DIR)/microflo-$(VERSION)
	cp -r $(BUILD_DIR)/microflo-arduino.zip $(BUILD_DIR)/microflo-$(VERSION)/
	cp README.release.txt $(BUILD_DIR)/microflo-$(VERSION)/README.txt
    # FIXME: copy in a README/HTML pointing to Flowhub app, and instructions to flash device
	cd build && zip -q --symlinks -r microflo-$(VERSION).zip microflo-$(VERSION)

check-release: release
	rm -rf $(BUILD_DIR)/check-release
	mkdir -p $(BUILD_DIR)/check-release
	cd $(BUILD_DIR)/check-release && unzip -q ../microflo-$(VERSION)
    # TODO: check npm and component.io packages
    # TODO: check arduino package by importing with ino, building

check: build-linux-mqtt
	npm test

.PHONY: all build update-defs clean release release-linux release-arduino check-release

