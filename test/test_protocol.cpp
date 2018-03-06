
#include "microflo/protocol.hpp"

// TODO: pass and verify expected items/types
int
test_parse_message(const uint8_t *input, size_t length) {
    PackItem items[10];
    uint8_t buffer[64];
    PackParser parser(items, 10, buffer, 64);

    PackParser::State state;
    for (int i=0; i<length; i++) {
         state = parser.push(&input[i], 1);
    }
    state == PackParser::MessageEnded;

} 

int test_parse_simple_message() {

    const uint8_t msg[] = {};

    test_parse_message(msg, sizeof(msg));
}

int main(int argc, char *argv[]) {

    test_parse_simple_message();

    // TODO: feed through input messages and reply
    // read input
    // decode
    // write responses to output
}
