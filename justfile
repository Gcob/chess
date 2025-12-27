help:
  just --list

#################################################
############     Docker commands     ############
#################################################

start:
    docker compose up -d --build

stop:
    docker compose stop

restart:
    docker compose restart

reset:
    docker compose down
    just start

logs container='':
    docker compose logs -f {{ container }}

remove prune="false":
    if [ "{{ prune }}" = "true" ]; then \
        docker compose down -v --rmi all --remove-orphans; \
    else \
        docker compose down; \
    fi


##################################################
############     Laravel commands     ############
##################################################

php arg1 arg2='' arg3='' arg4='' arg5='':
    docker exec -it chess_laravel_workspace php {{ arg1 }} {{ arg2 }} {{ arg3 }} {{ arg4 }} {{ arg5 }}

# alias for php
p arg1 arg2='' arg3='' arg4='' arg5='':
    just php {{ arg1 }} {{ arg2 }} {{ arg3 }} {{ arg4 }} {{ arg5 }}

artisan arg1 arg2='' arg3='' arg4='' arg5='':
    docker exec -it chess_laravel_workspace php artisan {{ arg1 }} {{ arg2 }} {{ arg3 }} {{ arg4 }} {{ arg5 }}

# alias for artisan
a arg1 arg2='' arg3='' arg4='' arg5='':
    just artisan {{ arg1 }} {{ arg2 }} {{ arg3 }} {{ arg4 }} {{ arg5 }}

composer arg1 arg2='' arg3='' arg4='' arg5='':
    docker exec -it chess_laravel_workspace composer {{ arg1 }} {{ arg2 }}

# alias for composer
c arg1 arg2='' arg3='' arg4='' arg5='':
    just composer {{ arg1 }} {{ arg2 }} {{ arg3 }} {{ arg4 }} {{ arg5 }}


