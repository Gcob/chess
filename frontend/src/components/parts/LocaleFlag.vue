<template>
  <!-- Québec (Fleurdelisé) for French, Canada for English. Small flat SVGs; the fleur-de-lis
       and maple leaf are drawn with glyphs to avoid heavy vector paths. -->
  <svg
    v-if="locale === 'fr'"
    class="locale-flag"
    viewBox="0 0 30 20"
    aria-hidden="true"
  >
    <rect width="30" height="20" fill="#095797" />
    <rect x="13.5" width="3" height="20" fill="#fff" />
    <rect y="8.5" width="30" height="3" fill="#fff" />
    <g fill="#fff" font-size="6" text-anchor="middle" dominant-baseline="central">
      <text x="6.75" y="4.25">⚜</text>
      <text x="23.25" y="4.25">⚜</text>
      <text x="6.75" y="15.75">⚜</text>
      <text x="23.25" y="15.75">⚜</text>
    </g>
  </svg>

  <svg
    v-else
    class="locale-flag"
    viewBox="0 0 30 20"
    aria-hidden="true"
  >
    <rect width="30" height="20" fill="#fff" />
    <rect width="7.5" height="20" fill="#d52b1e" />
    <rect x="22.5" width="7.5" height="20" fill="#d52b1e" />
    <text x="15" y="10.5" font-size="12" text-anchor="middle" dominant-baseline="central">🍁</text>
  </svg>
</template>

<script lang="ts" setup>
defineProps<{ locale: 'fr' | 'en' }>()
</script>

<style lang="scss" scoped>
.locale-flag {
  display: block;
}
</style>
