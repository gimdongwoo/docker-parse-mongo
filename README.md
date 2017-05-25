Parse Server with MongoDB ReplicaSet using Docker
=============================

> This branch is for GCP Cloud Computing.

> If you want to use Amazon Web Service, try [AWS branch](https://github.com/gimdongwoo/docker-parse-mongo/)


## Notes

It's probably not a good idea to run this setup in production as each mongo instance should be split across different machines. However for a single Compute Engine instance environment this fits our needs.


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
	$ docker-compose -f docker-compose-init.yml up
	(Stop after all work is done : ctrl + c)
	```

2. Copy, remove '_sample' from the name, and change password these files
	- /scripts/config_sample.sh > /scripts/config.sh
	- /parse-server/config_sample.sh > /parse-server/config.sh
	- /parse-server/config_dev_sample.sh > /parse-server/config_dev.sh

3. Add authentication

	```console
	$ docker-compose -f docker-compose-addauth.yml up
	(Stop after all work is done : ctrl + c)
	```
	If added user failed, retry until shown 'Successfully added user'.

### Change Parse-server Keys

- You need to change Parse-server keys in these files.
	- /parse-server/config.sh
	- /parse-server/config_dev.sh

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


## Host O/S Guide

> I recommend CoreOS because it's optimized for Docker.

### Install Docker-Compose

- The execution path of CoreOS differs from other Linux.

	``` console
	$ sudo mkdir -p /opt/bin
	$ sudo curl -L "https://github.com/docker/compose/releases/download/1.13.0/docker-compose-$(uname -s)-$(uname -m)" -o /opt/bin/docker-compose
	$ sudo chmod +x /opt/bin/docker-compose
	
	$ docker-compose --version
	```

### Add swap

- f1-micro has 0.6Gb memory, requires swap

	```console
	$ sudo fallocate -l 1G /swapfile
	$ sudo chown root:root /swapfile
	$ sudo chmod 600 /swapfile
	$ sudo mkswap /swapfile	
	$ sudo swapon /swapfile
	
	$ sudo swapon -s
	$ free -m
	```
	
- CoreOS does not use fstab. Need to [creating the systemd unit file](https://coreos.com/os/docs/latest/adding-swap.html).

### MongoDB Storage for Compute Engine

- When created Compute Engine instance, add 2 disk volumes for db path.
- mount ebs volumes to './data/rs01', './data/rs02'
- The free tier provides 30 GB of storage, so 10 GB each is recommended (host, rs01, rs02).

	```console
	$ sudo mkfs.ext4 /dev/sdb
	$ sudo mkfs.ext4 /dev/sdc
	```
	
- CoreOS does not use fstab. Need to ``mount`` file.
	> The ``mount`` file for CoreOS has the name changed / to -.

	* /etc/systemd/system/home-USERID-parse-data-rs01.mount
	
	```console
	[Mount]
	What=/dev/sdb
	Where=/home/USERID/parse/data/rs01
	Type=ext4

	[Install]
	WantedBy=local-fs.target
	```

	* /etc/systemd/system/home-USERID-parse-data-rs02.mount
	
	```console
	[Mount]
	What=/dev/sdc
	Where=/home/USERID/parse/data/rs02
	Type=ext4

	[Install]
	WantedBy=local-fs.target
	```


## MongoDB Guide

### MongoDB Backup & Restore

- Comming soon.


### Management MongoDB

- I reccommend to use [adminMongo](https://github.com/mrvautin/adminMongo)
	- Thank you @mrvautin


## Inspired & Referenced by
- [soleo/docker-mongodb-replicaset](https://github.com/soleo/docker-mongodb-replicaset)
- [yeasy/docker-compose-files](https://github.com/yeasy/docker-compose-files)
- [b00giZm/docker-compose-nodejs-examples](https://github.com/b00giZm/docker-compose-nodejs-examples/tree/master/05-nginx-express-redis-nodemon)
- [ParsePlatform/parse-server-example](https://github.com/ParsePlatform/parse-server-example)
