# User configuration options
GRAPH=examples/blink.fbp
MODEL=uno

AVRSIZE=avr-size
VERSION=$(shell git describe --tags)
OSX_ARDUINO_APP=/Applications/Arduino.app

# Not normally customized
CPPFLAGS=-ffunction-sections -fdata-sections -g -Os -w
DEFINES=-DHAVE_DALLAS_TEMPERATURE

# Platform specifics
ifeq ($(OS),Windows_NT)
	# TODO, test and fix
else
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Darwin)
        AVRSIZE=$(OSX_ARDUINO_APP)/Contents/Resources/Java/hardware/tools/avr/bin/avr-size
    endif
    ifeq ($(UNAME_S),Linux)
        # Nothing needed :D
    endif
endif

# Rules
all: build

build: install
	mkdir -p build/arduino/src
	mkdir -p build/arduino/lib
	ln -sf `pwd`/microflo build/arduino/lib/
	unzip -n ./thirdparty/OneWire.zip -d build/arduino/lib/
	unzip -n ./thirdparty/DallasTemperature.zip -d build/arduino/lib/
	cd build/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/DallasTemperature.patch
	cd build/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/OneWire.patch
	touch build/arduino/lib/patched
	node microflo.js generate $(GRAPH) build/arduino/src/firmware.cpp
	cd build/arduino && ino build --board-model=$(MODEL) --cppflags="$(CPPFLAGS) $(DEFINES)"
	$(AVRSIZE) -A build/arduino/.build/$(MODEL)/firmware.elf

upload: build
	cd build/arduino && ino upload --board-model=$(MODEL)

clean:
	git clean -dfx --exclude=node_modules

install:
	npm install

release-arduino:
	rm -rf build/microflo-arduino
	mkdir -p build/microflo-arduino/microflo/examples/Standalone
	cp -r microflo build/microflo-arduino/
	cp build/arduino/src/firmware.cpp build/microflo-arduino/microflo/examples/Standalone/Standalone.pde
	cd build/microflo-arduino && zip -r ../microflo-arduino.zip microflo

release-ui:
	rm -rf build/microflo-ui
	cd thirdparty/noflo-ui && git checkout-index -f -a --prefix=../../build/microflo-ui/
	cd build/microflo-ui && npm install && npm install grunt-cli
	cd build/microflo-ui && ./node_modules/.bin/grunt build
	rm -r build/microflo-ui/node_modules

release-microflo:
	rm -rf build/microflo
	git checkout-index -f -a --prefix=build/microflo/
	mkdir -p build/microflo/node_modules
	cd build/microflo && npm install ../../thirdparty/node-serialport && npm install
	cp -r thirdparty/node-serialport/build/Release/Darwin build/microflo/node_modules/serialport/build/Release
	cp -r thirdparty/node-serialport/build/Release/Windows_NT build/microflo/node_modules/serialport/build/Release

release: install build release-microflo release-arduino release-ui
	rm -rf build/microflo-$(VERSION)
	mkdir -p build/microflo-$(VERSION)
	cp -r build/microflo-arduino.zip build/microflo-$(VERSION)/
	cp -r build/microflo-ui build/microflo-$(VERSION)/
	cp -r build/microflo build/microflo-$(VERSION)/
	cd build && zip --symlinks -r microflo-$(VERSION).zip microflo-$(VERSION)

check-release: release
	rm -rf build/check-release
	mkdir -p build/check-release
	cd build/check-release && unzip ../microflo-$(VERSION)
	cd build/check-release/microflo-$(VERSION)/microflo && npm test

.PHONY: all build install clean release release-microflo release-arduino release-ui check-release

