example: .FORCE
	node microflo.js generate examples/input.fbp build/example.cpp
	g++ -o build/example build/example.cpp $(CFLAGS) -I./microflo -DHOST_BUILD

all: example
.FORCE:
