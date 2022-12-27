# Chess 
Developing a chess game projet in JS and PHP to learn and teach web programming in a full stack env.

## Quickstart 

* `composer install`
* `yarn`
* `yarn dev`


## Docker

If you have docker and docker compose installed on your machine, fell free to use this LAMP setup including NodeJS :

* Start the containers `docker compose -p chess-containers up -d`
* "ssh" into the main container `docker exec -it chess-server bash`

To access the project : [http://localhost:3090](http://localhost:3090)

To access the database : [http://localhost:3093](http://localhost:3093/db_structure.php?server=1&db=chess-db)

To see php infos : [http://localhost:3090/phpinfo.php](http://localhost:3090/phpinfo.php)


## Documentation

### Plugins

Webpack Encore : https://symfony.com/doc/current/frontend.html

### Artefacts

[MDD](https://lucid.app/lucidchart/351354ed-10e0-4592-b98f-911a3cc0bcc0/edit?viewport_loc=-433%2C-507%2C2994%2C1423%2C0_0&invitationId=inv_bb5c43ee-8c2f-48d9-8b2c-44ab37ba7e67)

### Containers documentation

* [Phpmyadmin:5.0.1](https://hub.docker.com/r/phpmyadmin/phpmyadmin/)
* [Mariadb:10.3.35 (MySQL)](https://hub.docker.com/_/mariadb)
* [gcob/chess-server](https://hub.docker.com/repository/docker/gcob/chess-server)

The last image was build from "php8.0-xdebug-composer-node16.Dockerfile". It has php 8.2.1, Apache 2.2, NodeJS 16.16 and composer.
