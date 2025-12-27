<?php

namespace App\Domain\Chess;

use Illuminate\Support\Carbon;
use Spatie\LaravelData\Data;

class GameState extends Data
{
    public function __construct(
        public int          $initialStopwatchSeconds = 60 * 5,
        public int          $timeIncrement = 0,
        public ?Carbon      $hasStartedAt = null,
        public ?Carbon      $hasFinishedAt = null,
        public ?GameEndEnum $endedBy = null,
    )
    {
    }
}
