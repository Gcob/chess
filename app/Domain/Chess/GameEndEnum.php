<?php

namespace App\Domain\Chess;

enum GameEndEnum: string
{
    case CHECKMATE = 'checkmate';
    case STALEMATE = 'stalemate';
    case TIMEOUT = 'timeout';
    case RESIGNATION = 'resignation';
    case AGREED_DRAW = 'agreed_draw';
}
