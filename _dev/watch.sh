#!/bin/bash
cd $(dirname $0)/..
echo $$ > _dev/watch.pid
while true; do
    inotifywait -r -e modify -e create -e delete -e move lib test
    pkill -f test.js
done
