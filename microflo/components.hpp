
// Generic
class Forward : public Component {
public:
    virtual void process(Packet in);
};

void Forward::process(Packet in) {
    send(in);
}

// I/O

#ifdef ARDUINO


#endif // ARDUINO


#ifdef HOST_BUILD
#include <stdio.h>
#include <unistd.h>
#include <time.h>
#include <stdlib.h>

class ReadStdIn : public Component {
public:
    virtual void process(Packet in);
};

void ReadStdIn::process(Packet in) {
    if (in.msg == MsgTick) {
        send(Packet(getchar()));
    }
}

class PrintStdOut : public Component {
public:
    virtual void process(Packet in);
};

void PrintStdOut::process(Packet in) {
    if (in.msg == MsgCharacter) {
        putchar(in.buf);
    }
}

class RandomChar : public Component {
public:
    virtual void process(Packet in) {
        char c = 255 * (rand()/(RAND_MAX+1.0));
        send(Packet(c));
    }
};

#endif // HOST_BUILD


#define RETURN_NEW_COMPONENT(X) case Id##X: return new X;

Component *Component::create(ComponentId id) {

    switch (id) {
    RETURN_NEW_COMPONENT(Forward)
    RETURN_NEW_COMPONENT(PrintStdOut)
    RETURN_NEW_COMPONENT(ReadStdIn)
    RETURN_NEW_COMPONENT(RandomChar)
    default:
        return NULL;
    }
}
