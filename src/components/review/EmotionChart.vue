<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Loader2, TrendingUp } from "lucide-vue-next";
import { getEmotionChart } from "../../services/reviewService";
import type { TrackEmotionPointDTO } from "../../types";

const props = defineProps<{ reviewId: string }>();

const points = ref<TrackEmotionPointDTO[]>([]);
const loading = ref(true);
const error = ref(false);

onMounted(async () => {
  try {
    points.value = await getEmotionChart(props.reviewId);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});

// ─── SVG chart constants ───────────────────────────────────────────────────
const W = 480;
const H = 160;
const PAD_X = 28;
const PAD_Y = 20;

// Intensity range: -2 to +2, with optional 0–100 score normalised to -2..+2
function intensityOf(p: TrackEmotionPointDTO): number {
  if (p.intensity != null) return p.intensity;
  if (p.score != null) return (p.score / 100) * 4 - 2;
  return 0;
}

const chartPoints = computed(() =>
  points.value.map((p, i) => ({
    ...p,
    intensity: intensityOf(p),
    x:
      points.value.length === 1
        ? W / 2
        : PAD_X + (i / (points.value.length - 1)) * (W - PAD_X * 2),
    y: PAD_Y + ((2 - intensityOf(p)) / 4) * (H - PAD_Y * 2),
  })),
);

// Build smooth SVG path
const linePath = computed(() => {
  if (chartPoints.value.length < 2) return "";
  return chartPoints.value
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = chartPoints.value[i - 1]!;
      const cx = (prev.x + p.x) / 2;
      return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");
});

// Filled area under the line
const areaPath = computed(() => {
  if (chartPoints.value.length < 2) return "";
  const zeroY = PAD_Y + ((2 - 0) / 4) * (H - PAD_Y * 2);
  const first = chartPoints.value[0]!;
  const last = chartPoints.value[chartPoints.value.length - 1]!;
  return `${linePath.value} L ${last.x} ${zeroY} L ${first.x} ${zeroY} Z`;
});

function colorFor(intensity: number): string {
  if (intensity > 0.5) return "#22c55e"; // green-500
  if (intensity > 0) return "#86efac"; // green-300
  if (intensity < -0.5) return "#ef4444"; // red-500
  if (intensity < 0) return "#fca5a5"; // red-300
  return "#94a3b8"; // slate-400
}

// Hover state
const hovered = ref<number | null>(null);
const hoveredPoint = computed(() =>
  hovered.value !== null ? (chartPoints.value[hovered.value] ?? null) : null,
);
</script>

<template>
  <div class="space-y-2">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-6">
      <Loader2 class="w-5 h-5 text-muted animate-spin" />
    </div>

    <!-- Error -->
    <p v-else-if="error" class="text-xs text-muted text-center py-4">
      Erro ao carregar gráfico.
    </p>

    <!-- No data -->
    <p v-else-if="!points.length" class="text-xs text-muted text-center py-4">
      Sem dados de sentimento.
    </p>

    <!-- Chart -->
    <div v-else class="space-y-3">
      <div class="flex items-center gap-1.5 text-xs text-muted">
        <TrendingUp class="w-3.5 h-3.5" />
        <span>Arco emocional do álbum</span>
      </div>

      <!-- Y axis labels -->
      <div class="relative">
        <div
          class="absolute left-0 top-0 h-full flex flex-col justify-between text-[9px] text-muted/60 pr-1 py-[20px]"
          style="width: 22px"
        >
          <span>+2</span>
          <span>+1</span>
          <span>0</span>
          <span>-1</span>
          <span>-2</span>
        </div>

        <svg
          :viewBox="`0 0 ${W} ${H}`"
          class="w-full overflow-visible"
          style="margin-left: 22px; width: calc(100% - 22px)"
        >
          <!-- Zero line -->
          <line
            :x1="PAD_X"
            :y1="PAD_Y + (2 / 4) * (H - PAD_Y * 2)"
            :x2="W - PAD_X"
            :y2="PAD_Y + (2 / 4) * (H - PAD_Y * 2)"
            stroke="rgba(148,163,184,0.15)"
            stroke-width="1"
            stroke-dasharray="4 3"
          />
          <!-- Horizontal grid lines at +2, +1, 0, -1, -2 -->
          <line
            v-for="v in [2, 1, 0, -1, -2]"
            :key="v"
            :x1="PAD_X"
            :y1="PAD_Y + ((2 - v) / 4) * (H - PAD_Y * 2)"
            :x2="W - PAD_X"
            :y2="PAD_Y + ((2 - v) / 4) * (H - PAD_Y * 2)"
            stroke="rgba(148,163,184,0.07)"
            stroke-width="1"
          />

          <!-- Filled area -->
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(99,102,241,0.18)" />
              <stop offset="100%" stop-color="rgba(99,102,241,0.02)" />
            </linearGradient>
          </defs>
          <path :d="areaPath" fill="url(#area-grad)" />

          <!-- Line -->
          <path
            :d="linePath"
            fill="none"
            stroke="rgba(99,102,241,0.6)"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Points -->
          <g v-for="(p, i) in chartPoints" :key="i">
            <!-- hit area -->
            <circle
              :cx="p.x"
              :cy="p.y"
              r="12"
              fill="transparent"
              @mouseenter="hovered = i"
              @mouseleave="hovered = null"
              class="cursor-default"
            />
            <!-- visible dot -->
            <circle
              :cx="p.x"
              :cy="p.y"
              :r="hovered === i ? 6 : 4"
              :fill="colorFor(p.intensity)"
              stroke="var(--color-dark, #0f172a)"
              stroke-width="2"
              style="transition: r 0.15s"
            />
          </g>

          <!-- Tooltip -->
          <g
            v-if="hovered !== null && hoveredPoint"
            style="pointer-events: none"
          >
            <rect
              :x="Math.min(Math.max(hoveredPoint.x - 56, 0), W - 112)"
              :y="hoveredPoint.y - 42"
              width="112"
              height="32"
              rx="6"
              fill="var(--color-surface, #1e293b)"
              stroke="rgba(148,163,184,0.2)"
              stroke-width="1"
            />
            <text
              :x="Math.min(Math.max(hoveredPoint.x - 56, 0), W - 112) + 56"
              :y="hoveredPoint.y - 30"
              text-anchor="middle"
              fill="white"
              font-size="10"
              font-family="sans-serif"
            >
              {{ hoveredPoint.trackNumber }}.
              {{ hoveredPoint.trackName.slice(0, 14)
              }}{{ hoveredPoint.trackName.length > 14 ? "…" : "" }}
            </text>
            <text
              :x="Math.min(Math.max(hoveredPoint.x - 56, 0), W - 112) + 56"
              :y="hoveredPoint.y - 18"
              text-anchor="middle"
              :fill="colorFor(hoveredPoint.intensity)"
              font-size="10"
              font-family="sans-serif"
              font-weight="600"
            >
              {{
                hoveredPoint.feeling
                  ? hoveredPoint.feeling
                  : hoveredPoint.score != null
                    ? `${hoveredPoint.score}/100`
                    : "—"
              }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Track feeling chips -->
      <div class="flex flex-wrap gap-1.5 pt-1">
        <span
          v-for="(p, i) in chartPoints"
          :key="i"
          class="text-xs px-2 py-0.5 rounded-full border"
          :class="{
            'bg-green-500/10 border-green-500/25 text-green-400':
              p.intensity > 0,
            'bg-red-500/10 border-red-500/25 text-red-400': p.intensity < 0,
            'bg-[var(--color-surface-2)] border-[var(--color-border)] text-muted':
              p.intensity === 0,
          }"
          :title="`${p.trackName}: ${p.feeling ?? p.score}`"
        >
          {{ p.trackNumber }}. {{ p.feeling ?? p.score }}
        </span>
      </div>
    </div>
  </div>
</template>
