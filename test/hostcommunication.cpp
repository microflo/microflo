#include <cstring>
#include <stdio.h>
#include "../microflo/io.hpp"

void
printb(const uint8_t *buf, uint8_t length) {
    printf("[ ");
    for (int i=0; i<length; i++) {
        printf("%d ", buf[i]);
    }
    printf("]");
}

class FakeTransport : public HostTransport {
public:

    // implements HostTransport
    virtual void setup(IO *i, HostCommunication *c) { controller = c; }
    virtual void runTick() {}
    virtual void sendCommand(const uint8_t *buf, uint8_t len) {
        memset(response, 0, MICROFLO_CMD_SIZE);
        if (len > MICROFLO_CMD_SIZE) {
            fprintf(stderr, "ERROR\n");
            return; 
        }
        memcpy(response, buf, len);
    }

public:
    void request(const uint8_t *buf, uint8_t len) {
        for (int i=0; i<len; i++) {
            controller->parseByte(buf[i]);
        }
    }
   
public:
    uint8_t response[MICROFLO_CMD_SIZE];

private:
    HostCommunication *controller;
};



bool checkResponse(const uint8_t *actual, const uint8_t *expected) {

    const bool same = memcmp(actual, expected, MICROFLO_CMD_SIZE) == 0;
    if (!same) {
        printb(actual, MICROFLO_CMD_SIZE);
        printf(" != ");
        printb(expected, MICROFLO_CMD_SIZE);
        printf("\n");
    }

    return same;
}

int
test_host_communication() {

    FixedMessageQueue queue;
    NullIO io;
    FakeTransport transport;
    Network network(&io, &queue);
    HostCommunication controller;
    transport.setup(&io, &controller);
    controller.setup(&network, &transport);


    FakeTransport &d = transport;

    const uint8_t pingRequest[] =   { 3, GraphCmdPing, 3, 4, 5, 6, 7, 8, 9, 10 };
    const uint8_t pingResponse[] =  { 3, GraphCmdPong, 3, 4, 5, 6, 7, 8, 9, 10 };

    const uint8_t random[] = { 12, 10, 88, 77, 66, 55, 44, 33, 22, 11 };

    uint8_t openComm[MICROFLO_CMD_SIZE];
    memcpy(openComm, MICROFLO_GRAPH_MAGIC, sizeof(MICROFLO_GRAPH_MAGIC));
    openComm[MICROFLO_CMD_SIZE-1] = 2; // requestID

    // Data sent before magic should be ignored
    memcpy(d.response, random, MICROFLO_CMD_SIZE);
    MICROFLO_RETURN_VAL_IF_FAIL(checkResponse(d.response, random), -1);

    d.request(pingRequest, MICROFLO_CMD_SIZE);
    MICROFLO_RETURN_VAL_IF_FAIL(checkResponse(d.response, random), -2);

    // Sending magic should open communication
    d.request(openComm, MICROFLO_CMD_SIZE);
    const uint8_t openCommResponse[] = { 2, GraphCmdCommunicationOpen, 0, 0, 0, 0, 0, 0, 0, 0 };
    MICROFLO_RETURN_VAL_IF_FAIL(checkResponse(d.response, openCommResponse), -3);

    // Valid ping request should get a response
    d.request(pingRequest, sizeof(pingRequest));
    MICROFLO_RETURN_VAL_IF_FAIL(checkResponse(d.response, pingResponse), -4);

    // Invalid send message should give error
    const uint8_t invalidSendPacket[MICROFLO_CMD_SIZE] = { 3, GraphCmdSubscribeToPort, 10, 0, 0, 0, 0, 0, 0, 0 };
    const uint8_t invalidSendResponse[MICROFLO_CMD_SIZE] = { 3, GraphCmdError, DebugSubscribePortInvalidNode, 0, 0, 0, 0, 0, 0, 0 };
    d.request(invalidSendPacket, MICROFLO_CMD_SIZE);
    MICROFLO_RETURN_VAL_IF_FAIL(checkResponse(d.response, invalidSendResponse), -5);


    return 0;
}
