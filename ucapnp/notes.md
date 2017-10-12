
# Requirements

Can be used over a serialport.
Support devices as weak as a Arduino Uno (AVR Atmega328).
8bit microcontroller with 2KB SRAM and 32KB program memory.

Must be able to handle 100 message exchanges/second over 9600 baud serial.

Can be used over IP-based transports, primarily MQTT.

Syncronization
Number of clients.
Assumes a single writer at time.
At least for changing the FBP graph??
Conflicts should be detected and the additional write denied.
Multiple clients shall be able follow graph changes.

Prior knowledge by clients.
Must know the message format schemas.
Client shall be able to ask for:
* what components (names, ids) are available
* the component definitions (port names/ids)
* component metadata (component description, port types, description)
* what the current nodes are (ids)
* what the current connections are (nodeid,portid,)
The runtime may respond with not available for any of these.

Authentication. None, to be handled by the transport?

FBP protocol relationship
Should match as closely as possible to
https://flowbased.github.io/fbp-protocol/
in terms of concepts, naming conventions, etc

# Implementation
On the microcontroller side, it seems that the offical C++ library will be too heavy.
https://github.com/jmckaskill/c-capnproto may be suitable. However the latest

For the JavaScript side,
https://github.com/capnp-js/serialization seems reasonably comprehensive,
but it seems to have a critical bug not fixed in over 1 year,
https://github.com/capnp-js/serialization/issues/17

A possible alternative is to compile the microcontroller-side code to
Need then to take special care that the on-wire is infact compatible with standard CapNProto.
since using the host side won't ensure this by nature of being a standard implementation.
Can use encode/decode command of the `capnp` tool for this. https://capnproto.org/capnp-tool.html
The Python bindings to the C++ library may also be useful to test compliance.
