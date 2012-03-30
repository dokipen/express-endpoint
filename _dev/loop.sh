#!/bin/bash
while true; do
    npm test
    examples/test.js
    sleep 1
done
