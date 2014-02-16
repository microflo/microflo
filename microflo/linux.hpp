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
    virtual void SerialBegin(int serialDevice, int baudrate) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }
    virtual long SerialDataAvailable(int serialDevice) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual unsigned char SerialRead(int serialDevice) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return '\0';
    }
    virtual void SerialWrite(int serialDevice, unsigned char b) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Pin config
    virtual void PinSetMode(int pin, IO::PinMode mode) {
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
    virtual void PinSetPullup(int pin, IO::PullupMode mode) {
        // TODO: support pullup/pulldown config on common boards like RPi
        // Not exposed in sysfs, need to prod registers directly.
        // http://elinux.org/RPi_Low-level_peripherals#GPIO_Pull_Up.2FPull_Down_Register_Example
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
    }

    // Digital
    virtual void DigitalWrite(int pin, bool val) {
        return gpio_write(pin, val);
    }
    virtual bool DigitalRead(int pin) {
        return gpio_read(pin);
    }

    // Analog
    virtual long AnalogRead(int pin) {
        MICROFLO_DEBUG(debug, DebugLevelError, DebugIoOperationNotImplemented);
        return 0;
    }
    virtual void PwmWrite(int pin, long dutyPercent) {
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

    virtual void AttachExternalInterrupt(int interrupt, IO::Interrupt::Mode mode,
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
