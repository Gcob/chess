# Chess

A personal chess project made by Jacob Proulx.

## Play

Visit [chess.impecloud.com](https://chess.impecloud.com/) to see the project in action.

Please note that the project is still in development. 
At the moment, you can only play a game against another player on the same computer.

## Development

2 roadmaps exists in this project:

- [Frontend engine Roadmap](./frontend/docs/engine-roadmap.md)
- [Backend Roadmap](./docs/ROADMAP.md)

I did want to develop my own engine for a personal challenge, So I did it for the frontend.
The backend (Laravel) will a use a php dependency in `composer.json`.

> At the moment, the backend and docker are not involved yet in the project.
> Only the frontend is deployed in Vercel.

## Domain Model

In order to plan the engine development, I created a domain model to represent entities and how they 
interact with each other. The model is based on the rules of chess and the different states of the game.

![modèle-du-domaine.png](docs/mod%C3%A8le-du-domaine.png)

> The domain model is in french.

## Docker

- This project supports either traefik or ports for docker.
- Services are separated in the docker directory. 
- This project leverages the "extends" feature of docker-compose to separate services definition from the main docker-compose file.

Before running docker-compose, copy the `.env.example` file to `.env` and edit it to your needs.

````bash
cp .env.example .env
````

Once the `.env` file is configured, run docker-compose:

````bash
docker compose up -d --build --force-recreate
````

