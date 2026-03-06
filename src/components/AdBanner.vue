<script setup lang="ts">
import { onMounted, ref } from "vue";

/**
 * Componente de anúncio Google AdSense.
 *
 * Props:
 *  - slot: ID do ad slot configurado no AdSense
 *  - format: 'auto' (padrão), 'fluid', 'rectangle', 'horizontal'
 *  - fullWidth: se true, adiciona data-full-width-responsive="true"
 */
const props = withDefaults(
  defineProps<{
    adSlot: string;
    format?: "auto" | "fluid" | "rectangle" | "horizontal";
    fullWidth?: boolean;
  }>(),
  {
    format: "auto",
    fullWidth: true,
  },
);

const CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID ?? "";
const isDev = import.meta.env.DEV;
const loaded = ref(false);

onMounted(() => {
  if (isDev || !CLIENT_ID) return;

  try {
    // Empurra o anúncio para ser preenchido pelo AdSense
    (
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle ??
      ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = [])
    ).push({});
    loaded.value = true;
  } catch {
    // silently ignore se o script ainda não carregou
  }
});
</script>

<template>
  <!-- Placeholder visível apenas em desenvolvimento -->
  <div
    v-if="isDev || !CLIENT_ID"
    class="w-full flex items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/50 text-[var(--color-muted)] text-xs py-3 select-none"
    aria-hidden="true"
  >
    <span>📢 AdSense — slot {{ adSlot }}</span>
  </div>

  <!-- Anúncio real em produção -->
  <ins
    v-else
    class="adsbygoogle block w-full"
    :data-ad-client="CLIENT_ID"
    :data-ad-slot="adSlot"
    :data-ad-format="format"
    :data-full-width-responsive="fullWidth ? 'true' : 'false'"
  />
</template>
