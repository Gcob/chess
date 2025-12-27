<?php

namespace App\Domain\Chess;

use Spatie\LaravelData\Data;

class Square extends Data
{
    public function __construct(
        public readonly string $file, // 'a' through 'h'
        public readonly int    $rank,    // 1 through 8
        public ?string         $piece = null, // Pour l'instant null, plus tard un objet Piece
    )
    {
    }

    /**
     * Détermine si la case est "sombre" (Dark) ou "claire" (Light).
     * En échecs, a1 est noire.
     */
    public function isDark(): bool
    {
        $fileIndex = ord($this->file) - ord('a') + 1;
        // Si la somme (index colonne + rangée) est paire, c'est une case foncée (a1 = 1+1=2 -> foncée)
        return ($fileIndex + $this->rank) % 2 === 0;
    }

    /**
     * Retourne la représentation visuelle de la case.
     */
    public function render(): string
    {
        // Codes ANSI pour les couleurs de fond
        // \033[0m = Reset couleur
        // fond blanc est transparent, et noir est parfaitement noir
        $bgColor = $this->isDark() ? "\033[48;5;58m" : "\033[48;5;230m"; // Dark brown and light beige
        $fgColor = $this->isDark() ? "\033[38;5;230m" : "\033[38;5;58m"; // Contrasting text colors
        $bgColor .= $fgColor;
        $reset = "\033[0m";

        // On ajoute des espaces autour pour que la case paraisse carrée dans le terminal
        $content = $this->piece ?? ' ';

        // Astuce : " $content " permet d'élargir la case car les terminaux sont plus hauts que larges
        return "{$bgColor} {$content} {$reset}"; // Espaces pour élargir la case
    }
}
