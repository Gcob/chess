<?php

namespace App\Domain\Chess;

use Illuminate\Support\Carbon;

class Game
{
    // state
    protected int $initialTime = 60 * 5;
    protected int $timeIncrement = 0;
    protected ?Carbon $hasStartedAt = null;
    protected ?Carbon $hasFinishedAt = null;
    protected ?GameEndEnum $endedBy = null;


    // components
    protected Player $player1;
    protected Player $player2;

    public static function init(): self
    {
        $game = new self();

        $game->player1 = app(Player::class, ['name' => 'Player 1', 'color' => 'white']);
        $game->player2 = app(Player::class, ['name' => 'Player 2', 'color' => 'black']);

        return $game;
    }
}
