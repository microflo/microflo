
#include <stddef.h>
#include <stdint.h>

enum PackType {
    PackTypeInvalid = 0,
    PackTypeInt32,
    PackTypeString,
};

enum PackStatus {
    PackStatusInvalid = 0,
};

struct PackItem {
    enum PackStatus status;
    enum PackType type;
    uint8_t *data; // start of data
    size_t *length;
};

PackStatus pack_decode_int32(const PackItem &item, int32_t *out) {

}

PackStatus pack_decode_string(const PackItem &item, char **out, size_t max_size) {

}


class PackParser {

public:
    enum State {
        ExpectMessageStart = 0,
        MessageStarted,
        MessageEnded,
    };
public:
    PackParser(PackItem *_items, int8_t _items_size, uint8_t *_buffer, size_t _buffer_size)
        : state(ExpectMessageStart)
        , items(_items)
        , items_length(_items_size)
        , valid_items(0)
        , buffer(_buffer)
        , buffer_length(_buffer_size)
        , buffer_write_pos(0)
        , buffer_read_pos(0)
    {
    }

    State push(const uint8_t *data, size_t length);
    State reset();

private:      
    State state;

    uint8_t *buffer;
    size_t buffer_length;
    int8_t buffer_write_pos;
    int8_t buffer_read_pos;

    PackItem *items;
    int8_t items_length;
    int8_t valid_items;
};

PackParser::State
PackParser::reset() {

    buffer_read_pos = 0;
    buffer_write_pos = 0;
    valid_items = 0;
    state = ExpectMessageStart;

    return state;
}

PackParser::State
PackParser::push(const uint8_t *data, size_t length) {
    // put the new data into our buffer
    // parse forward

    return state;
}

#ifdef _NOT_IMPLEMENTED_YET

// TODO: should be generated from protocol description
enum MessageType {

}

struct MessageReply {
    int32_t error;
    int32_t request;
}

#define MSG_ASSERT(expr, error) \
do { \
    if (!(expr)) { \
        return MessageReply(MsgError, error) \
    } \
} while (0)

#define MSG_ASSERT_DECODED(item, req) \
do { \
    if (item.status != PACK_OK) { \
        return MessageReply(MsgError, DecodeError) \
    } \
} while (0)

class Protocol {
private:
    const size_t NAME_SIZE = 20;
    const size_t BUFFER_SIZE = 128;

    uint8_t buffer[BUFFER_SIZE];

    const int8_t ITEMS_SIZE = 10;
    PackItems items[ITEMS_SIZE];

    Parser parser;
public:
    Protocol()
        : packer((items, ITEMS_SIZE, buffer, BUFFER_SIZE)
    
    void parse_data(uint8_t data*, size_t datalength);
    
};


void
Protocol::send_data(uint8_t *data, size_t datalength) {

}

void
Protocol::parse_data(uint8_t data*, size_t datalength) {
    PackStatus item = packer.push(data, datalength);

    if (item == MessageEnd) {
        MsgReply response = handle_message(items, ITEMS_SIZE);

        if (response.error) {
            // TODO: clear rest
            items[0] = MessageType::ErrorReply;
            items[1] = request;
            items[2] = response.error;
        } else {
            // ACK, sending
        }
        
        const size_t SEND_MAX = 128;
        char reply[SEND_MAX];
        const size_t actual = packer.serialize(&reply, SEND_MAX);

        send_data(reply, actual);
    }
}

MsgReply
Protocol::handle_message(PackItems *items) {
        // Common message things
        int32_t msg = -1;
        int32_t request = -1;

        MSG_ASSERT_DECODED(pack_decode_int32(items[0], &msg));
        MSG_ASSERT_DECODED(pack_decode_int32(items[1], &request));

        // Dispatch the concrete message handler
        const MessageType message_type = msg;
        MessageReply response(UnknownMessage);

        switch (message_type) {
            case MessageType::addNode:
                response = add_node(items); break;
            case
            ....
        }

        response.request = request;

        return response;
}

static inline MessageReply
Protocol::add_node(PackItems *items) {
    char *nodeName = null;
    char *componentName = null;
    char *graphName = null;

    MSG_ASSERT_DECODED(pack_decode_str(items[2], &nodeName, NAME_SIZE));
    MSG_ASSERT_DECODED(pack_decode_str(items[3], &graphName, NAME_SIZE));
    MSG_ASSERT_DECODED(pack_decode_str(items[4], &componentName, NAME_SIZE));

    MSG_ASSERT(graphName == currentGraph, UnknownGraph);
    MSG_ASSERT(!nodeMap.has(nodeName), DuplicateNode);
    MSG_ASSERT(componentMap.has(componentName), UnknownComponent);

    // yay, ready to do the thing
    const auto error = false;
    // network.addNode(nodeMap.get(nodeName), componentLib.get(componentName));
    MSG_ASSERT(!error, AddNodeFailed);
    return MSG_ACK();
}


#endif
