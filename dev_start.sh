#!/bin/bash

echo "BUILD DOCKER"
docker-compose -f docker-compose-dev.yml build

echo "REMOVE UNUSED IMAEGE"
docker rmi $(docker images -q -f dangling=true)

echo "START DOCKER"
docker-compose -f docker-compose-dev.yml up -d && docker-compose logs -f
