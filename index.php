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
</head>
<body>
<section class="main">
    <div class="container">
        <h1>Chess</h1>
        <div class="row">
            <div class="col-lg-8 board-container">
                <h3>Board</h3>
                <div class="board"></div>
            </div>
            <div class="col-lg-4 info-container">
                <h3>Infos</h3>
            </div>
        </div>
    </div>
</section>
<?php Webpack::echo_entry_assets("app"); ?>
</body>
</html>