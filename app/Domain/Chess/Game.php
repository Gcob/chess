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
        $this->player1->stopwatch->start();
    }

    public function stop()
    {
        $this->player1->stopwatch->stop();
    }
}
