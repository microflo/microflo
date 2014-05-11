#ifdef HAVE_DALLAS_TEMPERATURE

#include <OneWire.h>
#include <DallasTemperature.h>

class ReadDallasTemperature : public SingleOutputComponent {
public:
    ReadDallasTemperature()
        : pin(-1) // default
        , addressIndex(0)
    {}

    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace ReadDallasTemperaturePorts;

        if (in.isSetup()) {
            // defaults
        } else if (port == InPorts::pin && in.isNumber()) {
            updateConfig(in.asInteger(), sensors.getResolution());
        } else if (port == InPorts::address) {
            if (in.isStartBracket()) {
                addressIndex = 0;
            } else if (in.isData()) {
                if (addressIndex < sizeof(address)) {
                    address[addressIndex++] = in.asByte();
                }
            } else if (in.isEndBracket()) {
                // ASSERT(addressIndex == sizeof(DeviceAddress));
            }

        } else if (port == InPorts::trigger && in.isData()) {
            if (addressIndex == sizeof(DeviceAddress) && sensors.getWire()) {
                sensors.requestTemperatures();
                const float tempC = sensors.getTempC(address);
                if (tempC != -127) {
                    send(Packet(tempC));
                }
            }
        }
    }
private:
    void updateConfig(int newPin, int newResolution) {
        if (newPin != pin && newPin > -1) {
            oneWire.setPin(newPin);
            sensors.setWire(&oneWire);
        }
        sensors.setResolution(newResolution);
    }

    MicroFlo::PortId pin;
    int8_t addressIndex;
    ::DeviceAddress address;
    ::OneWire oneWire;
    ::DallasTemperature sensors;
};

#else
class ReadDallasTemperature : public DummyComponent { };
#endif
