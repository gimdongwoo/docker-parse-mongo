#!/bin/bash

export NODE_ENV="development"
export S3_ACCESS_KEY=""
export S3_SECRET_KEY=""
export S3_REGION=""
export S3_DIRECT_ACCESS=true,
export APP_BUNDLE_ID=""
export GCM_API_KEY=""
export GCM_SENDER_ID=""
export PARSE_CONFIG="{ 'apps': [ { 'appId': '3wGnqTnHANzT8DAnjSLsrJbQffp0PxHX', 'serverURL': 'http://localhost/parse', 'localServerURL': 'http://localhost:1337/parse', 'mountPath': '/parse', 'masterKey': 'UGw3LTION8uMSZ97N9XxUVaQFR1i6tEZ', 'fileKey': '', 'databaseUri': 'mongodb://parseapp:parsepassword@mongo1:27017,mongo2:27019/parseapp?replicaSet=rs0', 's3Bucket': 'parseapp', 'appName': 'parseapp' } ], 'users': [ { 'user': 'parseapp', 'pass': 'parsepassword' } ] }"

cd /parse

echo "NPM START"
npm start
