#!/usr/bin/env bash

mongo mongo1:27017 --eval "db.stats()" > /dev/null 2>&1

result=$?

if [ $result -eq 0 ]; then
    echo "Mongo replica set running!"
else
    echo "Mongo replica set not running!"
    exit 1
fi
