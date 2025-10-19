# Chess

A chess project made by Jacob Proulx.

## Roadmap Phase 1

- [x] Set up a domain model to represent the chess game
- [ ] Set up docker compose (in progress)
- [ ] Set up the backend with Laravel 12 and PHP 8.3.
- [ ] Implement the domain logic in Laravel to be able to play a game in the terminal.
- [ ] Set up the frontend in Vue.js 3 compose API.
- [ ] Implement the game interface with drag and drop for the pieces.
- [ ] Create multiple AI levels to play against the computer with Stockfish.
- [ ] Deploy the project on a server.


## Phase 2 features

- [ ] Implement a settings system to customize the user experience and basic themes.
- [ ] Implement a 3D board view with 3D themes.
- [ ] Implement the account system with registration, login, profile and game history.
- [ ] Implement a friends system to add and remove friends.
- [ ] Implement the matchmaking system to invite friends with Laravel Reverb for real-time features and websockets.
- [ ] Implement a ranking system with ELO and matchmaking based on ELO.
- [ ] Implement a chat system to communicate with other players.
- [ ] Implement a tournament system to create and join tournaments.
- [ ] Implement a puzzle system to solve chess puzzles.
- [ ] Implement a study system to create and share chess studies.
- [ ] Implement a lesson system to learn chess with interactive lessons.
- [ ] Implement a analysis system to analyze games with Stockfish.


## Domain Model

![modèle du domaine - échec - chess-MDD V2.drawio.png](documentation%2Fmod%C3%A8le%20du%20domaine%20-%20%C3%A9chec%20-%20chess-MDD%20V2.drawio.png)

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

