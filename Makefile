# TODO: build+test all examples, for both target+host

GRAPH=examples/blink.fbp
MODEL=uno
REPORTER=spec
VERSION=$(shell git describe --tags)
CPPFLAGS=-ffunction-sections -fdata-sections -g -Os -w
DEFINES=-DHAVE_DALLAS_TEMPERATURE

all: build

build: definitions
	mkdir -p build/arduino/src
	mkdir -p build/arduino/lib
	ln -sf `pwd`/microflo build/arduino/lib/
	unzip -n ./thirdparty/OneWire.zip -d build/arduino/lib/
	unzip -n ./thirdparty/DallasTemperature.zip -d build/arduino/lib/
	cd build/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/DallasTemperature.patch
	cd build/arduino/lib && test -e patched || patch -p0 < ../../../thirdparty/OneWire.patch
	touch build/arduino/lib/patched
	node microflo.js generate $(GRAPH) build/arduino/src/firmware.ino
	cd build/arduino && ino build --board-model=$(MODEL) --cppflags="$(CPPFLAGS) $(DEFINES)"
	avr-size -A build/arduino/.build/$(MODEL)/firmware.elf

upload: build
	cd build/arduino && ino upload --board-model=$(MODEL)

definitions:
	node microflo.js update-defs

check:
	./node_modules/.bin/mocha --reporter $(REPORTER)

test: check

clean:
	git clean -dfx --exclude=node_modules

release: build
	rm -rf build/microflo-arduino-$(VERSION)
	mkdir -p build/microflo-arduino-$(VERSION)/microflo/examples/Standalone
	cp -r microflo/ build/microflo-arduino-$(VERSION)/
	cp build/arduino/src/firmware.cpp build/microflo-arduino-$(VERSION)/microflo/examples/Standalone/Standalone.pde
	cd build/microflo-arduino-$(VERSION) && zip -r microflo-arduino-$(VERSION).zip microflo

.PHONY: all build definitions clean check test release

