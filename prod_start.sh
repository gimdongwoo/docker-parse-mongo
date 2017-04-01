#!/bin/bash

echo "BUILD DOCKER"
docker-compose build

echo "START DOCKER"
docker-compose up -d

echo "REMOVE UNUSED IMAEGE"
docker rmi $(docker images -q -f dangling=true)

echo "DOCKER LOGS"
docker-compose logs -f
