#!/bin/bash

echo "STOP DOCKER"
docker-compose -f docker-compose-dev.yml down
