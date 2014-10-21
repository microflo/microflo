/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 *
 * Note: Some libraries used in components may be of different license.
 */

#include "microflo.h"
#include "components.h"

#include "components-gen-top.hpp"

class Invalid : public DummyComponent {};
class _Max : public DummyComponent {};

// Convenience class for components whos output is purely
// a function of the current input values
template <typename FUNC, typename T0, typename T1>
class PureFunctionComponent2 : public Component {
public:
    PureFunctionComponent2()
        : Component(connections, 1)
    {
    }

    virtual void process(Packet in, MicroFlo::PortId port) {
        if (in.isData()) {
            if (port == 0) {
                input0 = in;
            } else if (port == 1) {
                input1 = in;
            }
            const Packet ret = function(input0, input1);
            if (ret.isValid()) {
                send(ret);
            }
        }
    }
private:
    Connection connections[1];
    FUNC function;
    T0 input0;
    T1 input1;
};



#include "components-gen-lib.hpp"

#include "components-gen-bottom.hpp"



