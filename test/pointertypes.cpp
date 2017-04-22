
#include <microflo.h>

struct Point2 {
    int x;
    int y;
};
static MicroFlo::PointerType Point2Type = MICROFLO_DEFINE_POINTER_TYPE("Point2");

struct FloatBuffer {
    size_t length;
    float *data;
};
static MicroFlo::PointerType FloatBufferType = MICROFLO_DEFINE_POINTER_TYPE("FloatBuffer");

#if 0
#define AUDIO_BUFFER_SIZE 64
struct AudioBuffer {
    int samples[AUDIO_BUFFER_SIZE];
};
//
#endif

int
test_pointer_types() {

    // Each type should get its own value, starting from 0
    if (Point2Type != 0) {
        return -1;
    }
    if (FloatBufferType != 1) {
        return -2;
    }

    Point2 point = { 19, 84 };
    const Packet pointPacket = Packet(Point2Type, &point);

    // Should not pass for the wrong type
    if (pointPacket.asPointer(FloatBufferType)) {
        return -3;
    }

    // Should pass as the right type
    const Point2 *packetPointer = (Point2 *)pointPacket.asPointer(Point2Type);
    if (!packetPointer) {
        return -4;
    }
    // Pointed-to data should be equal
    if (packetPointer->x != 19 || packetPointer->y != 84) {
        return -5;
    }

    return 0;
}


