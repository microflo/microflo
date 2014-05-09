#ifdef HAVE_ADAFRUIT_WS2801
#include <Adafruit_WS2801.h>
#endif

class LedChainWS : public Component {
public:
    LedChainWS()
        : Component(outPorts, 2)
        , pindata(-1)
        , pinclk(-1)
        , useHardwareSpi(false)
        , number(-1)
        , initialized(false)
        , currentPixelAddress(-1)
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace LedChainWSPorts;
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
        } else if (port == InPorts::pindata) {
            pindata = in.asInteger();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::pinclk) {
            pinclk = in.asInteger();
            initialized = false;
            send(Packet(initialized), OutPorts::ready);
            tryInitialize();
        } else if (port == InPorts::hwspi) {
            useHardwareSpi = in.asBool();
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
#ifdef HAVE_ADAFRUIT_WS2801
                ws.show();
#endif
            }
        }
    }
private:
    void tryInitialize() {
        using namespace LedChainWSPorts;
        const bool pinConfigReady = useHardwareSpi || (pindata >= 0 && pinclk >= 0);
        if (initialized || number < 0 || !pinConfigReady) {
            return;
        }
#ifdef HAVE_ADAFRUIT_WS2801
        ws.updateLength(number);
        if (useHardwareSpi) {
            ws.updatePins();
        } else {
            ws.updatePins(pindata, pinclk);
        }
        ws.begin();
        ws.show();
#endif
        initialized = true;
        send(Packet(initialized), OutPorts::ready);
    }

    void updateCurrentPixel(uint32_t rgb) {
        using namespace LedChainWSPorts;
        if (!initialized || currentPixelAddress < 0
                || currentPixelAddress >= number) {
            return;
        }
#ifdef HAVE_ADAFRUIT_WS2801
        ws.setPixelColor(currentPixelAddress, rgb);
#endif
        const MicroFlo::PortId p = OutPorts::pixelset;
        send(Packet(MsgBracketStart), p);
        send(Packet((long)currentPixelAddress));
        send(Packet((long)rgb));
        send(Packet(MsgBracketEnd), p);
    }

private:
    int8_t pindata;
    int8_t pinclk;
    bool useHardwareSpi;
    int8_t number;
    bool initialized;
    int currentPixelAddress; // -1 means waiting for pixel index, else waiting for value
    Connection outPorts[2];
#ifdef HAVE_ADAFRUIT_WS2801
    Adafruit_WS2801 ws;
#endif
};
