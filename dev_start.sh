#!/bin/bash

echo "BUILD DOCKER"
docker-compose -f docker-compose-dev.yml build

echo "START DOCKER"
docker-compose -f docker-compose-dev.yml up -d

echo "REMOVE UNUSED IMAEGE"
docker rmi $(docker images -q -f dangling=true)

echo "DOCKER LOGS"
docker-compose logs -f --tail=100
