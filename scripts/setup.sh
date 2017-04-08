#!/usr/bin/env bash

source /scripts/config.sh

echo "Waiting for MongoDB startup.."
until [ "$(mongo --host mongo1:27017 admin --eval "db.auth(\"datadog\", \"datadog\");printjson(db.serverStatus())" | grep uptime | head -1)" ]; do
  printf '.'
  sleep 1
done

echo $(mongo --host mongo1:27017 admin --eval "db.auth(\"datadog\", \"datadog\");printjson(db.serverStatus())" | grep uptime | head -1)
echo "MongoDB Started.."


echo SETUP.sh time now: `date +"%T" `
mongo --host mongo1:27017 <<EOF
  use admin;
  db.auth("root", "$rootPassword");
  var cfg = {
    "_id": "rs0",
    "members": [
      {
        "_id": 0,
        "host": "mongo1:27017",
        "priority": 2
      },
      {
        "_id": 1,
        "host": "mongo2:27019",
        "priority": 0
      },
      {
        "_id": 2,
        "host": "mongo3:27018",
        "priority": 1,
        "arbiterOnly": true
      }
    ]
  };
  rs.initiate(cfg, { force: true });
  rs.reconfig(cfg, { force: true });
EOF
