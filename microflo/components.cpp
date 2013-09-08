
#include "microflo.h"
#include "components.h"

// Generic
class Forward : public Component {
public:
    virtual void process(Packet in) { send(in); }
};

// I/O

#ifdef ARDUINO
class SerialIn : public Component {
public:
    virtual void process(Packet in) {

        if (in.msg == MsgSetup) {
            // FIXME: do based on input data instead of hardcode
            // FIXME: avoid doing setup multiple times
            Serial.begin(9600);
        } else if (in.msg == MsgTick) {
            if (Serial.available() > 0) {
                char c = Serial.read();
                send(Packet(c));
            }
        }
    }
};

class SerialOut : public Component {
public:
    virtual void process(Packet in) {

        if (in.msg == MsgSetup) {
            // FIXME: do based on input data instead of hardcode
            // FIXME: avoid doing multiple times
            Serial.begin(9600);
        } else if (in.msg == MsgCharacter) {
            Serial.write(in.buf);
        }
    }
};

class DigitalWrite : public Component {
public:
    virtual void process(Packet in) {

        if (in.msg == MsgSetup) {
            // FIXME: do based on input data instead of hardcode
            outPin = 13;
            pinMode(outPin, OUTPUT);
        } else if (in.msg == MsgBoolean) {
            digitalWrite(outPin, in.boolean);
        }
    }
private:
    int outPin;
};

class Timer : public Component {
public:
    virtual void process(Packet in) {

        if (in.msg == MsgSetup) {
            previousMillis = 0;
            // FIXME: do based on input data instead of hardcode
            interval = 1000;
        } else if (in.msg == MsgTick) {
            unsigned long currentMillis = millis();
            if (currentMillis - previousMillis > interval) {
                previousMillis = currentMillis;
                send(Packet(MsgEvent));
            }
        }
    }
private:
    unsigned long previousMillis;
    unsigned long interval;
};

class ToggleBoolean : public Component {
public:
    virtual void process(Packet in) {

        if (in.msg == MsgSetup) {
            // FIXME: do based on input data instead of hardcode
            currentState = false;
        } else if (in.msg == MsgEvent) {
            currentState = !currentState;
            send(Packet(currentState));
        }
    }
private:
    bool currentState;
};

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
        send(Packet((char)getchar()));
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
#ifdef HOST_BUILD
    RETURN_NEW_COMPONENT(PrintStdOut)
    RETURN_NEW_COMPONENT(ReadStdIn)
    RETURN_NEW_COMPONENT(RandomChar)
#endif
#ifdef ARDUINO
    RETURN_NEW_COMPONENT(ToggleBoolean)
    RETURN_NEW_COMPONENT(DigitalWrite)
    RETURN_NEW_COMPONENT(Timer)
    RETURN_NEW_COMPONENT(SerialIn)
    RETURN_NEW_COMPONENT(SerialOut)
#endif
        default:
        return NULL;
    }
}
