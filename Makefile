# TODO: build+test all examples, for both target+host

GRAPH=examples/readbutton.fbp
MODEL=uno

all: build hostbuild

hostbuild: definitions
	node microflo.js generate examples/host.fbp build/host/example.cpp
	$(CXX) -o build/host/example build/host/example.cpp $(CFLAGS) -I./microflo -DHOST_BUILD

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
	cat build/arduino/src/firmware.{ino,cpp}
	cd build/arduino && ino build --board-model=$(MODEL)
	avr-size -A build/arduino/.build/$(MODEL)/firmware.elf

upload: build
	cd build/arduino && ino upload --board-model=$(MODEL)

definitions:
	node microflo.js update-defs

check:
	$(CXX) -o test/host test/host.cpp -I./microflo -DHOST_BUILD
	./test/host

clean:
	git clean -dfx --exclude=node_modules

.PHONY: all build hostbuild definitions clean check

