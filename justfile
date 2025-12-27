# Charge automatiquement les variables de .env.docker si le fichier existe
set dotenv-load := true

# Récupère le préfixe du projet ou utilise 'chess' par défaut si le fichier .env.docker n'existe pas encore
project_prefix := env_var_or_default('DOCKER_PROJECT_PREFIX', 'chess')
# Construit le nom du conteneur workspace dynamiquement
container := project_prefix + "_laravel_workspace"

# Liste les commandes disponibles
help:
    @just --list

##################################################
############     Setup & Init        #############
##################################################

# Lance l'installation complète (wrapper pour le script bash)
init:
    @echo "Lancement du script de configuration..."
    chmod +x docker-setup.sh
    sudo ./docker-setup.sh

# Répare les permissions (utile si tu as des problèmes de droits sur storage)
fix-perms:
    docker exec -u 0 -it {{ container }} chmod -R 777 storage bootstrap/cache

#################################################
############     Docker commands     ############
#################################################

# Démarre les conteneurs
start:
    docker compose up -d --build

# Arrête les conteneurs
stop:
    docker compose stop

# Redémarre les conteneurs
restart:
    docker compose restart

# Réinitialise tout (down + start)
reset:
    docker compose down
    just start

# Affiche les logs (ex: just logs chess_nginx)
logs service='':
    docker compose logs -f {{ service }}

# Ouvre un shell bash dans le workspace
bash:
    docker exec -it {{ container }} bash

# Supprime les conteneurs (option: just remove true pour tout nettoyer)
remove prune="false":
    #!/usr/bin/env bash
    if [ "{{ prune }}" = "true" ]; then
        docker compose down -v --rmi all --remove-orphans
    else
        docker compose down
    fi

##################################################
############     Laravel commands     ############
##################################################

# Exécute une commande PHP
php +args:
    docker exec -it {{ container }} php {{ args }}

# Alias pour php (ex: just p -v)
p +args:
    just php {{ args }}

# Exécute une commande Artisan
artisan +args:
    docker exec -it {{ container }} php artisan {{ args }}

# Alias pour artisan (ex: just a migrate)
a +args:
    just artisan {{ args }}

# Exécute une commande Composer
composer +args:
    docker exec -it {{ container }} composer {{ args }}

# Alias pour composer (ex: just c install)
c +args:
    just composer {{ args }}

##################################################
############     Quality & Tests     #############
##################################################

# Lance les tests (Pest ou PHPUnit)
test +args:
    docker exec -it {{ container }} ./vendor/bin/pest {{ args }}

# Alias pour les tests
t +args:
    just test {{ args }}

# Lance le linter Laravel Pint
pint:
    docker exec -it {{ container }} ./vendor/bin/pint

# Lance Pint en mode correctif (fix)
fmt:
    docker exec -it {{ container }} ./vendor/bin/pint

##################################################
############     Database & Redis    #############
##################################################

# Connecte au client Redis (redis-cli)
redis:
    docker exec -it {{ project_prefix }}_redis redis-cli

# Rafraîchit la BDD (supprime tout et remigre + seed)
fresh:
    just artisan migrate:fresh --seed
