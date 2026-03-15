<script setup lang="ts">
</script>

<template>
  <div class="chess-rules">
    <section class="chess-rules__section">
      <h3 class="c-h3">{{ $t('chessRules.objectiveTitle') }}</h3>
      <p>{{ $t('chessRules.objectiveText') }}</p>
    </section>

    <section class="chess-rules__section">
      <h3 class="c-h3">{{ $t('chessRules.setupTitle') }}</h3>
      <p>{{ $t('chessRules.setupText') }}</p>
    </section>

    <section class="chess-rules__section">
      <h3 class="c-h3">{{ $t('chessRules.piecesTitle') }}</h3>

      <div class="chess-rules__piece">
        <strong>{{ $t('chessRules.king') }}</strong>
        <p>{{ $t('chessRules.kingText') }}</p>
      </div>

      <div class="chess-rules__piece">
        <strong>{{ $t('chessRules.queen') }}</strong>
        <p>{{ $t('chessRules.queenText') }}</p>
      </div>

      <div class="chess-rules__piece">
        <strong>{{ $t('chessRules.rook') }}</strong>
        <p>{{ $t('chessRules.rookText') }}</p>
      </div>

      <div class="chess-rules__piece">
        <strong>{{ $t('chessRules.bishop') }}</strong>
        <p>{{ $t('chessRules.bishopText') }}</p>
      </div>

      <div class="chess-rules__piece">
        <strong>{{ $t('chessRules.knight') }}</strong>
        <p>{{ $t('chessRules.knightText') }}</p>
      </div>

      <div class="chess-rules__piece">
        <strong>{{ $t('chessRules.pawn') }}</strong>
        <p>{{ $t('chessRules.pawnText') }}</p>
      </div>
    </section>

    <section class="chess-rules__section">
      <h3 class="c-h3">{{ $t('chessRules.specialTitle') }}</h3>

      <div class="chess-rules__piece">
        <strong>{{ $t('chessRules.castling') }}</strong>
        <p>{{ $t('chessRules.castlingText') }}</p>
      </div>

      <div class="chess-rules__piece">
        <strong>{{ $t('chessRules.enPassant') }}</strong>
        <p>{{ $t('chessRules.enPassantText') }}</p>
      </div>

      <div class="chess-rules__piece">
        <strong>{{ $t('chessRules.promotion') }}</strong>
        <p>{{ $t('chessRules.promotionText') }}</p>
      </div>
    </section>

    <section class="chess-rules__section">
      <h3 class="c-h3">{{ $t('chessRules.endTitle') }}</h3>
      <p>{{ $t('chessRules.endText') }}</p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.chess-rules {
  display: flex;
  flex-direction: column;
  gap: $spacing-6;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__piece {
    padding-left: $spacing-4;
    margin-bottom: $spacing-2;

    strong {
      font-weight: $font-weight-semibold;
      color: $color3;
    }

    p {
      margin-top: $spacing-1;
      color: rgba($color3, 0.7);
    }
  }
}
</style>
