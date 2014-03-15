
Supported boards
-----------------

MicroFlo for ARM has been tested with
* Mbed LPC1768
* ***INPROGRESS*** Texas Instruments TM4C123G (Tiva-C)

It is expected that other ARM Cortex-Mx based devices that are supported by ARM-GCC can be made to work easily.

Prerequisites
-----------------
1. Download and install an 'gcc-arm-none-eabi' toolchain
For Ubuntu use the PPA [terry.guo/gcc-arm-embedded](https://launchpad.net/~terry.guo/+archive/gcc-arm-embedded)

2. Download and install [OpenOCD]. As of March 2014 you need to build it from source to get Tiva-C support.


Building MicroFlo
------------------
1. Download MicroFlo from git

    git clone https://github.com/jonnor/microflo.git

2. Build

    npm install
    make build-stellaris


Running on Tiva-C
------------------
Follow the steps under [Run OpenOCD](http://processors.wiki.ti.com/index.php/Stellaris_Launchpad_with_OpenOCD_and_Linux),
but use:

* AFX file: build/stellaris/gcc/main.afx
* Board config: ek-tm4c123gxl.cfg


Running on Mbed
------------------
Put the firmware.bin file onto the USB mass storage device
