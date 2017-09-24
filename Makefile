# User configuration options
GRAPH=examples/blink.fbp
BOARD=arduino:avr:uno
AVRMODEL=at90usb1287
MBED_GRAPH=examples/blink-mbed.fbp
LINUX_GRAPH=examples/blink-rpi.fbp
UPLOAD_DIR=/mnt
BUILD_DIR=$(shell echo `pwd`/build)
MICROFLO_SOURCE_DIR=$(shell echo `pwd`/microflo)
MICROFLO=./microflo.js
LIBRARY=./test/components/components.json

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

ifdef SERIALPORT
else
SERIALPORT=/dev/ttyACM0
endif

ifndef ARDUINO
ARDUINO:=$(shell echo `pwd`/arduino-1.8.1)
endif

AVRDUDE_OPTIONS=-patmega328p -carduino -b115200 # uno
ARDUINO_RESET_CMD=echo Reset command not needed

ifeq ($(BOARD),arduino:avr:leonardo)
	AVRDUDE_OPTIONS=-patmega32u4 -cavr109 -b57600 # leonardo
	ARDUINO_RESET_CMD=python2 ./tools/leonardo-reset.py $(SERIALPORT); sleep 2;
endif

BUILDER_OPTIONS=-hardware $(ARDUINO)/hardware -tools $(ARDUINO)/tools-builder -tools $(ARDUINO)/hardware/tools -fqbn $(BOARD) -libraries ./ -build-path `pwd`/build/arduino/builder

COMMON_CFLAGS:=-I. -I${MICROFLO_SOURCE_DIR} -Wall -Wno-error=unused-variable

# Rules
all: build

update-defs:
	$(MICROFLO) update-defs $(MICROFLO_SOURCE_DIR)

build-arduino:
	rm -rf $(BUILD_DIR)/arduino || echo 'WARN: failure to clean Arduino build'
	mkdir -p $(BUILD_DIR)/arduino/builder
	$(MICROFLO) generate $(GRAPH) $(BUILD_DIR)/arduino/main.ino arduino --library $(LIBRARY)
	arduino-builder -compile $(BUILDER_OPTIONS) $(BUILD_DIR)/arduino/main.ino

build-avr:
	node microflo.js generate $(GRAPH) $(BUILD_DIR)/avr/ --target avr --library $(LIBRARY)
	cd $(BUILD_DIR)/avr && $(AVRGCC) -o firmware.elf main.cpp -DF_CPU=$(AVR_FCPU) -DAVR=1 $(COMMON_CFLAGS) -Werror -Wno-error=overflow -mmcu=$(AVRMODEL) -fno-exceptions -fno-rtti $(CPPFLAGS)
	cd $(BUILD_DIR)/avr && $(AVROBJCOPY) -j .text -j .data -O ihex firmware.elf firmware.hex
	$(AVRSIZE) -A $(BUILD_DIR)/avr/firmware.elf

build-mbed:
	cd thirdparty/mbed && python2 workspace_tools/build.py -t GCC_ARM -m LPC1768
	rm -rf $(BUILD_DIR)/mbed
	node microflo.js generate $(MBED_GRAPH) $(BUILD_DIR)/mbed/ --target mbed --library $(LIBRARY)
	cp Makefile.mbed $(BUILD_DIR)/mbed/Makefile
	cd $(BUILD_DIR)/mbed && make ROOT_DIR=./../../

# Build firmware statically linked to microflo runtime as object file, $(BUILD_DIR)/lib/microflolib.o
build-linux: build-linux-embedding
	rm -rf $(BUILD_DIR)/linux
	mkdir -p $(BUILD_DIR)/linux
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/linux/ --target linux --library $(LIBRARY)
	g++ -o $(BUILD_DIR)/linux/firmware $(BUILD_DIR)/linux/main.cpp -std=c++0x -DLINUX -I$(BUILD_DIR)/lib $(COMMON_CFLAGS) -lrt -lutil

# TODO: move to separate repo
build-linux-embedding:
	rm -rf $(BUILD_DIR)/linux
	mkdir -p $(BUILD_DIR)/linux
	node microflo.js generate examples/embedding.cpp $(BUILD_DIR)/linux/ --target linux --library $(LIBRARY)
	cd $(BUILD_DIR)/linux && g++ -o firmware ../../examples/embedding.cpp -std=c++0x $(COMMON_CFLAGS) -DLINUX -Werror -lrt -lutil

build-linux-mqtt:
	rm -rf $(BUILD_DIR)/linux-mqtt
	node microflo.js generate examples/Repeat.fbp $(BUILD_DIR)/linux-mqtt/ --enable-maps --target linux-mqtt --library $(LIBRARY)
	cd $(BUILD_DIR)/linux-mqtt/ && g++ -o repeat main.cpp -std=c++0x -lmosquitto $(COMMON_CFLAGS) -DLINUX -Werror -lrt -lutil
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/linux-mqtt/ --enable-maps --target linux-mqtt --library $(LIBRARY)
	cd $(BUILD_DIR)/linux-mqtt/ && g++ -o firmware main.cpp -std=c++0x -lmosquitto $(COMMON_CFLAGS) -DLINUX -Werror -lrt -lutil

build-tests:
	rm -rf $(BUILD_DIR)/tests
	mkdir -p $(BUILD_DIR)/tests
	g++ -o $(BUILD_DIR)/tests/run test/runtime.cpp -I./microflo

build: update-defs build-tests

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

clean:
	git clean -dfx --exclude=node_modules

check-release: check build-linux-embedding build-linux-mqtt build-arduino build-avr build-mbed

runtime-tests: build-tests
	$(BUILD_DIR)/tests/run

check: runtime-tests build-linux build-linux-mqtt
	npm test

.PHONY: all build update-defs clean check-release

