#!/usr/bin/env bash

echo "RESTART parseapi"
docker-compose restart parseapi

echo "RESTART DONE"
docker-compose logs -f --tail=100
