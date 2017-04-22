/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 *
 * Note: Arduino is under the LGPL license.
 */

#include "microflo.h"

#include <string>
#include <algorithm>
#include <fstream>
#include <time.h>

#include <errno.h>
#include <fcntl.h> 
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <termios.h>
#include <unistd.h>
#include <pty.h>
#include <poll.h>

namespace linux_serial {

static int
set_interface_attribs(int fd, int speed)
{
    struct termios tty;

    if (tcgetattr(fd, &tty) < 0) {
        printf("Error from tcgetattr: %s\n", strerror(errno));
        return -1;
    }

    cfsetospeed(&tty, (speed_t)speed);
    cfsetispeed(&tty, (speed_t)speed);

    tty.c_cflag |= (CLOCAL | CREAD);    /* ignore modem controls */
    tty.c_cflag &= ~CSIZE;
    tty.c_cflag |= CS8;         /* 8-bit characters */
    tty.c_cflag &= ~PARENB;     /* no parity bit */
    tty.c_cflag &= ~CSTOPB;     /* only need 1 stop bit */
    tty.c_cflag &= ~CRTSCTS;    /* no hardware flowcontrol */

    /* setup for non-canonical mode */
    tty.c_iflag &= ~(IGNBRK | BRKINT | PARMRK | ISTRIP | INLCR | IGNCR | ICRNL | IXON);
    tty.c_lflag &= ~(ECHO | ECHONL | ICANON | ISIG | IEXTEN);
    tty.c_oflag &= ~OPOST;

    /* fetch bytes as they become available */
    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 1;

    if (tcsetattr(fd, TCSANOW, &tty) != 0) {
        printf("Error from tcsetattr: %s\n", strerror(errno));
        return -1;
    }
    return 0;
}

} //end namespace

namespace {
    static const std::string SYS_GPIO_BASE = "/sys/class/gpio/";

    static inline std::string &rtrim(std::string &s) {
            s.erase(std::find_if(s.rbegin(), s.rend(), std::not1(std::ptr_fun<int, int>(std::isspace))).base(), s.end());
            return s;
    }

    // PERFORMANCE: string-functions and file open/close for each I/O call. Consider capturing state in a class
    std::string read_sys_file(const std::string &path) {
        std::ifstream fs(path.c_str());
        if (!fs){
            return "";
        }
        std::string res;
        fs >> res; 
        fs.close();
        return res;
    }

    bool write_sys_file(const std::string &path, const std::string &value) {
        std::ofstream fs(path.c_str());
        if (!fs){
            return false;
        }
        fs << value;
        fs.close();
        return true;
    }


    timespec timespec_diff(timespec start, timespec end)
    {
        timespec temp;
        if ((end.tv_nsec-start.tv_nsec)<0) {
            temp.tv_sec = end.tv_sec-start.tv_sec-1;
            temp.tv_nsec = 1000000000+end.tv_nsec-start.tv_nsec;
        } else {
            temp.tv_sec = end.tv_sec-start.tv_sec;
            temp.tv_nsec = end.tv_nsec-start.tv_nsec;
        }
        return temp;
    }

    bool canRead(int fd, int timeoutUs) {
        const int nfds = 1;
        struct pollfd fds[nfds] = {
            { fd, POLLIN, 0 }
        };
        struct timespec tv = { 0, 1000*timeoutUs };
        const int ready = ppoll(&fds[0], nfds, &tv, NULL);
        return ready > 0;
    }
}



class LinuxSerialTransport : public HostTransport {
public:
    LinuxSerialTransport(const std::string &p)
        : path(p)
    {
    }

    // implements HostTransport
    virtual void setup(IO *i, HostCommunication *c);
    virtual void runTick();
    virtual void sendCommand(const uint8_t *buf, uint8_t len);

private:
    IO *io;
    HostCommunication *controller;
    int baudrate;
    std::string path;
    int slave;
    int master;
};

void LinuxSerialTransport::setup(IO *i, HostCommunication *c) {
    io = i;
    controller = c;

    char name[256];
    const int ptyopened = openpty(&master, &slave, &name[0], NULL, NULL);
    if (ptyopened < 0) {
        return;
    }

    // provide the slave end at @path
    unlink(path.c_str());
    const char *devname = ttyname(slave);
    if (!devname) {
        return;
    }
    symlink(devname, path.c_str());

    /* baudrate 115200, 8 bits, no parity, 1 stop bit */
    if (master >= 0) {
        linux_serial::set_interface_attribs(master, B115200);
    }
}

void LinuxSerialTransport::runTick() {

    const bool ready = canRead(master, 10);
    if (!ready) {
        return;
    }

    const size_t cmdSize = MICROFLO_CMD_SIZE;
    unsigned char buf[cmdSize];
    const ssize_t bytesRead = read(master, buf, cmdSize);
    if (bytesRead > 0) {
        for (ssize_t i=0; i<bytesRead; i++) {
            controller->parseByte(buf[i]);
        }
    }
}

void LinuxSerialTransport::sendCommand(const uint8_t *b, uint8_t len) {
    // Make sure to pad to the cmd size
    const size_t cmdSize = MICROFLO_CMD_SIZE;
    char cmd[cmdSize];
    for (uint8_t i=0; i<cmdSize; i++) {
        cmd[i] = ((i < len) ?  b[i] : 0x00);
    }

    size_t written = write(master, cmd, cmdSize);
    //if (written != cmdSize) {
    //    printf("Error from write: %d, %d\n", wlen, errno);
    //}
    tcdrain(master); /* delay for output */
}


/**
 * I/O backend for embedded Linux boards/SOCs, like Raspberry PI, BeagleBone Black etc
*/
class LinuxIO : public IO {

public:
    LinuxIO() {
        if (clock_gettime(CLOCK_MONOTONIC, &start_time) != 0) {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoFailure);
        }
    }
    ~LinuxIO() {}

    // Serial
    // TODO: support serial
    virtual void SerialBegin(uint8_t serialDevice, int baudrate) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
    virtual long SerialDataAvailable(uint8_t serialDevice) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual unsigned char SerialRead(uint8_t serialDevice) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return '\0';
    }
    virtual void SerialWrite(uint8_t serialDevice, unsigned char b) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Pin config
    virtual void PinSetMode(MicroFlo::PinId pin, IO::PinMode mode) {
        if (!write_sys_file(SYS_GPIO_BASE+"export", std::to_string(pin))) {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoFailure);
            return;
        }

        if (mode == IO::InputPin) {
            if (!write_sys_file(SYS_GPIO_BASE+"gpio"+std::to_string(pin)+"/direction", "in")) {
                MICROFLO_DEBUG(debug, DebugLevelError, DebugIoFailure);
            }
        } else if (mode == IO::OutputPin) {
            if (write_sys_file(SYS_GPIO_BASE+"gpio"+std::to_string(pin)+"/direction", "out")) {
                MICROFLO_DEBUG(debug, DebugLevelError, DebugIoFailure);
            }
        } else {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        }
    }
    virtual void PinSetPullup(MicroFlo::PinId pin, IO::PullupMode mode) {
        // TODO: support pullup/pulldown config on common boards like RPi
        // Not exposed in sysfs, need to prod registers directly.
        // http://elinux.org/RPi_Low-level_peripherals#GPIO_Pull_Up.2FPull_Down_Register_Example
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Digital
    virtual void DigitalWrite(MicroFlo::PinId pin, bool val) {
        return gpio_write(pin, val);
    }
    virtual bool DigitalRead(MicroFlo::PinId pin) {
        return gpio_read(pin);
    }

    // Analog
    virtual long AnalogRead(MicroFlo::PinId pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual void PwmWrite(MicroFlo::PinId pin, long dutyPercent) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Timer
    virtual long TimerCurrentMs() {
        timespec current_time;
        if (clock_gettime(CLOCK_MONOTONIC, &current_time) != 0) {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoFailure);
        }
        timespec since_start = timespec_diff(start_time, current_time);
        return (since_start.tv_sec*1000)+(since_start.tv_nsec/1000000);
    }

    virtual void AttachExternalInterrupt(uint8_t interrupt, IO::Interrupt::Mode mode,
                                        IOInterruptFunction func, void *user) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

private:
    // Assumes GPIO is set up as input
    bool gpio_read(int number){
        std::string path = SYS_GPIO_BASE + "gpio" + std::to_string(number) + "/value";
        std::string res = read_sys_file(path);
        if (res.empty()) {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoFailure);
        }
        res = rtrim(res);
        return res == "1";
    }

    // Assumes GPIO is set up as output
    void gpio_write(int number, bool value){
        std::string path = SYS_GPIO_BASE + "gpio" + std::to_string(number) + "/value";
        if (!write_sys_file(path, value ? "1" : "0")) {
            MICROFLO_DEBUG(debug, DebugLevelError, DebugIoFailure);
        }
    }
private:
    struct timespec start_time;
};
