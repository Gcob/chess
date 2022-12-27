FROM php:8.2.1RC1-apache

COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/local-config.ini /usr/local/etc/php/conf.d/local-config.ini
COPY docker/xdebug.ini /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# Load dependencies first
RUN apt-get update \
    && apt-get install -y \
        libpng-dev \
        zlib1g-dev \
        git \
        zip \
        unzip \
        curl \
        zlib1g-dev \
        libzip-dev \
        mariadb-server \
        nano \
        iputils-ping \
    && a2enmod rewrite  \
    && a2enmod ssl \
    && a2enmod socache_shmcb \
    && a2enmod proxy_http \
    && docker-php-ext-install mysqli pdo pdo_mysql zip opcache gd \
    && apt-get clean -y

# install xdebug
RUN pecl install xdebug && docker-php-ext-enable xdebug

# composer https://getcomposer.org/download/
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
RUN php composer-setup.php
RUN php -r "unlink('composer-setup.php');"
RUN mv composer.phar /usr/local/bin/composer
RUN update-ca-certificates

# nvm https://gist.github.com/d2s/372b5943bce17b964a79
ENV NVM_DIR /root/.nvm
ENV NODE_LTS 16.16.0
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | bash \
    && . $NVM_DIR/nvm.sh\
    && nvm install $NODE_LTS \
    && npm install --global yarn\

