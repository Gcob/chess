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
        try {
            $this->game = Game::init();
            $this->game->start();

            // wait 1.25 seconds
            usleep(1250000);

            $this->game->stop();


            dd($this->game->player1->stopwatch->getCurrentSecondsLeft());

        } catch (\Exception $e) {
            $this->warn($e->getMessage() . "\n" . $e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}
