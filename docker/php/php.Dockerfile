FROM php:8.4-cli AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    # Runtime dependencies
    curl \
    ca-certificates \
    git \
    gosu \
    zip \
    unzip \
    libzip5 \
    libpq5 \
    libicu-dev \
    && apt-get install -y --no-install-recommends \
    # Build dependencies
    libzip-dev \
    libpq-dev \
    libbrotli-dev \
    # Build
    && docker-php-ext-install -j$(nproc) pcntl zip pdo pdo_pgsql intl \
    && pecl install swoole \
    && docker-php-ext-enable swoole \
    # Cleanup tools only
    && apt-get purge -y --auto-remove libzip-dev libpq-dev libbrotli-dev \
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
ENV PATH="$HOME/.composer/vendor/bin:$PATH"
RUN git config --global --add safe.directory /var/www/html

# Entrypoint
COPY entrypoint.worker.sh /usr/local/bin/entrypoint.worker.sh
RUN chmod +x /usr/local/bin/entrypoint.worker.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.worker.sh"]

# Create a mimic user to avoid permission issues
RUN groupadd -g ${GID} --non-unique worker && \
    useradd -u ${UID} -g worker --non-unique --create-home worker

#USER worker

CMD ["tail", "-f", "/dev/null"]