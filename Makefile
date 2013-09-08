all: example host-example

host-example: definitions
	node microflo.js generate examples/host.fbp build/host/example.cpp
	g++ -o build/host/example build/host/example.cpp $(CFLAGS) -I./microflo -DHOST_BUILD

example: definitions
	mkdir -p build/arduino/src
	mkdir -p build/arduino/lib
	ln -sf `pwd`/microflo build/arduino/lib/
	node microflo.js generate examples/echo.fbp build/arduino/src/serial.ino
	cd build/arduino && ino build

upload: example
	cd build/arduino && ino upload

definitions:
	node microflo.js update-defs

clean:
	git clean -dfx --exclude=node_modules

.PHONY: all example host-example definitions clean

