#!/bin/bash
DIR=$(dirname $0)
cd $DIR/..

function watch {
    while true; do
        inotifywait \
            --timeout 1 \
            --recursive \
            --event modify \
            --event create \
            --event delete \
            --event move \
            lib test

        if [[ "0" == $? ]]; then
            pkill -f test.js
        fi
    done
}

coproc watch 2>&1
WPID=$!
function cleanup {
    kill $WPID > /dev/null 2>&1
    wait
    exit
}

trap cleanup INT EXIT TERM

while true; do
    npm test
    examples/test.js
    sleep 1
done
