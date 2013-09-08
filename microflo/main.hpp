#ifdef ARDUINO
GraphStreamer parser;
Network network;
void setup()
{
#ifdef DEBUG
    // TODO: allow to enable/disable at runtime
    Debugger::setup(&network);
#endif
    parser.setNetwork(&network);
    for (int i=0; i<sizeof(graph); i++) {
        parser.parseByte(graph[i]);
    }
    network.runSetup();
}

void loop()
{
    network.runTick();
}
#endif // ARDUINO

#ifdef HOST_BUILD
#include <unistd.h>
int main(int argc, char *argv[]) {

    // Setup
    Network network;

    GraphStreamer parser;
    parser.setNetwork(&network);

    for (int i=0; i<sizeof(graph); i++) {
        parser.parseByte(graph[i]);
    }
#ifdef DEBUG
    FILE *f = fopen("reference.fbcs", "w");
    for (int i=0; i<sizeof(graph); i++) {
        fwrite(&graph[i], sizeof(graph[i]), 1, f);
    }
    fflush(f);
#endif // DEBUG

    network.runSetup();

    // Loop
    while (true) {
        network.runTick();
        usleep(1000);
    }

}
#endif // HOST_BUILD

