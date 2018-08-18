
#include "./pointertypes.cpp"
#include "./errors.cpp"

#include <microflo.cpp>

#include <stdio.h>

// XXX: Hack, generated component factory is currently needed
Component *
createComponent(unsigned char) {
    return NULL;
}

int
main(int argc, char *argv[]) {

    fprintf(stderr, "test_pointer_types():\n");
    const int pointer_fails = test_pointer_types();

    if (pointer_fails != 0) {
        fprintf(stderr, "\tfailed at %d\n", pointer_fails);
        return 1;
    } else {
        fprintf(stderr, "\tPASS\n");
    }

    fprintf(stderr, "test_errors():\n");
    const int test_errors_fails = test_errors();

    if (test_errors_fails != 0) {
        fprintf(stderr, "\tfailed at %d\n", test_errors_fails);
        return 1;
    } else {
        fprintf(stderr, "\tPASS\n");
    }

    return 0;
}
