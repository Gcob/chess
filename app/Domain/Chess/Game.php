<?php

namespace App\Domain\Chess;

use App\Domain\Chess\Factories\StopwatchFactory;
use Illuminate\Support\Carbon;
use Spatie\LaravelData\Data;

class Game extends Data
{
    public readonly GameState $state;
    public readonly Player $player1;
    public readonly Player $player2;
    protected ?Player $currentPlayer = null;
    protected Board $board;

    public static function init(): self
    {
        $game = new self();

        $game->state = new GameState();
        $game->player1 = Player::from(['name' => 'Player 1', 'color' => 'white', 'stopwatch' => new Stopwatch(secondsLeft: $game->state->initialStopwatchSeconds)]);
        $game->player2 = Player::from(['name' => 'Player 2', 'color' => 'black', 'stopwatch' => new Stopwatch(secondsLeft: $game->state->initialStopwatchSeconds)]);
        $game->board = Board::init();

        $game->board->placePiece('a2', '♙'); // Pion blanc
        $game->board->placePiece('b2', '♙');
        $game->board->placePiece('c2', '♙');
        $game->board->placePiece('d2', '♙');
        $game->board->placePiece('e2', '♙');
        $game->board->placePiece('f2', '♙');
        $game->board->placePiece('g2', '♙');
        $game->board->placePiece('h2', '♙');
        $game->board->placePiece('a7', '♟'); // Pion noir
        $game->board->placePiece('b7', '♟');
        $game->board->placePiece('c7', '♟');
        $game->board->placePiece('d7', '♟');
        $game->board->placePiece('e7', '♟');
        $game->board->placePiece('f7', '♟');
        $game->board->placePiece('g7', '♟');
        $game->board->placePiece('h7', '♟');
        $game->board->placePiece('a1', '♖'); // Tour blanche
        $game->board->placePiece('h1', '♖');
        $game->board->placePiece('a8', '♜'); // Tour noire
        $game->board->placePiece('h8', '♜');
        $game->board->placePiece('b1', '♘'); // Cavalier blanc
        $game->board->placePiece('g1', '♘');
        $game->board->placePiece('b8', '♞'); // Cavalier noir
        $game->board->placePiece('g8', '♞');
        $game->board->placePiece('c1', '♗'); // Fou blanc
        $game->board->placePiece('f1', '♗');
        $game->board->placePiece('c8', '♝'); // Fou noir
        $game->board->placePiece('f8', '♝');
        $game->board->placePiece('d1', '♕'); // Reine blanche
        $game->board->placePiece('d8', '♛'); // Reine noire
        $game->board->placePiece('e1', '♔'); // Roi blanc
        $game->board->placePiece('e8', '♚'); // Roi noir



        return $game;
    }

    public function start(): void
    {
        $this->setTurn($this->player1);
    }

    protected function setTurn(Player $player): void
    {
        $this->currentPlayer = $player;

        $player->stopwatch->start();
        $move = $this->displayTimerAndWaitForMove();
        $player->stopwatch->stop();

        while (!$this->state->endedBy && !$this->isValidMove($move)) {
            echo "\n❌ Invalid move. Please try again.\n";
            sleep(1);
            $player->stopwatch->start();
            $move = $this->displayTimerAndWaitForMove();
            $player->stopwatch->stop();
        }

        if ($this->state->endedBy) {
            return;
        }

        // Process move (to be implemented later)
        echo "\n✅ Move played: {$move}\n";
        sleep(1);

        // Switch to other player
        $nextPlayer = $player === $this->player1 ? $this->player2 : $this->player1;
        $this->setTurn($nextPlayer);
    }

    protected function displayTimerAndWaitForMove(): string
    {
        stream_set_blocking(STDIN, false);
        // On supprime les erreurs potentielles de stty sur Windows avec @
        @system("stty -icanon -echo");

        $move = '';
        $inputBuffer = '';

        // 1. DESSIN STATIQUE (Une seule fois)
        echo "\033[2J\033[H"; // Efface tout
        $this->board->draw(); // Dessine le plateau
        echo "\n";            // Petite marge

        // 2. POSE DU "MARQUEUR" (Save Cursor Position)
        // \0337 sauvegarde la position exacte du curseur sous le plateau
        echo "\0337";

        while (true) {
            // 3. RETOUR AU MARQUEUR (Restore Cursor Position)
            // \0338 ramène le curseur exactement là où on a fait \0337
            echo "\0338";

            // Ligne Joueur 1
            // \033[K efface le reste de la ligne (au cas où le texte précédent était plus long)
            echo sprintf(
                "%s: %s %s\033[K\n",
                $this->player1->name,
                $this->formatTime($this->player1->stopwatch->getCurrentSecondsLeft()),
                $this->player1 === $this->currentPlayer ? '← Your turn' : ''
            );

            // Ligne Joueur 2
            echo sprintf(
                "%s: %s %s\033[K\n",
                $this->player2->name,
                $this->formatTime($this->player2->stopwatch->getCurrentSecondsLeft()),
                $this->player2 === $this->currentPlayer ? '← Your turn' : ''
            );

            // Ligne Prompt
            echo "Enter move: \033[33m" . $inputBuffer . "\033[0m\033[K";

            // --- LOGIQUE IDENTIQUE ---

            if ($this->currentPlayer->stopwatch->hasExpired()) {
                echo "\n\n⏱️  TIME'S UP! {$this->currentPlayer->name} loses on time.\n";
                $this->state->endedBy = GameEndEnum::TIMEOUT;
                break;
            }

            $input = fread(STDIN, 1);

            if ($input !== false && $input !== '') {
                $ord = ord($input);

                if ($ord === 10) { // Enter
                    $move = trim($inputBuffer);
                    if (!empty($move)) break;
                } elseif ($ord === 127 || $ord === 8) { // Backspace
                    if (strlen($inputBuffer) > 0) {
                        $inputBuffer = substr($inputBuffer, 0, -1);
                    }
                } else {
                    $inputBuffer .= $input;
                }
            }

            usleep(100000); // 100ms
        }

        @system("stty sane");
        stream_set_blocking(STDIN, true);
        echo "\n";

        return $move;
    }

    protected function formatTime(float $seconds): string
    {
        $totalSeconds = (int)$seconds;
        $minutes = floor($totalSeconds / 60);
        $secs = $totalSeconds % 60;

        return sprintf('%d:%02d', $minutes, $secs);
    }

    protected function isValidMove(string $move): bool
    {
        // todo
        return true;
    }
}
