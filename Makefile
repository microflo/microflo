# TODO: build+test all examples, for both target+host

GRAPH=examples/readbutton.fbp

all: build hostbuild

hostbuild: definitions
	node microflo.js generate examples/host.fbp build/host/example.cpp
	g++ -o build/host/example build/host/example.cpp $(CFLAGS) -I./microflo -DHOST_BUILD

build: definitions
	mkdir -p build/arduino/src
	mkdir -p build/arduino/lib
	ln -sf `pwd`/microflo build/arduino/lib/
	unzip -n ./thirdparty/OneWire.zip -d build/arduino/lib/
	unzip -n ./thirdparty/DallasTemperature.zip -d build/arduino/lib/
	node microflo.js generate $(GRAPH) build/arduino/src/serial.ino
	cd build/arduino && ino build

upload: build
	cd build/arduino && ino upload

definitions:
	node microflo.js update-defs

check:
	g++ -o test/host test/host.cpp -I./microflo -DHOST_BUILD
	./test/host

clean:
	git clean -dfx --exclude=node_modules

.PHONY: all build hostbuild definitions clean check

