all: example host-example

host-example:
	node microflo.js generate examples/input.fbp build/host/example.cpp
	g++ -o build/host/example build/host/example.cpp $(CFLAGS) -I./microflo -DHOST_BUILD

example:
	mkdir -p build/arduino/src
	mkdir -p build/arduino/lib
	ln -sf `pwd`/microflo build/arduino/lib/
	node microflo.js generate examples/input.fbp build/arduino/src/echo.ino
	cd build/arduino && ino build

upload:
	cd build/arduino && ino upload

.PHONY: all example host-example

