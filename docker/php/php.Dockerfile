FROM php:8.4-cli AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    # runtime dependencies
    curl \
    ca-certificates \
    git \
    gosu \
    zip \
    unzip \
    # compilation dependencies (will be removed later)
    libzip-dev \
    libpq-dev \
    libicu-dev \
    libbrotli-dev \
    # PHP extensions installation
    && docker-php-ext-install -j$(nproc) zip pdo pdo_pgsql intl \
    && pecl install swoole \
    && docker-php-ext-enable swoole \
    # Final cleanup
    && apt-get purge -y --auto-remove libzip-dev libpq-dev libicu-dev libbrotli-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html


FROM base AS server

RUN groupadd --system --gid 1001 laravel && \
    useradd --system --uid 1001 --gid laravel laravel

USER laravel

CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=80"]


FROM base AS worker

ARG UID=1000
ARG GID=1000

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configure git to avoid permission issues
RUN git config --global --add safe.directory /var/www/html

# Create a mimic user to avoid permission issues
RUN groupadd -g ${GID} --non-unique you && \
    useradd -u ${UID} -g you --non-unique --create-home you

USER you

CMD ["tail", "-f", "/dev/null"]