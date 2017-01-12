#!/usr/bin/env python2

# From https://github.com/nicholaskell/Arduino_Loader/blob/master/reset.py

import serial, sys

serialPort = sys.argv[1]
print serialPort

ser = serial.Serial(
    port=serialPort,
    baudrate=1200,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    bytesize=serial.EIGHTBITS
)

ser.setRTS(True)
ser.setDTR(False)

ser.isOpen()
ser.close()
