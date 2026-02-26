<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Send, Loader2, AlertCircle } from "lucide-vue-next";
import { fetchReleaseDetails } from "../services/fetchService";
import {
  createReview,
  updateReview,
  getFeelings,
} from "../services/reviewService";
import type {
  FetchAlbumDetails,
  ReviewDTO,
  TrackScoreDTO,
  FeelingOptionDTO,
} from "../types";
import AppImage from "../components/AppImage.vue";

const route = useRoute();
const router = useRouter();

// ─── Album data ───────────────────────────────────────────────────────────────
const album = ref<FetchAlbumDetails | null>(null);
const existingReview = ref<ReviewDTO | null>(null);
const pageLoading = ref(true);
const pageError = ref<string | null>(null);

onMounted(async () => {
  try {
    const [data, feelings] = await Promise.all([
      fetchReleaseDetails(route.params.id as string),
      getFeelings(),
    ]);
    album.value = data.album;
    existingReview.value = data.userReview;
    allFeelings.value = feelings;

    // Pre-fill form if editing
    if (data.userReview) {
      content.value = data.userReview.content ?? "";
      if (
        data.userReview.albumScore != null &&
        !data.userReview.trackScores?.length
      ) {
        scoreMode.value = "album";
        albumScore.value = data.userReview.albumScore;
      } else if (data.userReview.trackScores?.length) {
        const hasFeelings = data.userReview.trackScores.some(
          (ts) => ts.feeling,
        );
        if (hasFeelings) {
          scoreMode.value = "feelings";
          for (const ts of data.userReview.trackScores) {
            if (ts.feeling) trackFeelings[ts.trackId] = ts.feeling;
          }
        } else {
          scoreMode.value = "tracks";
          for (const ts of data.userReview.trackScores) {
            if (ts.score != null) trackScores[ts.trackId] = ts.score;
          }
        }
      }
    }
  } catch (e) {
    pageError.value = e instanceof Error ? e.message : "Erro ao carregar álbum";
  } finally {
    pageLoading.value = false;
  }
});

// ─── Feelings list ───────────────────────────────────────────────────────────
const allFeelings = ref<FeelingOptionDTO[]>([]);

const feelingsByCategory = computed(() => ({
  positive: allFeelings.value.filter((f) => f.category === "positive"),
  neutral: allFeelings.value.filter((f) => f.category === "neutral"),
  negative: allFeelings.value.filter((f) => f.category === "negative"),
}));

// ─── Form state ───────────────────────────────────────────────────────────────
type ScoreMode = "album" | "tracks" | "feelings";
const scoreMode = ref<ScoreMode>("feelings");
const content = ref("");
const albumScore = ref(50);
const showAlbumScore = ref(false);
const trackScores = reactive<Record<string, number>>({});
const trackFeelings = reactive<Record<string, string>>({});
const loading = ref(false);
const submitError = ref<string | null>(null);

const isEditing = computed(() => !!existingReview.value);
const hasAnyScore = computed(() =>
  Object.values(trackScores).some((s) => s > 0),
);
const hasAnyFeeling = computed(() => Object.keys(trackFeelings).length > 0);
const canSubmit = computed(() => {
  if (content.value.trim().length > 0) return true;
  if (scoreMode.value === "album") return true;
  if (scoreMode.value === "tracks") return hasAnyScore.value;
  if (scoreMode.value === "feelings") return hasAnyFeeling.value;
  return false;
});

const artistNames = computed(
  () => album.value?.artists.map((a) => a.name).join(", ") ?? "",
);

async function handleSubmit() {
  if (!canSubmit.value || !album.value) return;
  loading.value = true;
  submitError.value = null;

  try {
    if (isEditing.value && existingReview.value) {
      // Editing: only content update is supported by PUT /reviews/{id}
      await updateReview(existingReview.value.id, content.value);
    } else {
      // Creating new
      const payload = buildPayload();
      await createReview(payload);
    }
    router.push({ name: "album-detail", params: { id: album.value.id } });
  } catch (e) {
    submitError.value =
      e instanceof Error ? e.message : "Erro ao publicar review";
  } finally {
    loading.value = false;
  }
}

function buildPayload() {
  const payload: Parameters<typeof createReview>[0] = {
    albumId: album.value!.id,
  };

  if (content.value.trim()) {
    payload.content = content.value.trim();
  }

  if (scoreMode.value === "album") {
    payload.albumScore = albumScore.value;
  } else if (scoreMode.value === "tracks" && album.value) {
    const scores: TrackScoreDTO[] = album.value.musics
      .filter((m) => (trackScores[m.id] ?? 0) > 0)
      .map((m) => ({
        trackId: m.id,
        trackNumber: m.position,
        trackName: m.name,
        score: trackScores[m.id]!,
      }));
    if (scores.length) {
      payload.trackScores = scores;
      const avg = scores.reduce((sum, s) => sum + s.score!, 0) / scores.length;
      payload.albumScore = Math.round(avg);
    }
  } else if (scoreMode.value === "feelings" && album.value) {
    const scores: TrackScoreDTO[] = album.value.musics
      .filter((m) => !!trackFeelings[m.id])
      .map((m) => ({
        trackId: m.id,
        trackNumber: m.position,
        trackName: m.name,
        feeling: trackFeelings[m.id],
      }));
    if (scores.length) payload.trackScores = scores;
    if (showAlbumScore.value) payload.albumScore = albumScore.value;
  }

  return payload;
}
</script>

<template>
  <!-- Loading page -->
  <div v-if="pageLoading" class="flex items-center justify-center min-h-[60vh]">
    <Loader2 class="w-8 h-8 text-primary animate-spin" />
  </div>

  <!-- Page error -->
  <div
    v-else-if="pageError"
    class="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8"
  >
    <div
      class="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center"
    >
      <AlertCircle class="w-8 h-8 text-red-400" />
    </div>
    <p class="text-white font-semibold">{{ pageError }}</p>
    <button @click="router.back()" class="btn-primary text-sm px-5 py-2">
      Voltar
    </button>
  </div>

  <div v-else-if="album" class="min-h-full pb-24">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 bg-dark/80 backdrop-blur-md border-b border-[var(--color-border)] px-6 py-4 flex items-center gap-4"
    >
      <button
        @click="router.back()"
        class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface-2)] text-muted hover:text-white transition-all"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="text-base font-bold text-white">
          {{ isEditing ? "Editar Review" : "Criar Review" }}
        </h1>
        <p class="text-xs text-muted truncate">
          {{ album.name }} · {{ artistNames }}
        </p>
      </div>
      <div class="w-10 h-10 flex-shrink-0 aspect-square">
        <AppImage
          :src="album.image_url"
          :alt="album.name"
          type="album"
          rounded="xl"
          class="w-full h-full"
        />
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <!-- Textarea -->
      <section class="space-y-3">
        <label class="text-sm font-semibold text-white"
          >O que você achou do álbum?</label
        >
        <textarea
          v-model="content"
          placeholder="Escreva seu review aqui..."
          rows="5"
          class="input-field resize-none leading-relaxed"
        />
      </section>

      <!-- Score mode selector (only for new reviews) -->
      <section v-if="!isEditing" class="space-y-3">
        <label class="text-sm font-semibold text-white"
          >Modo de avaliação</label
        >
        <div class="grid grid-cols-3 gap-2">
          <label
            v-for="opt in [
              { value: 'album', label: 'Nota única', emoji: '🎯' },
              { value: 'tracks', label: 'Nota por faixa', emoji: '🎚️' },
              { value: 'feelings', label: 'Sentimentos', emoji: '🎭' },
            ]"
            :key="opt.value"
            class="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border cursor-pointer transition-all duration-200 text-center"
            :class="
              scoreMode === opt.value
                ? 'border-primary bg-primary/10'
                : 'border-[var(--color-border)] hover:border-[var(--color-muted)]/50'
            "
          >
            <span class="text-xl">{{ opt.emoji }}</span>
            <span
              class="text-xs font-medium leading-tight"
              :class="scoreMode === opt.value ? 'text-white' : 'text-muted'"
            >
              {{ opt.label }}
            </span>
            <input
              type="radio"
              :value="opt.value"
              v-model="scoreMode"
              class="sr-only"
            />
          </label>
        </div>
      </section>

      <!-- Album score slider -->
      <section v-if="scoreMode === 'album'" class="space-y-4">
        <div class="card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-white">Nota do álbum</span>
            <span class="text-2xl font-black text-primary tabular-nums">{{
              albumScore
            }}</span>
          </div>
          <div class="relative">
            <input
              v-model.number="albumScore"
              type="range"
              min="0"
              max="100"
              step="1"
              class="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-[var(--color-surface-2)]"
            />
            <div class="flex justify-between mt-1.5 px-0.5">
              <span
                v-for="n in [0, 25, 50, 75, 100]"
                :key="n"
                class="text-[10px] text-muted sm:hidden"
                >{{ n }}</span
              >
              <span
                v-for="n in [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]"
                :key="n"
                class="text-[10px] text-muted hidden sm:block"
                >{{ n }}</span
              >
            </div>
          </div>
        </div>
      </section>

      <!-- Track-by-track sliders -->
      <section v-if="scoreMode === 'tracks'" class="space-y-3">
        <p class="text-sm font-semibold text-white">Avalie cada faixa</p>
        <div class="card divide-y divide-[var(--color-border)]">
          <div
            v-for="music in album.musics"
            :key="music.id"
            class="px-5 py-4 space-y-2"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  class="text-xs text-muted font-mono w-5 text-right flex-shrink-0"
                  >{{ music.position }}.</span
                >
                <span class="text-sm font-medium text-white truncate">{{
                  music.name
                }}</span>
              </div>
              <span
                class="text-base font-bold tabular-nums flex-shrink-0 ml-3 w-6 text-right transition-colors"
                :class="
                  (trackScores[music.id] ?? 0) > 0
                    ? 'text-primary'
                    : 'text-muted'
                "
              >
                {{ trackScores[music.id] ?? 0 }}
              </span>
            </div>
            <input
              v-model.number="trackScores[music.id]"
              type="range"
              min="0"
              max="100"
              step="1"
              class="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-[var(--color-surface-2)]"
            />
          </div>
        </div>
      </section>

      <!-- Feelings per-track -->
      <section v-if="scoreMode === 'feelings'" class="space-y-4">
        <!-- Optional album score in feelings mode -->
        <div class="card p-4 space-y-3">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm font-semibold text-white"
              >Adicionar nota ao álbum
              <span class="text-muted font-normal text-xs"
                >(opcional)</span
              ></span
            >
            <button
              @click="showAlbumScore = !showAlbumScore"
              class="relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0"
              :class="
                showAlbumScore
                  ? 'bg-primary'
                  : 'bg-[var(--color-surface-2)] border border-[var(--color-border)]'
              "
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                :class="showAlbumScore ? 'translate-x-[18px]' : ''"
              />
            </button>
          </label>
          <div v-if="showAlbumScore" class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">Nota do álbum</span>
              <span class="text-xl font-black text-primary tabular-nums">{{
                albumScore
              }}</span>
            </div>
            <input
              v-model.number="albumScore"
              type="range"
              min="0"
              max="100"
              step="1"
              class="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-[var(--color-surface-2)]"
            />
          </div>
        </div>

        <p class="text-sm font-semibold text-white">
          Como cada faixa te fez sentir?
        </p>
        <div class="space-y-3">
          <div
            v-for="music in album.musics"
            :key="music.id"
            class="card p-4 space-y-3"
          >
            <!-- Track header -->
            <div class="flex items-center gap-2">
              <span
                class="text-xs text-muted font-mono w-5 text-right flex-shrink-0"
                >{{ music.position }}.</span
              >
              <span class="text-sm font-semibold text-white flex-1 truncate">{{
                music.name
              }}</span>
              <button
                v-if="trackFeelings[music.id]"
                @click="delete trackFeelings[music.id]"
                class="text-xs text-muted hover:text-red-400 transition-colors flex-shrink-0"
              >
                ✕ limpar
              </button>
            </div>

            <!-- Selected feeling badge -->
            <div v-if="trackFeelings[music.id]" class="flex items-center gap-2">
              <span class="text-lg">{{
                allFeelings.find((f) => f.value === trackFeelings[music.id])
                  ?.emoji
              }}</span>
              <span class="text-sm font-medium text-white">{{
                allFeelings.find((f) => f.value === trackFeelings[music.id])
                  ?.label
              }}</span>
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="{
                  'bg-green-500/15 text-green-400':
                    (allFeelings.find(
                      (f) => f.value === trackFeelings[music.id],
                    )?.intensity ?? 0) > 0,
                  'bg-red-500/15 text-red-400':
                    (allFeelings.find(
                      (f) => f.value === trackFeelings[music.id],
                    )?.intensity ?? 0) < 0,
                  'bg-[var(--color-surface-2)] text-muted':
                    (allFeelings.find(
                      (f) => f.value === trackFeelings[music.id],
                    )?.intensity ?? 0) === 0,
                }"
                >{{
                  (allFeelings.find((f) => f.value === trackFeelings[music.id])
                    ?.intensity ?? 0) > 0
                    ? "+"
                    : ""
                }}{{
                  allFeelings.find((f) => f.value === trackFeelings[music.id])
                    ?.intensity ?? ""
                }}</span
              >
            </div>

            <!-- Feeling buttons grouped by category -->
            <div class="space-y-2">
              <div v-if="feelingsByCategory.positive.length" class="space-y-1">
                <p
                  class="text-[10px] uppercase tracking-widest text-green-500/70 font-semibold"
                >
                  Positivos
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="f in feelingsByCategory.positive"
                    :key="f.value"
                    @click="trackFeelings[music.id] = f.value"
                    class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                    :class="
                      trackFeelings[music.id] === f.value
                        ? 'bg-green-500/20 border-green-500/50 text-green-300'
                        : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-muted hover:border-green-500/30 hover:text-green-400'
                    "
                  >
                    <span>{{ f.emoji }}</span> {{ f.label }}
                  </button>
                </div>
              </div>
              <div v-if="feelingsByCategory.neutral.length" class="space-y-1">
                <p
                  class="text-[10px] uppercase tracking-widest text-muted/70 font-semibold"
                >
                  Neutros
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="f in feelingsByCategory.neutral"
                    :key="f.value"
                    @click="trackFeelings[music.id] = f.value"
                    class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                    :class="
                      trackFeelings[music.id] === f.value
                        ? 'bg-[var(--color-surface)] border-[var(--color-muted)]/50 text-white'
                        : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-muted hover:border-[var(--color-muted)]/40 hover:text-white'
                    "
                  >
                    <span>{{ f.emoji }}</span> {{ f.label }}
                  </button>
                </div>
              </div>
              <div v-if="feelingsByCategory.negative.length" class="space-y-1">
                <p
                  class="text-[10px] uppercase tracking-widest text-red-500/70 font-semibold"
                >
                  Negativos
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="f in feelingsByCategory.negative"
                    :key="f.value"
                    @click="trackFeelings[music.id] = f.value"
                    class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                    :class="
                      trackFeelings[music.id] === f.value
                        ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-muted hover:border-red-500/30 hover:text-red-400'
                    "
                  >
                    <span>{{ f.emoji }}</span> {{ f.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Sticky footer -->
    <div
      class="fixed bottom-0 left-0 md:left-16 lg:left-64 right-0 bg-dark/90 backdrop-blur-md border-t border-[var(--color-border)] px-4 sm:px-6 py-3 sm:py-4"
    >
      <div class="max-w-2xl mx-auto space-y-2">
        <p
          v-if="submitError"
          class="text-red-400 text-xs flex items-center gap-1.5"
        >
          <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
          {{ submitError }}
        </p>
        <div class="flex items-center gap-4">
          <div class="flex-1 text-xs text-muted">
            <template v-if="scoreMode === 'tracks'">
              {{ Object.values(trackScores).filter((s) => s > 0).length }}/{{
                album.musics.length
              }}
              faixas avaliadas
            </template>
            <template v-else-if="scoreMode === 'feelings'">
              {{ Object.keys(trackFeelings).length }}/{{ album.musics.length }}
              faixas com sentimento
            </template>
          </div>
          <button
            @click="handleSubmit"
            class="btn-primary flex items-center gap-2 px-6"
            :disabled="!canSubmit || loading"
            :class="!canSubmit ? 'opacity-40 cursor-not-allowed' : ''"
          >
            <span
              v-if="loading"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            <Send v-else class="w-4 h-4" />
            {{
              loading
                ? "Publicando..."
                : isEditing
                  ? "Salvar"
                  : "Publicar Review"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom range slider track */
input[type="range"]::-webkit-slider-track {
  height: 6px;
  border-radius: 999px;
  background: var(--color-surface-2);
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  margin-top: -6px;
  box-shadow: 0 0 0 3px rgba(35, 78, 216, 0.2);
  transition: box-shadow 0.2s;
}
input[type="range"]::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 5px rgba(35, 78, 216, 0.3);
}
input[type="range"]::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: var(--color-surface-2);
}
input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  border: none;
  cursor: pointer;
}
</style>
