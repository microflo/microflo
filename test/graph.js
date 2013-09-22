
var microflo = require("../microflo");

var network = new microflo.HostNetwork();
network.addNode()
network.connect()


/*
    TODO: implement the following tests

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

      // Command-stream format regression test
      Given an input graph definition
        and a reference command stream output
       When I load the graph
        and compare it to the reference output
       Then they are identical
  */
