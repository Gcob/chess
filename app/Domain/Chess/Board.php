<?php

namespace App\Domain\Chess;

use Spatie\LaravelData\Data;

class Board extends Data
{
    /** @var array<string, Square> */
    public array $squares = [];

    public static function init(): self
    {
        $board = new self();
        $files = range('a', 'h');
        $ranks = range(1, 8);

        foreach ($ranks as $rank) {
            foreach ($files as $file) {
                // La clé sera 'a1', 'e4', etc. pour un accès facile
                $board->squares["{$file}{$rank}"] = new Square($file, $rank);
            }
        }

        return $board;
    }

    /**
     * Permet de placer une pièce (emoji pour l'instant) pour tester
     */
    public function placePiece(string $coordinate, string $emoji): void
    {
        if (isset($this->squares[$coordinate])) {
            $this->squares[$coordinate]->piece = $emoji;
        }
    }

    public function draw(): void
    {
        $files = range('a', 'h');

        // On dessine de haut en bas (Rangée 8 vers 1)
        for ($rank = 8; $rank >= 1; $rank--) {

            // 1. Affichage du numéro de rangée à gauche + espace
            echo " {$rank} ";

            // 2. Affichage des cases de la rangée
            foreach ($files as $file) {
                echo $this->squares["{$file}{$rank}"]->render();
            }

            // 3. Reset de la ligne + retour chariot
            echo "\n";
        }

        // 4. Affichage des lettres de colonnes en bas
        echo "   "; // Marge pour s'aligner avec les numéros
        foreach ($files as $file) {
            echo " {$file} "; // Espacement pour s'aligner avec les cases "élargies"
        }
        echo "\n";
    }
}
