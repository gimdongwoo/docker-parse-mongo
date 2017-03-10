#!/bin/bash

echo "RESTART parseapi1"
docker-compose restart parseapi1

echo "RESTART parseapi2"
docker-compose restart parseapi2

echo "RESTART DONE"
docker-compose logs -f --tail=100
