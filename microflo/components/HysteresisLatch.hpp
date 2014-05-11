class HysteresisLatch : public SingleOutputComponent
{
public:
    virtual void process(Packet in, MicroFlo::PortId port) {
        using namespace HysteresisLatchPorts;

        if (in.isSetup()) {
            // defaults
            mHighThreshold = 30;
            mLowThreshold = 24;
            mCurrentState = true; // TODO: make tristate or configurable?
        } else if (port == InPorts::lowthreshold && in.isNumber()) {
            mLowThreshold = in.asFloat();
        } else if (port == InPorts::highthreshold && in.isNumber()) {
            mHighThreshold = in.asFloat();
        } else if (port == InPorts::in && in.isNumber()) {
            updateValue(in.asFloat());
        }
    }

private:
    void updateValue(float input) {
        if (mCurrentState) {
            if (input <= mLowThreshold) {
                mCurrentState = false;
            }
        } else {
            if (input >= mHighThreshold) {
                mCurrentState = true;
            }
        }
        send(Packet(mCurrentState));
    }

private:
    float mHighThreshold;
    float mLowThreshold;
    bool mCurrentState;
};
