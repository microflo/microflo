
Supported boards
-----------------

MicroFlo for Embedded Linux is *work-in-progress*.
A basic [I/O backend](../microflo/linux.hpp) with support for sysfs-based GPIO exists.

It has been tested on:

* Raspberry Pi
* add-your-board-here

Prerequisites
-----------------

1. Download and install [Node.JS](http://nodejs.org)
2. Download and install a C++ toolchain for your Embedded Linux device


Building MicroFlo
------------------
It is assumed that you have common build tools such as 'make', 'git'

1. Download MicroFlo from git

    git clone https://github.com/jonnor/microflo.git

2. Build

    git submodule update --init --recursive
    npm install
    make build-linux

3. Run

    ./build/linux/firmware
