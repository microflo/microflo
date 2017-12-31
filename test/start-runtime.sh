#!/bin/bash -e
SERIALFILE=test.microflo
OPTIONS="--port 3334 --baudrate 115200 --serial $SERIALFILE"

# Make sure we clean up
trap 'kill $(jobs -p)' EXIT

./build/linux/firmware $SERIALFILE &
sleep 2
./microflo.js runtime $OPTIONS --componentmap build/linux/main.component.map.json
