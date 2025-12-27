# =========================================================================
# BASE (PHP + Extensions Communes)
# =========================================================================
FROM php:8.4-fpm AS base

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    zip \
    unzip \
    libzip5 \
    libpq5 \
    libicu-dev \
    libzip-dev \
    libpq-dev \
    libbrotli-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && docker-php-ext-install -j$(nproc) pcntl zip pdo pdo_pgsql intl gd \
    && apt-get purge -y --auto-remove libzip-dev libpq-dev libbrotli-dev libpng-dev libjpeg-dev libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# =========================================================================
# SERVER (Production PHP-FPM)
# =========================================================================
FROM base AS server

ENV BLUEPRINT_ROLE=server

EXPOSE 9000

CMD ["php-fpm", "-F"]


# =========================================================================
# WORKSPACE (Développement & Outils)
# =========================================================================
FROM base AS workspace

ARG UID=1000
ARG GID=1000

ENV BLUEPRINT_ROLE=worker
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
    gosu \
    bash \
    wget \
    nano \
    less \
    htop \
    lsof \
    iputils-ping \
    net-tools \
    tzdata \
    build-essential \
    fontconfig \
    procps \
    dnsutils \
    postgresql-client \
    locales \
    rsync \
    && sed -i 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && locale-gen en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

# Créer l'utilisateur 'devuser'
RUN if getent group ${GID} >/dev/null 2>&1; then \
        existing_group=$(getent group ${GID} | cut -d: -f1); \
        if [ "$existing_group" != "devuser" ]; then \
            groupmod -n devuser $existing_group; \
        fi; \
    else \
        groupadd -g ${GID} devuser; \
    fi

# Si l'UID existe déjà, on le renomme, sinon on crée l'utilisateur
RUN if getent passwd ${UID} >/dev/null 2>&1; then \
        existing_user=$(getent passwd ${UID} | cut -d: -f1); \
        usermod -l devuser -d /home/devuser -m -g ${GID} $existing_user; \
    else \
        useradd -u ${UID} -g ${GID} -m -s /bin/bash devuser; \
    fi

RUN mkdir -p /home/devuser && chown -R ${UID}:${GID} /home/devuser

# Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
ENV HOME=/home/devuser
ENV PATH="$HOME/.composer/vendor/bin:$PATH"

# Prompt customization
COPY ./ps1.sh /home/devuser/.ps1.sh

# Le .bashrc est lu par les shells interactifs non-login (ce qu'utilise 'docker exec')
RUN bash -c "echo -e '\n# Load custom prompt\nif [ -f \"\$HOME/.ps1.sh\" ]; then\n    source \"\$HOME/.ps1.sh\"\nfi' >> /home/devuser/.bashrc"

# S'assurer que TOUS les fichiers dans /home/devuser appartiennent à devuser
RUN chown -R devuser:devuser /home/devuser

# Passer en utilisateur 'devuser'
USER devuser

# Utiliser bash comme shell par défaut
SHELL ["/bin/bash", "-c"]

# Par défaut, rester en vie sans rien faire
CMD ["tail", "-f", "/dev/null"]
