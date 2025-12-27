<?php

namespace App\Domain\Chess;

use Illuminate\Support\Carbon;
use Spatie\LaravelData\Data;

class Stopwatch extends Data
{
    public function __construct(
        public float   $secondsLeft,
        public ?Carbon $isRunningSince = null,
    )
    {
    }

    /**
     * Start the stopwatch
     */
    public function start(): void
    {
        if ($this->isRunningSince === null) {
            $this->isRunningSince = Carbon::now();
        }
    }

    /**
     * Stop the stopwatch and update remaining time
     */
    public function stop(): void
    {
        if ($this->isRunningSince === null) {
            return;
        }

        $elapsed = $this->getTimeElapsedSinceRunning();
        $this->secondsLeft = max(0, $this->secondsLeft - $elapsed);
        $this->secondsLeft = floor($this->secondsLeft * 10) / 10;

        $this->isRunningSince = null;
    }

    /**
     * Get time elapsed since the stopwatch started running
     */
    public function getTimeElapsedSinceRunning(): float
    {
        if ($this->isRunningSince === null) {
            return 0.0;
        }

        return Carbon::now()->diffInSeconds($this->isRunningSince, absolute: true);
    }

    /**
     * Get current remaining time (accounting for running time)
     */
    public function getCurrentSecondsLeft(): float
    {
        if ($this->isRunningSince === null) {
            return $this->secondsLeft;
        }

        return max(0, $this->secondsLeft - $this->getTimeElapsedSinceRunning());
    }

    /**
     * Check if stopwatch is running
     */
    public function isRunning(): bool
    {
        return $this->isRunningSince !== null;
    }

    /**
     * Check if time has run out
     */
    public function hasExpired(): bool
    {
        return $this->getCurrentSecondsLeft() <= 0;
    }

    /**
     * Get seconds left (base value without accounting for current run)
     */
    public function getSecondsLeft(): float
    {
        return $this->secondsLeft;
    }

    /**
     * Add time to the stopwatch (for increment modes)
     */
    public function addTime(float $seconds): void
    {
        $this->secondsLeft += $seconds;
    }
}
