<?php

namespace App\Console\Commands;

use App\Domain\Chess\Player;
use Illuminate\Console\Command;

class Play extends Command
{
    protected $signature = 'play';
    protected $description = 'Command description';

    protected Player $player1;
    protected Player $player2;

    public function handle()
    {
        $this->init();

        return 0;
    }

    public function init(): void
    {
        $this->player1 = app(Player::class, ['name' => 'Player 1', 'color' => 'white']);
        $this->player2 = app(Player::class, ['name' => 'Player 2', 'color' => 'black']);
    }
}
