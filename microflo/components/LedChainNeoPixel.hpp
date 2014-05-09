#ifdef HAVE_ADAFRUIT_NEOPIXEL
#include <Adafruit_NeoPixel.h>
#endif

class LedChainNeoPixel : public Component {
public:
    LedChainNeoPixel()
        : Component(outPorts, 2)
        , pin(-1)
        , number(-1)
        , initialized(false)
        , currentPixelAddress(-1)
#ifdef HAVE_ADAFRUIT_NEOPIXEL
        , neoPixel(0)
#endif
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace LedChainNeoPixelPorts;
        if (port == InPorts::in) {
            if (currentPixelAddress == -1 && in.isNumber()) {
                currentPixelAddress = in.asInteger();
            } else if (currentPixelAddress != -1 && in.isInteger()) {
                updateCurrentPixel((uint32_t)in.asInteger());
                currentPixelAddress = -1;
            } else if (in.isEndBracket() || in.isStartBracket()) {
                // To recover in case someone sent us non-grouped
                // data which got us into a bogus state
                currentPixelAddress = -1;
            }
        } else if (port == InPorts::pin) {
            pin = in.asInteger();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::pixels) {
            number = in.asInteger();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::show) {
            if (initialized) {
#ifdef HAVE_ADAFRUIT_NEOPIXEL
                neoPixel.show();
#endif
            }
        }
    }
private:
    void tryInitialize() {
        using namespace LedChainNeoPixelPorts;

        if (initialized || number < 0 || pin < 0) {
            return;
        }
#ifdef HAVE_ADAFRUIT_NEOPIXEL
        neoPixel.setNumber(number);
        neoPixel.setPin(pin);
        neoPixel.begin();
#endif
        initialized = true;
        send(Packet(initialized), OutPorts::ready);
    }

    void updateCurrentPixel(uint32_t rgb) {
        using namespace LedChainNeoPixelPorts;
        if (!initialized || currentPixelAddress < 0
                || currentPixelAddress >= number) {
            return;
        }
#ifdef HAVE_ADAFRUIT_NEOPIXEL
        neoPixel.setPixelColor(currentPixelAddress, rgb);
#endif
        const MicroFlo::PortId p = OutPorts::pixelset;
        send(Packet(MsgBracketStart), p);
        send(Packet((long)currentPixelAddress));
        send(Packet((long)rgb));
        send(Packet(MsgBracketEnd), p);
    }

private:
    int8_t pin;
    int8_t number;
    bool initialized;
    int currentPixelAddress; // -1 means waiting for pixel index, else waiting for value
    Connection outPorts[2];
#ifdef HAVE_ADAFRUIT_NEOPIXEL
    Adafruit_NeoPixel neoPixel;
#endif
};
