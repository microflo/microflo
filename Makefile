# User configuration options
GRAPH=examples/blink.fbp
MODEL=uno
AVRMODEL=at90usb1287
MBED_GRAPH=examples/blink-mbed.fbp
LINUX_GRAPH=examples/blink-rpi.fbp
STELLARIS_GRAPH=examples/blink-stellaris.fbp
UPLOAD_DIR=/mnt
BUILD_DIR=`pwd`/build
MICROFLO_SOURCE_DIR=$(shell echo `pwd`/microflo)
MICROFLO=./microflo.js

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
CPPFLAGS=-ffunction-sections -fshort-enums -fdata-sections -g -Os -w
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
LIBRARYOPTION=--library=microflo/core/components/$(LIBRARY).json
endif

INOOPTIONS=--board-model=$(MODEL)

ifdef SERIALPORT
INOUPLOADOPTIONS=--serial-port=$(SERIALPORT)
endif

ifdef ARDUINO
INOOPTIONS+=--arduino-dist=$(ARDUINO)
endif

EMSCRIPTEN_EXPORTS='["_emscripten_runtime_new", "_emscripten_runtime_free", "_emscripten_runtime_run", "_emscripten_runtime_send", "_emscripten_runtime_setup"]'

COMMON_CFLAGS:=-I. -I../../microflo -Wall

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

build-arduino-min:
	rm -rf $(BUILD_DIR)/arduino || echo 'WARN: failure to clean Arduino build'
	mkdir -p $(BUILD_DIR)/arduino/src
	mkdir -p $(BUILD_DIR)/arduino/lib
	cp -r $(MICROFLO_SOURCE_DIR) $(BUILD_DIR)/arduino/lib/
	$(MICROFLO) generate $(GRAPH) $(BUILD_DIR)/arduino/src/ arduino
	cd $(BUILD_DIR)/arduino && ino build $(INOOPTIONS) --verbose --cppflags="$(CPPFLAGS) $(DEFINES) -I./src"
	$(AVRSIZE) -A $(BUILD_DIR)/arduino/.build/$(MODEL)/firmware.elf

build-arduino:
	rm -rf $(BUILD_DIR)/arduino || echo 'WARN: failure to clean Arduino build'
	mkdir -p $(BUILD_DIR)/arduino/src
	mkdir -p $(BUILD_DIR)/arduino/lib
	cp -r $(MICROFLO_SOURCE_DIR) $(BUILD_DIR)/arduino/lib/
	unzip -q -n ./thirdparty/OneWire.zip -d $(BUILD_DIR)/arduino/lib/
	unzip -q -n ./thirdparty/DallasTemperature.zip -d $(BUILD_DIR)/arduino/lib/
	cd thirdparty/Adafruit_NeoPixel && git checkout-index -f -a --prefix=../../$(BUILD_DIR)/arduino/lib/Adafruit_NeoPixel/
	cd thirdparty/Adafruit_WS2801 && git checkout-index -f -a --prefix=../../$(BUILD_DIR)/arduino/lib/Adafruit_WS2801/
	cd $(BUILD_DIR)/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/DallasTemperature.patch
	cd $(BUILD_DIR)/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/OneWire.patch
	touch $(BUILD_DIR)/arduino/lib/patched
	$(MICROFLO) generate $(GRAPH) $(BUILD_DIR)/arduino/src/ arduino
	cd $(BUILD_DIR)/arduino && ino build $(INOOPTIONS) --verbose --cppflags="$(CPPFLAGS) $(DEFINES) -I./src"
	$(AVRSIZE) -A $(BUILD_DIR)/arduino/.build/$(MODEL)/firmware.elf

build-avr:
	mkdir -p $(BUILD_DIR)/avr
	node microflo.js generate $(GRAPH) $(BUILD_DIR)/avr/ avr
	cd $(BUILD_DIR)/avr && $(AVRGCC) -o firmware.elf main.cpp -DF_CPU=$(AVR_FCPU) -DAVR=1 $(COMMON_CFLAGS) -Werror -Wno-error=overflow -mmcu=$(AVRMODEL) -fno-exceptions -fno-rtti $(CPPFLAGS)
	cd $(BUILD_DIR)/avr && $(AVROBJCOPY) -j .text -j .data -O ihex firmware.elf firmware.hex
	$(AVRSIZE) -A $(BUILD_DIR)/avr/firmware.elf

build-mbed:
	cd thirdparty/mbed && python2 workspace_tools/build.py -t GCC_ARM -m LPC1768
	rm -rf $(BUILD_DIR)/mbed
	mkdir -p $(BUILD_DIR)/mbed
	node microflo.js generate $(MBED_GRAPH) $(BUILD_DIR)/mbed/ mbed
	cp Makefile.mbed $(BUILD_DIR)/mbed/Makefile
	cd $(BUILD_DIR)/mbed && make ROOT_DIR=./../../

build-stellaris:
	rm -rf $(BUILD_DIR)/stellaris
	mkdir -p $(BUILD_DIR)/stellaris
	$(MICROFLO) generate $(STELLARIS_GRAPH) $(BUILD_DIR)/stellaris/ stellaris
	cp $(MICROFLO_SOURCE_DIR)/../Makefile.stellaris $(BUILD_DIR)/stellaris/Makefile
	cp $(MICROFLO_SOURCE_DIR)/../startup_gcc.c $(BUILD_DIR)/stellaris/
	cp $(MICROFLO_SOURCE_DIR)/../stellaris.ld $(BUILD_DIR)/stellaris/
	cd $(BUILD_DIR)/stellaris && make ROOT=../../thirdparty/stellaris MICROFLO_SOURCE_DIR=$(MICROFLO_SOURCE_DIR)

# Build microFlo components as an object library, build/lib/componentlib.o
# (the microflo/componentlib.cpp pulls in all available components, as defined from components.json)
build-microflo-complib:
	mkdir -p $(BUILD_DIR)/lib
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/lib linux # only for internal defs...
	node microflo.js componentlib $(shell pwd)/microflo/components.json $(shell pwd)/microflo createComponent
	g++ -c microflo/componentlib.cpp -o $(BUILD_DIR)/lib/componentlib.o -I$(BUILD_DIR)/lib -std=c++0x -DLINUX -Wall -Werror

# Build microFlo runtime as a dynamic loadable library, build/lib/libmicroflo.so
build-microflo-sharedlib: 
	rm -rf $(BUILD_DIR)/lib
	mkdir -p $(BUILD_DIR)/lib
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/lib linux # only for internal defs...
	g++ -fPIC -c microflo/microflo.cpp -o microflo/microflo.o -std=c++0x -DLINUX -Wall -Werror
	g++ -shared -Wl,-soname,libmicroflo.so -o $(BUILD_DIR)/lib/libmicroflo.so -I$(BUILD_DIR)/lib microflo/microflo.o

# Build microFlo runtime as an object library (to be static linked with app), $(BUILD_DIR)/lib/microflolib.o
build-microflo-objlib: 
	rm -rf $(BUILD_DIR)/lib
	mkdir -p $(BUILD_DIR)/lib
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/lib linux # only for internal defs...
	g++ -c microflo/microflo.cpp -o $(BUILD_DIR)/lib/microflolib.o -std=c++0x -I$(BUILD_DIR)/lib -DLINUX -Wall -Werror

# Build firmware linked to microflo runtime as dynamic loadable library, $(BUILD_DIR)/lib/libmicroflo.so
build-linux-sharedlib: build-microflo-sharedlib
	rm -rf $(BUILD_DIR)/linux
	mkdir -p $(BUILD_DIR)/linux
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/linux linux
	g++ -o $(BUILD_DIR)/linux/firmware $(BUILD_DIR)/linux/main.cpp -std=c++0x -Wl,-rpath=$(BUILD_DIR)/lib -DLINUX -I./$(BUILD_DIR)/lib -I./microflo -Wall -Werror -lrt -L./$(BUILD_DIR)/lib -lmicroflo

# Build firmware statically linked to microflo runtime as object file, $(BUILD_DIR)/lib/microflolib.o
build-linux: build-microflo-objlib build-microflo-complib
	rm -rf $(BUILD_DIR)/linux
	mkdir -p $(BUILD_DIR)/linux
	node microflo.js generate $(LINUX_GRAPH) $(BUILD_DIR)/linux linux
	g++ -o $(BUILD_DIR)/linux/firmware $(BUILD_DIR)/linux/main.cpp -std=c++0x $(BUILD_DIR)/lib/microflolib.o $(BUILD_DIR)/lib/componentlib.o -DLINUX -I$(BUILD_DIR)/lib -I./microflo -Wall -Werror -lrt

# TODO: move to separate repo
build-linux-embedding:
	rm -rf $(BUILD_DIR)/linux
	mkdir -p $(BUILD_DIR)/linux
	node microflo.js generate examples/embedding.cpp $(BUILD_DIR)/linux/ linux
	cd $(BUILD_DIR)/linux && g++ -o firmware ../../examples/embedding.cpp -std=c++0x $(COMMON_CFLAGS) -DLINUX -Werror -lrt

build-emscripten:
	rm -rf $(BUILD_DIR)/emscripten
	mkdir -p $(BUILD_DIR)/emscripten
	node microflo.js generate $(GRAPH) $(BUILD_DIR)/emscripten emscripten
	cd $(BUILD_DIR)/emscripten && EMCC_FAST_COMPILER=0 emcc -o microflo-runtime.html main.cpp $(COMMON_CFLAGS) -s NO_DYNAMIC_EXECUTION=1 -s EXPORTED_FUNCTIONS=$(EMSCRIPTEN_EXPORTS)

build: build-arduino build-avr

upload: build-arduino
	cd $(BUILD_DIR)/arduino && ino upload $(INOUPLOADOPTIONS) $(INOOPTIONS)

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
	ls -ls $(BUILD_DIR)/arduino/src
	cp -r $(BUILD_DIR)/arduino/src/* $(BUILD_DIR)/microflo-arduino/microflo/
	cp $(BUILD_DIR)/arduino/src/main.cpp $(BUILD_DIR)/microflo-arduino/microflo/examples/Standalone/Standalone.pde
	cd $(BUILD_DIR)/microflo-arduino && zip -q -r ../microflo-arduino.zip microflo

release-mbed: build-mbed
    # TODO: package into something usable with MBed tools

release-linux: build-linux
    # TODO: package?

release-stellaris: build-stellaris
    # TODO: package?

release-emscripten: build-emscripten
    # TODO: package?

release: build release-mbed release-linux release-microflo release-arduino release-stellaris release-emscripten
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

check: build-emscripten
	npm test

.PHONY: all build update-defs clean release release-microflo release-arduino check-release

