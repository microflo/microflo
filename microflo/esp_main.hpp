extern "C" {

#include "espmissingincludes.h"
#include <ets_sys.h>
#include <osapi.h>
#include <gpio.h>
#include <c_types.h>
#include <os_type.h>
#include <user_interface.h>
#include <mem.h>

#include "user_config.h"

}

#include "esp.hpp"

/* Run C++ constructors */
extern void (*__init_array_start)(void);
extern void (*__init_array_end)(void);

static void
do_global_ctors(void)
{
    void (**p)(void);
    for (p = &__init_array_start; p != &__init_array_end; ++p)
            (*p)();
}

void *operator new(size_t n)
{
  void * const p = os_malloc(n);
  return p;
}
void operator delete(void * p)
{
  os_free(p);
}

extern "C"
{
    void __cxa_pure_virtual() {
        while (1);
    }
}

// Silence QtCreator
#ifndef ICACHE_FLASH_ATTR
#define ICACHE_FLASH_ATTR
#endif


#define user_procTaskPrio        0
#define user_procTaskQueueLen    1
os_event_t    user_procTaskQueue[user_procTaskQueueLen];
static os_timer_t some_timer;

Esp8266IO io;
const int serialPort = 0;
const int serialBaudrate = 9600;
FixedMessageQueue queue;
Network network(&io, &queue);
HostCommunication controller;
SerialHostTransport transport(serialPort, serialBaudrate);
long lastTime = 0;

static void
loadFromProgMem(HostCommunication *controller) {
    for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = graph[i];
        controller->parseByte(c);
    }
}

static void user_procTask(os_event_t *events);

// Run MicroFlo main-loop
static void ICACHE_FLASH_ATTR
user_procTask(os_event_t *events)
{
    os_delay_us(10);

    transport.runTick();
    network.runTick();

    system_os_post(user_procTaskPrio, 0, 0 );
}

extern "C" {

void ICACHE_FLASH_ATTR user_init(void) {

    do_global_ctors();

    // Initialize the GPIO subsystem.
    gpio_init();

    transport.setup(&io, &controller);
    controller.setup(&network, &transport);
    io.setup();
// #ifdef MICROFLO_EMBED_GRAPH
    loadFromProgMem(&controller);
// #endif

    //Set GPIO1 to output mode // TODO: move into Esp8266IO
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_U0TXD_U, FUNC_GPIO1);

    // Run MicroFlo as os task
    system_os_task(user_procTask, user_procTaskPrio, user_procTaskQueue, user_procTaskQueueLen);
    system_os_post(user_procTaskPrio, 0, 0 );
}

}

#include "microflo.hpp"
