# TODO: build+test all examples, for both target+host

GRAPH=examples/readbutton.fbp
MODEL=uno
REPORTER=spec

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
	cd build/arduino && ino build --board-model=$(MODEL)
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

.PHONY: all build definitions clean check test

