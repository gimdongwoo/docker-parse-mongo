#!/bin/bash

cd /parse

MONGODB1=`ping -c 1 mongo1 | head -1  | cut -d "(" -f 2 | cut -d ")" -f 1`

echo "Waiting for MongoDB startup.."
until curl http://${MONGODB1}:28017/serverStatus\?text\=1 2>&1 | grep primary | head -1; do
  printf '.'
  sleep 1
done

echo curl http://${MONGODB1}:28017/serverStatus\?text\=1 2>&1 | grep primary | head -1
echo "MongoDB started.."

echo "NPM START"
npm start
