#!/bin/bash -e
SERIALFILE=prefix/test
export MSGFLO_BROKER=mqtt://localhost
OPTIONS="--port 3335 --serial ${MSGFLO_BROKER}/$SERIALFILE/microflo/"

# Make sure we clean up
trap 'kill $(jobs -p)' EXIT

./build/linux-mqtt/repeat $SERIALFILE &
sleep 2
./microflo.js runtime $OPTIONS --componentmap build/linux-mqtt/repeat.component.map.json
