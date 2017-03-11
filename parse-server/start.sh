#!/bin/bash

export NODE_ENV="production"
export S3_ACCESS_KEY=""
export S3_SECRET_KEY=""
export S3_REGION=""
export S3_DIRECT_ACCESS=true,
export APP_BUNDLE_ID=""
export GCM_API_KEY=""
export GCM_SENDER_ID=""
export PARSE_CONFIG="{ 'apps': [ { 'appId': '3wGnqTnHANzT8DAnjSLsrJbQffp0PxHX', 'serverURL': 'https://__SERVER_EXTERNAL_IP__/parse', 'localServerURL': 'http://localhost:1337/parse', 'mountPath': '/parse', 'masterKey': 'UGw3LTION8uMSZ97N9XxUVaQFR1i6tEZ', 'fileKey': '', 'databaseUri': 'mongodb://parseapp:parsepassword@mongo1:27017,mongo2:27019/parseapp?replicaSet=rs0', 's3Bucket': 'parseapp', 'appName': 'parseapp' } ], 'users': [ { 'user': 'parseapp', 'pass': 'parsepassword' } ] }"

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
