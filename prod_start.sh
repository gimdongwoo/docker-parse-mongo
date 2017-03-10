#!/bin/bash

echo "BUILD DOCKER"
docker-compose build

echo "REMOVE UNUSED IMAEGE"
docker rmi $(docker images -q -f dangling=true)

echo "START DOCKER"
docker-compose up -d && docker-compose logs -f
