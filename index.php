<?php

use ChessApp\services\Webpack;

// This loads composer for vendors and namespaces
require __DIR__ . "/vendor/autoload.php"
?>

<!doctype html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <title>Chess</title>
    <?php Webpack::echo_entry_assets("app"); ?>
</head>
<body>
<div class="container">
    Hello chess
</div>
</body>
</html>