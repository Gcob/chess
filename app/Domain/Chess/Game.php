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

    public static function init(): self
    {
        $game = new self();

        $game->state = new GameState();
        $game->player1 = Player::from(['name' => 'Player 1', 'color' => 'white', 'stopwatch' => new Stopwatch(secondsLeft: $game->state->initialStopwatchSeconds)]);
        $game->player2 = Player::from(['name' => 'Player 2', 'color' => 'black', 'stopwatch' => new Stopwatch(secondsLeft: $game->state->initialStopwatchSeconds)]);

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
        // Configurer le terminal : non-bloquant et sans écho automatique (on gère l'affichage nous-mêmes)
        stream_set_blocking(STDIN, false);
        system("stty -icanon -echo"); // Désactive le mode canonique et l'écho système (Linux/Mac)

        $move = '';
        $inputBuffer = '';
        $isFirstRender = true;

        // Clear screen
        echo "\033[2J\033[H";

        while (true) {
            // 1. GESTION DE L'AFFICHAGE
            // On remonte le curseur de 3 lignes (P1 + P2 + Prompt) pour réécrire par-dessus
            // \033[3A = Monter 3 lignes
            // \r = Retour au début de la ligne
            echo "\033[3A\r";

            // Ligne Joueur 1 (avec \033[2K pour effacer proprement la ligne avant d'écrire)
            echo "\033[2K" . sprintf(
                    "%s: %s %s\n",
                    $this->player1->name, // Assure-toi d'afficher le nom
                    $this->formatTime($this->player1->stopwatch->getCurrentSecondsLeft()),
                    $this->player1 === $this->currentPlayer ? '← Your turn' : ''
                );

            // Ligne Joueur 2
            echo "\033[2K" . sprintf(
                    "%s: %s %s\n",
                    $this->player2->name,
                    $this->formatTime($this->player2->stopwatch->getCurrentSecondsLeft()),
                    $this->player2 === $this->currentPlayer ? '← Your turn' : ''
                );

            // Ligne Prompt + Buffer actuel
            echo "\033[2K" . "Enter your move (e.g., e4): " . $inputBuffer;

            // 2. LOGIQUE DE TEMPS
            if ($this->currentPlayer->stopwatch->hasExpired()) {
                echo "\n⏱️  TIME'S UP! {$this->currentPlayer->name} loses on time.\n";
                $this->state->endedBy = GameEndEnum::TIMEOUT;
                break;
            }

            // 3. LECTURE DE L'ENTRÉE (Non-bloquante)
            $input = fread(STDIN, 1); // On lit caractère par caractère pour mieux gérer

            if ($input !== false && $input !== '') {
                $ord = ord($input);

                if ($ord === 10) { // Touche ENTRÉE (\n)
                    $move = trim($inputBuffer);
                    if (!empty($move)) {
                        break;
                    }
                } elseif ($ord === 127 || $ord === 8) { // Touche BACKSPACE
                    if (strlen($inputBuffer) > 0) {
                        $inputBuffer = substr($inputBuffer, 0, -1);
                    }
                } else {
                    // Ajout du caractère au buffer
                    $inputBuffer .= $input;
                }
            }

            // Petite pause pour ne pas surcharger le CPU (100ms suffit largement pour l'oeil humain)
            usleep(100000);
        }

        // Restauration du terminal
        system("stty sane"); // Remet le terminal en état normal
        stream_set_blocking(STDIN, true);
        echo "\n"; // Saut de ligne final pour la propreté

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
