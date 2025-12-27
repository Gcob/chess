#!/bin/bash
set -e

#################################################################################
#######################         Configuration         ###########################
#################################################################################
# ℹ️ Ce script lit sa configuration depuis '.env.docker-setup'

# --- Fichiers ---
HOSTS_FILE="/etc/hosts"
# Fichier .env pour docker-compose (généré, non gitté)
ENV_FILE=".env.docker"
# Fichier de configuration principal (doit être gitté)
SETUP_ENV_FILE=".env.docker-setup"
LOCAL_IP_ADDRESS="127.0.0.1"
APP_ENV_DEFAULT="local"

# --- Fichiers Stub ---
COMPOSE_FILE="docker-compose.yml"
COMPOSE_STUB_FILE="docker-compose.stub.yml"
NGINX_CONF_DIR="docker/nginx"
NGINX_FILE="${NGINX_CONF_DIR}/nginx.conf"
NGINX_STUB_FILE="${NGINX_CONF_DIR}/nginx.stub.conf"
STUB_TOKEN="__PROJECT_PREFIX_TOKEN__" # Token à remplacer dans les stubs

# Variables globales qui seront définies par load_setup_config()
PROJECT_PREFIX=""
PORT_PREFIX="" # Ex: "32"
DOMAINS_TO_CHECK=()


#################################################################################
#######################        Helpers & Logs         ###########################
#################################################################################

# Couleurs
BLUE='\033[1;34m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
NC='\033[0m'

log()  { echo -e "${BLUE}[SETUP]${NC} $*"; }
ok()   { echo -e "${GREEN}✔${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
err()  { echo -e "${RED}✖${NC} $*"; }

#################################################################################
#######################       Fonctions de Base       ###########################
#################################################################################

##
# Vérifie si le script est bien lancé avec les privilèges root (sudo).
##
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        err "Ce script doit être exécuté avec les privilèges root."
        echo "Veuillez réessayer avec : sudo $0" >&2
        exit 1
    fi
    ok "Privilèges root vérifiés."
}

##
# Vérifie la présence d'openssl pour la génération de mot de passe.
##
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        err "'openssl' est requis pour générer les mots de passe."
        echo "Veuillez l'installer (ex: 'apt install openssl' ou 'brew install openssl') et réessayer." >&2
        exit 1
    fi
    ok "Dépendance 'openssl' vérifiée."
}

##
# Gère les fichiers stubs (compose et nginx)
##
manage_stub_files() {
    log "Vérification des fichiers de configuration .stub..."

    # --- 1. docker-compose.yml ---
    if [ ! -f "${COMPOSE_FILE}" ]; then
        log "${COMPOSE_FILE} non trouvé."
        if [ ! -f "${COMPOSE_STUB_FILE}" ]; then
            err "ACTION REQUISE: ${COMPOSE_STUB_FILE} non trouvé. Impossible de continuer."
            exit 1
        fi

        log "Génération de ${COMPOSE_FILE} à partir de ${COMPOSE_STUB_FILE}..."
        cp "${COMPOSE_STUB_FILE}" "${COMPOSE_FILE}"
        sed -i.bak "s/${STUB_TOKEN}/${PROJECT_PREFIX}/g" "${COMPOSE_FILE}"
        rm -f "${COMPOSE_FILE}.bak"

        # Redonne la propriété du fichier généré à l'utilisateur sudo
        if [ -n "${SUDO_UID}" ]; then
            chown "${SUDO_UID}:${SUDO_GID}" "${COMPOSE_FILE}"
            ok "Propriété de ${COMPOSE_FILE} ré-assignée à l'utilisateur ${SUDO_USER}."
        fi

        log "Auto-destruction de ${COMPOSE_STUB_FILE}..."
        rm "${COMPOSE_STUB_FILE}"
        ok "${COMPOSE_FILE} généré et stub supprimé."
    else
        ok "${COMPOSE_FILE} existe déjà. Ignoré."
    fi

    # --- 2. docker/nginx/nginx.conf ---
    if [ ! -f "${NGINX_FILE}" ]; then
        log "${NGINX_FILE} non trouvé."
        if [ ! -f "${NGINX_STUB_FILE}" ]; then
            warn "Attention: ${NGINX_STUB_FILE} non trouvé. Nginx pourrait ne pas démarrer."
            return
        fi

        log "Génération de ${NGINX_FILE} à partir de ${NGINX_STUB_FILE}..."
        mkdir -p "${NGINX_CONF_DIR}"
        cp "${NGINX_STUB_FILE}" "${NGINX_FILE}"
        sed -i.bak "s/${STUB_TOKEN}/${PROJECT_PREFIX}/g" "${NGINX_FILE}"
        rm -f "${NGINX_FILE}.bak"

        # Redonne la propriété du fichier généré à l'utilisateur sudo
        if [ -n "${SUDO_UID}" ]; then
            chown "${SUDO_UID}:${SUDO_GID}" "${NGINX_FILE}"
            ok "Propriété de ${NGINX_FILE} ré-assignée à l'utilisateur ${SUDO_USER}."
        fi

        log "Auto-destruction de ${NGINX_STUB_FILE}..."
        rm "${NGINX_STUB_FILE}"
        ok "${NGINX_FILE} généré et stub supprimé."
    else
        ok "${NGINX_FILE} existe déjà. Ignoré."
    fi
}

##
# (Helper pour manage_env_file) Ajoute ou met à jour une variable dans .env.docker
##
update_env_var() {
    local key=$1
    local value=$2

    # Échapper la valeur pour sed (barres obliques, etc.)
    local sed_value=$(printf '%s\n' "$value" | sed -e 's/[\/&]/\\&/g')

    if grep -q -E "^${key}=" "${ENV_FILE}"; then
        # Clé existe, la mettre à jour
        sed -i.bak "s|^${key}=.*|${key}=${sed_value}|" "${ENV_FILE}"
    else
        # Clé n'existe pas, l'ajouter
        echo "${key}=${value}" >> "${ENV_FILE}"
    fi
}

##
# Crée et gère le fichier .env.docker de l'HÔTE (pour docker-compose).
##
manage_env_file() {
    log "Gestion du fichier ${ENV_FILE} (pour Docker Compose)..."
    touch "${ENV_FILE}"

    local redis_pass=$(openssl rand -base64 12)
    local db_pass=$(openssl rand -base64 12)

    # --- Étape A: En-tête (une seule fois) ---
    grep -q -F "# Fichier généré par le script docker-setup.sh" "${ENV_FILE}" || echo "# Fichier généré par le script docker-setup.sh" >> "${ENV_FILE}"
    grep -q -F "# --- DOCKER COMPOSE ENV ---" "${ENV_FILE}" || echo -e "\n# --- DOCKER COMPOSE ENV ---" >> "${ENV_FILE}"

    # --- Étape B: Préfixes et Ports (Toujours à jour) ---
    update_env_var "DOCKER_PROJECT_PREFIX" "${PROJECT_PREFIX}"
    update_env_var "DOCKER_PORT_PREFIX" "${PORT_PREFIX}"
    update_env_var "DOCKER_NGINX_PORT" "${PORT_PREFIX}80"
    update_env_var "DOCKER_REDIS_PORT" "${PORT_PREFIX}79"
    update_env_var "DOCKER_DB_PORT" "${PORT_PREFIX}32"

    # --- Étape C: Variables par défaut (Ajoutées si manquantes) ---
    grep -q -E "^DOCKER_APP_ENV=" "${ENV_FILE}" || echo "DOCKER_APP_ENV=${APP_ENV_DEFAULT}" >> "${ENV_FILE}"
    grep -q -E "^DOCKER_REDIS_PASSWORD=" "${ENV_FILE}" || echo "DOCKER_REDIS_PASSWORD=${redis_pass}" >> "${ENV_FILE}"
    grep -q -E "^DOCKER_DB_DATABASE=" "${ENV_FILE}" || echo "DOCKER_DB_DATABASE=laravel" >> "${ENV_FILE}"
    grep -q -E "^DOCKER_DB_USERNAME=" "${ENV_FILE}" || echo "DOCKER_DB_USERNAME=laravel" >> "${ENV_FILE}"
    grep -q -E "^DOCKER_DB_PASSWORD=" "${ENV_FILE}" || echo "DOCKER_DB_PASSWORD=${db_pass}" >> "${ENV_FILE}"

    grep -q -F "# --- PERMISSIONS WORKER ---" "${ENV_FILE}" || echo -e "\n# --- PERMISSIONS WORKER ---" >> "${ENV_FILE}"
    ok "Variables de service (DOCKER_*) vérifiées/ajoutées."

    # --- Étape D: UID/GID (Toujours à jour) ---
    local uid_to_use=${SUDO_UID:-$(id -u)}
    local gid_to_use=${SUDO_GID:-$(id -g)}
    update_env_var "DOCKER_UID" "${uid_to_use}"
    update_env_var "DOCKER_GID" "${gid_to_use}"
    rm -f "${ENV_FILE}.bak"
    ok "UID/GID mis à jour (DOCKER_UID=${uid_to_use}, DOCKER_GID=${gid_to_use})."

    # --- Étape E: Permissions ---
    if [ -n "${SUDO_UID}" ]; then
        chown "${SUDO_UID}:${SUDO_GID}" "${ENV_FILE}"
        ok "Propriété de ${ENV_FILE} ré-assignée à l'utilisateur ${SUDO_USER}."
    fi
}

##
# Vérifie et ajoute une entrée spécifique dans le fichier hosts.
##
update_host_entry() {
    local domain=$1
    local ip=$2
    local script_name=$(basename "$0")

    if grep -q -w "${domain}" "${HOSTS_FILE}"; then
        ok "Le domaine '${domain}' est bien présent dans ${HOSTS_FILE}."
    else
        log "Ajout de '${domain}' à ${HOSTS_FILE}..."
        local line_to_add="\n# Ajouté par le script ${script_name} pour ${PROJECT_PREFIX}\n${ip} ${domain}"

        # Correction du bug: ${HOST_FILE} -> ${HOSTS_FILE}
        if echo -e "${line_to_add}" >> "${HOSTS_FILE}"; then
            ok "L'ajout de '${LOCAL_IP_ADDRESS} ${domain}' à ${HOSTS_FILE} a réussi."
        else
            err "Erreur lors de l'écriture dans ${HOSTS_FILE} pour le domaine '${domain}'."
            exit 1
        fi
    fi
}

##
# Installe un nouveau projet Laravel via Docker.
##
run_new_project_setup_docker() {
    local workspace_container=$1
    local temp_install_dir="laravel-temp-install" # Nom du dossier temporaire

    log "Démarrage des conteneurs Docker (pré-installation)..."
    docker compose --env-file "${ENV_FILE}" up -d --build

    log "Installation de Laravel 12 dans un dossier temporaire (${temp_install_dir})..."

    # 1. Crée le dossier temporaire dans le conteneur
    docker exec "${workspace_container}" mkdir -p ${temp_install_dir}

    # 2. Installe Laravel dans ce dossier
    docker exec "${workspace_container}" composer create-project --prefer-dist laravel/laravel:^12.0 ${temp_install_dir} --no-interaction

    log "Synchronisation des fichiers vers la racine du projet..."
    # 3. Synchronise (copie) tout du dossier temp vers la racine (.), SAUF le .env
    # 'rsync -a' inclut les fichiers cachés. La barre oblique / à la fin de la source est cruciale.
    docker exec "${workspace_container}" rsync -a --exclude='.env' ${temp_install_dir}/ .

    log "Nettoyage du dossier d'installation temporaire..."
    # 4. Supprime le dossier temporaire
    docker exec "${workspace_container}" rm -rf ${temp_install_dir}

    # 5. Continue l'installation à la racine, maintenant que les fichiers y sont
    log "Installation des packages de développement (pint, pest)..."
    docker exec "${workspace_container}" composer require --dev laravel/pint "pestphp/pest:^4.0" "pestphp/pest-plugin-laravel:^4.0" "phpunit/phpunit:^12.0" -W --no-interaction

    log "Installation de Predis et Horizon..."
    docker exec "${workspace_container}" composer require predis/predis laravel/horizon --no-interaction

    log "Configuration de Horizon et Pest..."
    docker exec "${workspace_container}" php artisan horizon:install --no-interaction >/dev/null 2>&1 || true
    docker exec "${workspace_container}" php artisan pest:install --no-interaction >/dev/null 2>&1 || true

    ok "Installation de Laravel 12 terminée."
}


##
# Initialise un projet Laravel existant via Docker.
##
run_existing_project_setup_docker() {
    local workspace_container=$1

    log "Démarrage des conteneurs Docker..."
    docker compose --env-file "${ENV_FILE}" up -d --build

    log "Installation des dépendances Composer (composer install)..."
    docker exec "${workspace_container}" composer install --no-interaction --prefer-dist --optimize-autoloader

    ok "Dépendances du projet existant installées."
}

##
# Synchronise le .env de Laravel (sur l'HÔTE).
##
run_env_sync() {
    local workspace_container=$1
    log "Synchronisation du .env de Laravel..."

    # 1. Copie .env.example si .env manque (sur l'HÔTE)
    log "Vérification de .env (copie depuis .env.example si manquant)..."
    if [[ ! -f .env && -f .env.example ]]; then
        cp .env.example .env
        ok "... .env (Laravel) créé à partir de .env.example."
    else
        ok "... .env (Laravel) déjà présent ou .env.example manquant."
    fi

    # 2. Lire les variables DOCKER_* du .env.docker de l'HÔTE
    log "Lecture des variables depuis ${ENV_FILE} (hôte)..."
    if [ ! -f "${ENV_FILE}" ]; then
        err "Le fichier ${ENV_FILE} n'existe pas. Impossible de synchroniser."
        exit 1
    fi
    # Exporter les variables DOCKER_* dans l'environnement de ce script
    export $(grep -E '^DOCKER_' "${ENV_FILE}" | xargs)

    # 3. Définir les noms de service dynamiques
    local db_host="${DOCKER_PROJECT_PREFIX}_postgres"
    local redis_host="${DOCKER_PROJECT_PREFIX}_redis"
    log "Noms de service dynamiques: DB_HOST=${db_host}, REDIS_HOST=${redis_host}"

    # 4. Appliquer la configuration au .env de Laravel (sur l'HÔTE)
    log "Application des configurations de service (DB, Redis) au .env de Laravel..."
    # MODIFIÉ: Utilise un regex robuste pour gérer les lignes commentées
    sed -i.bak "s|^ *#* *DB_CONNECTION=.*|DB_CONNECTION=pgsql|" .env
    sed -i.bak "s|^ *#* *DB_HOST=.*|DB_HOST=${db_host}|" .env
    sed -i.bak "s|^ *#* *DB_PORT=.*|DB_PORT=5432|" .env
    sed -i.bak "s|^ *#* *REDIS_HOST=.*|REDIS_HOST=${redis_host}|" .env
    sed -i.bak "s|^ *#* *REDIS_CLIENT=.*|REDIS_CLIENT=predis|" .env
    sed -i.bak "s|^ *#* *REDIS_PORT=.*|REDIS_PORT=6379|" .env
    sed -i.bak "s|^ *#* *QUEUE_CONNECTION=.*|QUEUE_CONNECTION=redis|" .env
    sed -i.bak "s|^ *#* *CACHE_STORE=.*|CACHE_STORE=redis|" .env
    sed -i.bak "s|^ *#* *LOG_CHANNEL=.*|LOG_CHANNEL=stderr|" .env

    log "Application des variables dynamiques (passwords, etc.) au .env de Laravel..."
    sed -i.bak "s|^ *#* *APP_ENV=.*|APP_ENV=${DOCKER_APP_ENV}|" .env
    sed -i.bak "s|^ *#* *DB_DATABASE=.*|DB_DATABASE=${DOCKER_DB_DATABASE}|" .env
    sed -i.bak "s|^ *#* *DB_USERNAME=.*|DB_USERNAME=${DOCKER_DB_USERNAME}|" .env
    sed -i.bak "s|^ *#* *DB_PASSWORD=.*|DB_PASSWORD=${DOCKER_DB_PASSWORD}|" .env
    sed -i.bak "s|^ *#* *REDIS_PASSWORD=.*|REDIS_PASSWORD=${DOCKER_REDIS_PASSWORD}|" .env

    rm -f .env.bak

    # 5. Vérifier APP_KEY (sur l'HÔTE)
    log "Vérification de APP_KEY..."

    # Le script root a créé/modifié .env. Il faut le redonner à l'utilisateur sudo
    # AVANT que 'docker exec' (en tant que devuser) n'essaie d'y écrire.
    log "Correction des permissions pour .env (Laravel)..."
    if [ -n "${SUDO_UID}" ]; then
        chown "${SUDO_UID}:${SUDO_GID}" .env
        ok "... Propriété de .env ré-assignée à l'utilisateur ${SUDO_USER}."
    else
        warn "... Impossible de déterminer l'utilisateur sudo. Les permissions de .env pourraient être incorrectes."
    fi

    # 'grep' sur le .env de Laravel
    APP_KEY=$(grep -E '^APP_KEY=' .env | cut -d'=' -f2- || true) # || true pour éviter l'échec si .env est vide
    if [[ -z "$APP_KEY" || "$APP_KEY" == "null" || "$APP_KEY" == "" ]]; then
        log "... APP_KEY manquante. Génération..."
        # Seule cette commande a besoin du conteneur
        docker exec "${workspace_container}" php artisan key:generate --force
        ok "... APP_KEY générée."
    else
        ok "... APP_KEY est déjà définie."
    fi
    ok "Synchronisation de .env (Laravel) terminée."
}

edit_gitignore() {
  log "Vérification de .gitignore"

  if ! grep -qF ".env.docker" .gitignore; then
      echo ".env.docker" >> .gitignore
      ok ".env.docker ajouté au .gitignore."
  else
      ok ".env.docker est déjà dans le .gitignore."
  fi
}

##
# Affiche le message de succès final.
##
show_success_message() {
    local nginx_port=""
    if [ -f "${ENV_FILE}" ]; then
         nginx_port=$(grep -E "^DOCKER_NGINX_PORT=" "${ENV_FILE}" | tail -n 1 | cut -d'=' -f2 | tr -d '[:space:]')
    fi
    nginx_port=${nginx_port:-"${PORT_PREFIX}80"}


    echo ""
    log "🎉 Votre environnement Laravel (${PROJECT_PREFIX}) est prêt!"
    log "Visitez http://${PROJECT_PREFIX}.localhost:${nginx_port} dans votre navigateur."
}

run_clean_volumes() {
    log "Arrêt des conteneurs et suppression des volumes (DB, Redis)..."
    # L'option -v supprime les volumes nommés attachés au projet
    docker compose --env-file "${ENV_FILE}" down -v
    ok "Volumes supprimés. La prochaine exécution sera 'fraîche'."
}

#################################################################################
#######################      Logique de Scénario      ###########################
#################################################################################

##
# NOUVEAU: Lit la configuration depuis .env.docker-setup
##
load_setup_config() {
    log "Lecture de la configuration depuis ${SETUP_ENV_FILE}..."

    if [ ! -f "${SETUP_ENV_FILE}" ]; then
        err "Fichier de configuration '${SETUP_ENV_FILE}' manquant."
        echo "Veuillez créer ce fichier à partir de .env.docker-setup.example"
        exit 1
    fi

    # Exporter les variables du fichier de setup
    export $(grep -E '^DOCKER_PROJECT_PREFIX=|^DOCKER_PORT_PREFIX=' "${SETUP_ENV_FILE}" | xargs)

    # Valider que les variables sont bien chargées
    if [ -z "${DOCKER_PROJECT_PREFIX}" ]; then
        err "DOCKER_PROJECT_PREFIX n'est pas défini dans ${SETUP_ENV_FILE}."
        exit 1
    fi

    if [ -z "${DOCKER_PORT_PREFIX}" ]; then
        err "DOCKER_PORT_PREFIX n'est pas défini dans ${SETUP_ENV_FILE}."
        exit 1
    fi

    # Assigner aux variables globales du script
    PROJECT_PREFIX="${DOCKER_PROJECT_PREFIX}"
    PORT_PREFIX="${DOCKER_PORT_PREFIX}"

    ok "Préfixe projet: ${PROJECT_PREFIX}, Préfixe port: ${PORT_PREFIX}"
}

##
# SCÉNARIO 1: Installation complète d'un nouveau projet.
##
run_full_scenario_1_new_project() {
    log "Démarrage du SCÉNARIO 1: Nouveau Projet."

    # Les variables globales PROJECT_PREFIX et PORT_PREFIX sont déjà définies

    DOMAINS_TO_CHECK=(
        "${PROJECT_PREFIX}.localhost"
    )

    manage_stub_files
    manage_env_file

    for domain in "${DOMAINS_TO_CHECK[@]}"; do
        update_host_entry "${domain}" "${LOCAL_IP_ADDRESS}"
    done

    local workspace_container="${PROJECT_PREFIX}_laravel_workspace"
    run_new_project_setup_docker "${workspace_container}"

    run_env_sync "${workspace_container}"

    log "Lancement de la migration initiale de la base de données..."
    warn "Pause de 5 secondes pour laisser Postgres démarrer..."
    sleep 5
    docker exec "${workspace_container}" php artisan migrate:fresh --seed
    ok "Migration initiale terminée."

    edit_gitignore
}

##
# SCÉNARIO 2: Initialisation d'un projet existant.
##
run_full_scenario_2_existing_project() {
    log "Démarrage du SCÉNARIO 2: Projet Existant."

    # Les variables globales PROJECT_PREFIX et PORT_PREFIX sont déjà définies

    DOMAINS_TO_CHECK=(
        "${PROJECT_PREFIX}.localhost"
    )

    manage_env_file

    for domain in "${DOMAINS_TO_CHECK[@]}"; do
        update_host_entry "${domain}" "${LOCAL_IP_ADDRESS}"
    done

    local workspace_container="${PROJECT_PREFIX}_laravel_workspace"
    run_existing_project_setup_docker "${workspace_container}"

    run_env_sync "${workspace_container}"

    log "Lancement de la migration de la base de données..."
    warn "Pause de 5 secondes pour laisser Postgres démarrer..."
    sleep 5
    docker exec "${workspace_container}" php artisan migrate:fresh --seed
    ok "Migration terminée."

    # ensure the storage and cache directories are writable (sudo chmod -R 777 storage bootstrap/cache)
    log "Vérification des permissions des dossiers storage et bootstrap/cache..."
    docker exec "${workspace_container}" chmod -R 777 storage bootstrap/cache
    ok "Permissions des dossiers storage et bootstrap/cache mises à jour."
}

#################################################################################
#######################          Exécution          #############################
#################################################################################

main() {
    # Charge la configuration (prefix, port) en premier
    load_setup_config

    if [ "$1" == "--clean" ]; then
        run_clean_volumes
        log "Nettoyage terminé."
        exit 0
    fi

    log "Vérification du statut du projet (recherche de 'artisan')..."

    if [ ! -f "artisan" ]; then
        # S1: Nouveau projet
        run_full_scenario_1_new_project
    else
        # S2: Projet existant
        run_full_scenario_2_existing_project
    fi

    show_success_message
}

# --- POINT D'ENTRÉE ---
check_root
check_openssl

main "$@"
