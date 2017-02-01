#!/bin/bash

MONGODB1=`ping -c 1 mongo1 | head -1  | cut -d "(" -f 2 | cut -d ")" -f 1`

mongo $MONGODB1:27017 --eval "db.stats()" > /dev/null 2>&1

result=$?

if [ $result -eq 0 ]; then
    echo "Mongo replica set running!"
else
    echo "Mongo replica set not running!"
    exit 1
fi