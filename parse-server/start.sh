#!/usr/bin/env bash

source /parse/config.sh

cd /parse

MONGODB1=`ping -c 1 mongo1 | head -1  | cut -d "(" -f 2 | cut -d ")" -f 1`

echo "Waiting for MongoDB ReplicaSet ready.."
until [ "$(mongo --host mongo1:27017 admin --eval "db.auth(\"datadog\", \"datadog\");printjson(rs.status())" | grep PRIMARY | head -1)" ]; do
  printf '.'
  sleep 1
done

echo $(mongo --host mongo1:27017 admin --eval "db.auth(\"datadog\", \"datadog\");printjson(rs.status())" | grep PRIMARY | head -1)
echo "MongoDB ReplicaSet ok.."

echo "NPM START"
npm start
