<?php

namespace App\Console\Commands;

use App\Domain\Chess\Game;
use App\Domain\Chess\Player;
use Illuminate\Console\Command;

class Play extends Command
{
    protected $signature = 'play';
    protected $description = 'Command description';
    protected Game $game;


    public function handle()
    {
        $this->game = Game::init();

        return 0;
    }
}
