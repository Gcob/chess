<?php

namespace App\Domain\Chess;

use Spatie\LaravelData\Data;

class Player extends Data
{
    public function __construct(
        public readonly string    $name,
        public readonly string    $color,
        public readonly Stopwatch $stopwatch,
        public readonly ?int      $elo = null,
        public readonly ?string   $image = null,
    )
    {
    }

    public function __toString(): string
    {
        return $this->name . ' (' . $this->color . ')';
    }

    public function isTurn():bool
    {
        return $this->stopwatch->isRunningSince !== null;
    }
}
