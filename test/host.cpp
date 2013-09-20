#define MICROFLO_NO_MAIN
#include "microflo.hpp"
#include <vector>

class PacketComparer : public Component
{
public:
    virtual void process(Packet in, int port) {
        if (port == 0) {
            mRecieved.push_back(in);
        }
    }

    void reset() {
        mRecieved = std::vector<Packet>();
    }
    void setExpected(std::vector<Packet> &messages) {
        reset();
        mExpected = messages;
    }
    bool expectingMore() {
        return mRecieved.size() < mExpected.size();
    }
    bool isCorrect() {
        const bool correct = !expectingMore() && mExpected == mRecieved;
        if (!correct) {
            fprintf(stderr, "\nExpected: ");
            for (int i=0; i<mExpected.size(); i++) { fprintf(stderr, "%d, ", mExpected[i].asInteger()); }
            fprintf(stderr, "\nGot:      ");
            for (int i=0; i<mRecieved.size(); i++) { fprintf(stderr, "%d, ", mRecieved[i].asInteger()); }
            fprintf(stderr, "\n");
        }
        return correct;
    }

private:
    std::vector<Packet> mExpected;
    std::vector<Packet> mRecieved;
};

// TODO: allow to write these tests in MicroFlo+JS instead, and run on target
bool checkPacketPropagation() {

    const int nodes = 7;
    const int nmessages = 10;
    std::vector<Packet> messages;
    for (int i=0; i<nmessages; i++) {
        messages.push_back(Packet((long)i));
    }
    Network n;
    PacketComparer comp;

    // Setup
    for (int i=0; i<nodes; i++) {
        n.addNode(Component::create(IdForward));
    }

    for (int i=0; i<nodes-1; i++) {
        const int port = 0;
        n.connect(i, port, i+1, port);
    }

    // Test: send messages into graph,
    // check that they come out on other side
    comp.setExpected(messages);
    n.connect(nodes-1, 0, n.addNode(&comp), 0);
    for (int i=0; i<messages.size(); i++) {
        const int inPort = 0;
        n.sendMessage(0, inPort, messages[i]);
    }

    // Run
    n.runSetup();
    while (comp.expectingMore()) {
        n.runTick();
    }

    const bool pass = comp.isCorrect();
    fprintf(stdout, "%s: %s", __PRETTY_FUNCTION__, pass ? "PASS\n" : "FAIL\n");

    n.reset();
    return pass;
}


int main(int argc, char *argv[]) {

    return checkPacketPropagation() ? 0 : 1;
}
