Parse Server with MongoDB ReplicaSet using Docker (for AWS EC2)
=============================

## Notes

It's probably not a good idea to run this setup in production as each mongo instance should be split across different machines. However for a single ec2 instance environment this fits our needs.


## Usage

- Start and show logs (turn off logs : ctrl+c)

	```console
	$ docker-compose up -d && docker-compose logs -f
	(or)
	$ ./prod_start.sh
	```

- Stop

	```console
	$ docker-compose down
	(or)
	$ ./prod_stop.sh
	```

- Restart parseapi container

	```console
	$ docker-compose restart parseapi
	(or)
	$ ./prod_restart.sh
	```

## Setup

### Init MongoDB

1. Initial replicaset

	```console
	$ docker-compose -f docker-compose-init.yml
	(Stop after all work is done : ctrl + c)
	```

2. Change password in these files
	- /setup/setup_addauth.sh
	- /setup/setup.sh
	- /parse-server/start.sh
	- /parse-server/start_dev.sh

3. Add authentication

	```console
	$ docker-compose -f docker-compose-addauth.yml
	(Stop after all work is done : ctrl + c)
	```

### Change Parse-server Keys

- You need to change Parse-server keys in these files.
	- /parse-server/start.sh
	- /parse-server/start_dev.sh

- For making new keys, I recommend to use [randomkeygem.com](http://randomkeygen.com/)


## Parse-server

- Default address

	```console
	$ curl http://localhost/parse
	```

- Dashboard (Web Data Browser)

	```console
	http://localhost/dashboard
	```


### Parse Server external path
- 'parse-server/cloud' and 'parse-server/public' are accessable volume.
	- you can modify them and restart parseapi container for deploy.


## Development

- The MongoDB can be remotely located instance and you can run the local parse-server to facilitate cloud-code development.

	```console
	docker-compose -f docker-compose-dev.yml up -d && docker-compose logs -f
	(or)
	$ ./dev_start.sh
	```


## Access Bash shell of Container

- Check Status of Docker containers 

	```console
	$ docker ps
	CONTAINER ID        IMAGE               COMMAND                  CREATED              STATUS              PORTS                                                NAMES
	b1ea1556bbf6        node:6              "/parse/setup.sh"        About a minute ago   Up About a minute   0.0.0.0:1337->1337/tcp                               dockerparsemongo_parseapi_1
	12cfb5cdbfd8        mongo:3.4           "mongod --replSet ..."   About a minute ago   Up About a minute   0.0.0.0:27017->27017/tcp, 0.0.0.0:28017->28017/tcp   dockerparsemongo_mongo1_1
	1c2627bb53a7        mongo:3.4           "mongod --replSet ..."   About a minute ago   Up About a minute   0.0.0.0:27019->27017/tcp, 0.0.0.0:28019->28017/tcp   dockerparsemongo_mongo2_1
	eb3996cdf662        mongo:3.4           "mongod --replSet ..."   About a minute ago   Up About a minute   0.0.0.0:27018->27017/tcp, 0.0.0.0:28018->28017/tcp   dockerparsemongo_mongo3_1
	```

	```console
	$ docker-compose ps
	            Name                           Command               State                          Ports                        
	----------------------------------------------------------------------------------------------------------------------------
	dockerparsemongo_mongo1_1       mongod --replSet rs0 --jou ...   Up       0.0.0.0:27017->27017/tcp, 0.0.0.0:28017->28017/tcp 
	dockerparsemongo_mongo2_1       mongod --replSet rs0 --jou ...   Up       0.0.0.0:27019->27017/tcp, 0.0.0.0:28019->28017/tcp 
	dockerparsemongo_mongo3_1       mongod --replSet rs0 --noj ...   Up       0.0.0.0:27018->27017/tcp, 0.0.0.0:28018->28017/tcp 
	dockerparsemongo_mongosetup_1   /scripts/setup.sh                Exit 0                                                      
	dockerparsemongo_parseapi_1     /parse/setup.sh                  Up       0.0.0.0:1337->1337/tcp
	```

* Access shell of Parse-server container with 
	* `docker exec -it dockerparsemongo_parseapi_1 bash`
	* `docker-compose exec parseapi bash`

* Access shell of MongoDB container with 
	* `docker exec -it dockerparsemongo_mongo1_1 bash`
	* `docker-compose exec mongo1 bash`

	* And, access mongo shell using `mongo`


## MongoDB Storage for EC2

- When created EC2 instance, add 3 ebs volumes for db path.
- mount ebs volumes to './data/rs0-1', './data/rs0-2', './data/rs0-3'

	```console
	$ sudo mkfs.ext4 /dev/xvdb 
	$ sudo mkfs.ext4 /dev/xvdc 
	$ sudo mkfs.ext4 /dev/xvdd
	$ echo '/dev/xvdb __your-path__/data/rs0-1 ext4 defaults,auto,noatime,noexec 0 0 
	/dev/xvdc __your-path__/data/rs0-2 ext4 defaults,auto,noatime,noexec 0 0 
	/dev/xvdd __your-path__/data/rs0-3 ext4 defaults,auto,noatime,noexec 0 0' | sudo tee -a /etc/fstab
	```


## MongoDB Backup & Restore

- I recommend to use aws ebs snapshot for backup & restore.
	- [lambda-ec2-snapshots](https://github.com/jveldboom/lambda-ec2-snapshots)
- And, you can read it.
	- [EC2 Backup and Restore](https://docs.mongodb.com/ecosystem/tutorial/backup-and-restore-mongodb-on-amazon-ec2/)
	- [MongoDB point-in-time recoveries](https://medium.freecodecamp.com/mongodb-point-in-time-recoveries-or-how-we-saved-600-dollars-a-month-and-got-a-better-backup-55466b7d714#.52l8cu4cv)


## Inspired & Referenced by
- [soleo/docker-mongodb-replicaset](https://github.com/soleo/docker-mongodb-replicaset)
- [yeasy/docker-compose-files](https://github.com/yeasy/docker-compose-files)
- [b00giZm/docker-compose-nodejs-examples](https://github.com/b00giZm/docker-compose-nodejs-examples/tree/master/05-nginx-express-redis-nodemon)
- [ParsePlatform/parse-server-example](https://github.com/ParsePlatform/parse-server-example)