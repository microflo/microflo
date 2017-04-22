
#include <microflo.h>

int
test_errors() {
    const Packet wrongTypeError = Packet(ErrorUnsupportedType);

    // Errors can be detected with isError()
    if (!wrongTypeError.isError()) {
        return -1;
    }

    // Errors are data
    if (!wrongTypeError.isData()) {
        return -2;
    }

    // Regular data does not pass isError()
    const Packet notError = Packet(true);
    if (notError.isError()) {
        return -3;
    }

    // The error type/code is stored in .err
    if (wrongTypeError.asError() != ErrorUnsupportedType) {
        return -4;
    }

    return 0;
}
