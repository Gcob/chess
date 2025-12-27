<?php

namespace App\Domain\Chess;

class Player
{
    public function __construct(
        public readonly string  $name,
        public readonly string  $color,
        public readonly ?int    $elo = null,
        public readonly ?string $image = null,
    )
    {

    }

    public function __toString(): string
    {
        return $this->name . ' (' . $this->color . ')';
    }
}
