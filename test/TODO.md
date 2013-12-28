
// Requires build flow programatically, able to subscribe to messages at an output
Given a graph consisting of only Forward elements
When I send data in to the first
and let the runtime run
Then I get exactly the same data out from the last

// fridge app example. Requires hostIO JS impl introspectable,
// requires ability to swap input component (ReadDallasTemperature) for a mock
Given a fridge flow
When the temperature goes below low threshold
Then it switches off

Given a fridge flow
When the temperature goes above high threshold
Then it switches on

// Parser/builder test
// Requires nicer API on JS command-generator
Given flow with unknown component
When trying to build
Then get a nice error msg

Given flow with components and unknown ports
When trying to build
Then get a nice error msg

// Component test
Given a graph with a Delimit component
When I send in a single IP
Then I get the IP
and then the delimiter

Given a graph with a Delimit component
When I send a bracketed IP
Then I get the packets for the entire bracketed IP
and then the delimiter

// Round-trip test
// Requires JS api for graph
Given a graph definition as .fbp
When building into a command stream
and load that as a graph
Then the representation of loaded .fbp is same as loaded command stream


// Examples test
// requires being able to mock I/O backend
monitorPin: When a pin goes high, it sets the two output pins high

Post-test check: all examples are tested


// Subgraph
Given a subgraph with inport connected to child component
When sending message to graph, it shows up on child component

Given a subgraph with outport connected to child component
When component emits message, it shows up on graph
