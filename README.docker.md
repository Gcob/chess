# Laravel

Projet Laravel utilisé dans un environnement Docker avec les services suivants :

- nginx : reçoit toutes les requêtes http. Agit comme gateway.
- laravel_server : traite les requêtes http principales via PHP-FPM.
- laravel_workspace : ne traite pas les requêtes http. Sert d'environnement de développement et de boîte à outils.
- laravel_horizon : traite les jobs en arrière-plan via Laravel Horizon.
- postgres : base de données.
- redis : cache, sessions et queues.

## Installation

Ce script est "zéro-configuration". Il lit ses paramètres depuis le fichier .env.docker-setup.

```bash
chmod +x docker-setup.sh 
sudo ./docker-setup.sh
```

## Nettoyage

Utilisez l'option --clean pour arrêter les conteneurs et détruire les volumes Docker (données de la base de données et de Redis).
C'est utile si vous souhaitez repartir d'une installation totalement propre.

```bash
sudo ./docker-setup.sh --clean
```

## Prochaines étapes (Add-ons)

Pour garantir une installation initiale simple et rapide, 
les services additionnels comme Horizon sont commentés par défaut dans docker-compose.yml.

Une fois que votre application Laravel de base fonctionne :

1. Activez le service :
Ouvrez docker-compose.yml et décommentez le service ..._laravel_horizon.

1. Redémarrez Docker Compose :
Arrêtez vos conteneurs actuels et redémarrez-les en incluant le nouveau service.

```bash
# Arrêter les services en cours
docker compose --env-file .env.docker down

# Reconstruire (si nécessaire) et démarrer tous les services, y compris Horizon
docker compose --env-file .env.docker up -d --build
```

1. Vérifiez :
Vous devriez pouvoir accéder à votre tableau de bord Horizon à l'adresse /horizon.

## Détails des containers

###  Ajout d'un container “workspace”

Il sert de boîte à outils de développement, séparée du container “server”.
Il ne gère pas de requêtes HTTP.

✅ Objectifs du container :

* **Dev local** : Fournir un environnement isolé pour exécuter du code PHP/Laravel/Node en ligne de commande
* **Outils & maintenance** : Contient des utilitaires (composer, node, npm, artisan, git, curl, etc.) pour le développement et la maintenance
* **Interaction CLI** : Permet de lancer des commandes artisan, composer, npm/yarn, tests, migrations, tinker…
* **Pas de serveur web** : Ne sert pas le trafic HTTP, donc aucun PHP-FPM ni service réseau exposé
* **Sandbox pour exécution** : Espace contrôlé pour exécuter scripts, jobs, tests, builds, etc.

### Remplacement de MariaDB par PostgreSQL

On utilise PostgreSQL dans ce blueprint, car il est souvent préféré pour les applications Laravel plus complexes.
Voici un tableau comparatif entre PostgreSQL et MySQL/MariaDB :

| Fonctionnalité         | PostgreSQL                                                                                            | MySQL / MariaDB                                                                          |
|------------------------|-------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| Philosophie            | Priorise la robustesse, l'intégrité des données et la conformité aux standards SQL.                   | Priorise la rapidité (surtout en lecture) et la simplicité d'utilisation.                |
| Support JSON 🗂️       | Type JSONB (binaire). Extrêmement rapide en lecture et indexable sur les clés internes.               | Type JSON (texte). Moins performant pour les requêtes complexes sur le JSON.             |
| Concurrence (Locks) 🚦 | MVCC pur : les lecteurs ne bloquent jamais les scripteurs (et vice-versa).                            | MVCC (InnoDB) : Gestion des verrous (locks) historiquement plus agressive.               |
| Extensibilité 🧩       | Très extensible. Système de "plugins" puissant (ex: PostGIS pour le géo, pg_trgm pour la recherche).  | Plus limité. Pas d'équivalent direct pour des extensions aussi intégrées que PostGIS.    |
| Types de Données       | Très riche et strict. Supporte les Array (tableaux), UUID natifs, INET (IP), etc.                     | Plus standard et permissif. A rattrapé son retard (supporte JSON et UUID).               |
| Requêtes Complexes 📊  | Historiquement la référence pour les Window Functions et les CTEs (récursives ou non).                | Bon support aujourd'hui, mais Postgres est souvent plus optimisé pour l'analytique.      |
| Écosystème 🌍          | En forte croissance, "chouchou" des startups, du monde SaaS et des applications complexes.            | Le plus populaire au monde. Standard de l'hébergement web (LAMP) et des CMS (WordPress). |
| Cas d'usage idéal      | 🎯 Applications critiques (finance), SaaS, données géospatiales, analytique, forte charge d'écriture. | ⚡️ Blogs, CMS, sites e-commerce, applications simples à forte charge de lecture.         |

