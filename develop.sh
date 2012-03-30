#!/bin/bash
DIR=$(dirname $0)
cd $DIR

function clean_up {
    if [ -f _dev/watch.pid ]; then
        kill $(cat _dev/watch.pid)
        rm _dev/watch.pid -f
    fi
}
trap clean_up INT TERM EXIT

_dev/watch.sh > /dev/null 2>&1 &
_dev/loop.sh
