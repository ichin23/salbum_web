<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  Star,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-vue-next";
import {
  likeReview,
  unlikeReview,
  updateReview,
  deleteReview,
} from "../../services/reviewService";
import type { FullReviewInfoDTO, FullReviewDTO } from "../../types";
import AppImage from "../AppImage.vue";
import EmotionChart from "./EmotionChart.vue";
import { useAuthStore } from "../../stores/auth";

const props = defineProps<{
  item: FullReviewDTO | FullReviewInfoDTO;
}>();
const emit = defineEmits<{
  (e: "deleted", id: string): void;
  (e: "updated", id: string, content: string): void;
}>();

const auth = useAuthStore();
const review = computed(() => props.item.review);
const liked = ref(props.item.likedByCurrentUser);
const likeCount = ref(props.item.likeCount);
const expanded = ref(false);
const liking = ref(false);

const formattedDate = computed(() =>
  new Date(review.value.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
);

const hasScore = computed(() => review.value.albumScore != null);
const hasTracks = computed(() => !!review.value.trackScores?.length);
const hasFeelings = computed(
  () => !!review.value.trackScores?.some((ts) => ts.feeling),
);
const showChart = ref(false);
const spotifyUrl = computed(() => review.value.album?.spotify_url ?? null);

// ─── Owner ────────────────────────────────────────────────────────────────────
const isOwner = computed(
  () => !!auth.user && auth.user.id === review.value.user.id,
);

// ─── Like ─────────────────────────────────────────────────────────────────────
async function toggleLike() {
  if (liking.value) return;
  liking.value = true;
  try {
    if (liked.value) {
      await unlikeReview(review.value.id);
      liked.value = false;
      likeCount.value--;
    } else {
      await likeReview(review.value.id);
      liked.value = true;
      likeCount.value++;
    }
  } catch {
    // silently ignore
  } finally {
    liking.value = false;
  }
}

// ─── Actions menu ─────────────────────────────────────────────────────────────
const menuOpen = ref(false);
const editing = ref(false);
const editText = ref("");
const saving = ref(false);
const deleting = ref(false);
const editError = ref<string | null>(null);

function openMenu() {
  menuOpen.value = !menuOpen.value;
}
function closeMenu() {
  menuOpen.value = false;
}

function startEdit() {
  closeMenu();
  editText.value = review.value.content ?? "";
  editing.value = true;
  editError.value = null;
}

function cancelEdit() {
  editing.value = false;
  editError.value = null;
}

// Local content override so UI reflects save without re-fetch
const localContent = ref<string | null>(null);
const displayContent = computed(() =>
  localContent.value !== null
    ? localContent.value
    : (review.value.content ?? null),
);

async function saveEdit() {
  if (saving.value) return;
  saving.value = true;
  editError.value = null;
  try {
    await updateReview(review.value.id, editText.value);
    localContent.value = editText.value;
    emit("updated", review.value.id, editText.value);
    editing.value = false;
  } catch {
    editError.value = "Erro ao salvar. Tente novamente.";
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  closeMenu();
  if (deleting.value) return;
  deleting.value = true;
  try {
    await deleteReview(review.value.id);
    emit("deleted", review.value.id);
  } catch {
    deleting.value = false;
  }
}
</script>

<template>
  <div
    class="card p-5 space-y-4 hover:border-[var(--color-muted)]/40 transition-colors duration-200"
    :class="deleting ? 'opacity-40 pointer-events-none' : ''"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <AppImage
          :src="review.user.imageUrl"
          :alt="review.user.username"
          :initial="(review.user.username[0] ?? '?').toUpperCase()"
          type="artist"
          rounded="full"
          class="w-9 h-9 flex-shrink-0"
        />
        <div>
          <p class="text-sm font-semibold text-white">
            {{ review.user.username }}
          </p>
          <p class="text-xs text-muted">{{ formattedDate }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Score badge -->
        <div
          v-if="hasScore"
          class="flex items-center gap-1.5 bg-[var(--color-surface-2)] rounded-2xl px-3 py-1.5"
        >
          <Star class="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
          <span class="text-white font-bold text-sm">{{
            review.albumScore
          }}</span>
          <span class="text-muted text-xs">/100</span>
        </div>

        <!-- ⋯ menu (owner only) -->
        <div v-if="isOwner" class="relative">
          <button
            @click.stop="openMenu"
            class="p-1.5 rounded-lg text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <MoreHorizontal class="w-4 h-4" />
          </button>

          <div
            v-if="menuOpen"
            class="absolute right-0 top-full mt-1 z-20 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden"
            @click.stop
          >
            <button
              @click="startEdit"
              class="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <Pencil class="w-3.5 h-3.5 text-muted" />
              Editar
            </button>
            <button
              @click="confirmDelete"
              class="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Deletar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay click-away for menu -->
    <div v-if="menuOpen" class="fixed inset-0 z-10" @click="closeMenu" />

    <!-- Inline edit mode -->
    <div v-if="editing" class="space-y-2">
      <textarea
        v-model="editText"
        rows="4"
        class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] resize-none focus:outline-none focus:border-primary transition-colors"
        placeholder="Escreva sua review..."
      />
      <p v-if="editError" class="text-xs text-red-400">{{ editError }}</p>
      <div class="flex gap-2 justify-end">
        <button
          @click="cancelEdit"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-white rounded-xl hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <X class="w-4 h-4" /> Cancelar
        </button>
        <button
          @click="saveEdit"
          :disabled="saving"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Check v-else class="w-4 h-4" />
          Salvar
        </button>
      </div>
    </div>

    <!-- Comment text (display mode) -->
    <p
      v-else-if="displayContent"
      class="text-sm text-[var(--color-text)] leading-relaxed"
    >
      {{ displayContent }}
    </p>

    <!-- Track-by-track scores / feelings -->
    <div v-if="hasTracks">
      <div class="flex items-center gap-3 flex-wrap">
        <button
          @click="expanded = !expanded"
          class="flex items-center gap-2 text-sm font-medium text-muted hover:text-white transition-colors"
        >
          <component :is="expanded ? ChevronUp : ChevronDown" class="w-4 h-4" />
          {{ expanded ? "Ocultar" : "Ver" }}
          {{ hasFeelings ? "sentimentos" : "notas" }} por faixa ({{
            review.trackScores!.length
          }})
        </button>

        <button
          v-if="hasTracks"
          @click="showChart = !showChart"
          class="flex items-center gap-1.5 text-xs font-medium transition-colors"
          :class="showChart ? 'text-primary' : 'text-muted hover:text-white'"
        >
          <span class="text-base leading-none">📈</span>
          {{ showChart ? "Ocultar gráfico" : "Ver gráfico emocional" }}
        </button>
      </div>

      <!-- Emotion chart -->
      <div
        v-if="showChart"
        class="mt-3 bg-[var(--color-surface-2)] rounded-xl p-3"
      >
        <EmotionChart :review-id="review.id" />
      </div>

      <!-- Track list -->
      <div v-if="expanded" class="mt-3 space-y-1">
        <div
          v-for="ts in review.trackScores"
          :key="ts.trackId"
          class="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <span class="text-xs text-muted w-5 text-right flex-shrink-0"
            >{{ ts.trackNumber }}.</span
          >
          <span class="text-sm text-[var(--color-text)] flex-1 truncate">{{
            ts.trackName
          }}</span>
          <!-- Feeling chip -->
          <span
            v-if="ts.feeling"
            class="text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0"
            :class="{
              'bg-green-500/10 border-green-500/25 text-green-400': [
                'EUPHORIC',
                'ENERGIZED',
                'EMPOWERED',
                'HAPPY',
                'NOSTALGIC',
                'INSPIRED',
                'IN_LOVE',
                'HOPEFUL',
              ].includes(ts.feeling),
              'bg-red-500/10 border-red-500/25 text-red-400': [
                'MELANCHOLIC',
                'ANXIOUS',
                'TENSE',
                'LONELY',
                'DEVASTATED',
                'ANGRY',
                'BORED',
              ].includes(ts.feeling),
              'bg-[var(--color-surface-2)] border-[var(--color-border)] text-muted':
                [
                  'CALM',
                  'FOCUSED',
                  'DREAMY',
                  'INDIFFERENT',
                  'SKIPPED',
                ].includes(ts.feeling),
            }"
            >{{ ts.feeling }}</span
          >
          <!-- Numeric score -->
          <span
            v-else-if="ts.score != null"
            class="text-xs font-semibold text-white w-8 text-right flex-shrink-0"
            >{{ ts.score }}</span
          >
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex items-center justify-between pt-1 border-t border-[var(--color-border)]"
    >
      <button
        @click="toggleLike"
        class="flex items-center gap-1.5 text-xs transition-colors"
        :class="liked ? 'text-red-400' : 'text-muted hover:text-red-400'"
        :disabled="liking"
      >
        <Heart class="w-4 h-4" :fill="liked ? 'currentColor' : 'none'" />
        {{ likeCount }}
      </button>

      <a
        v-if="spotifyUrl"
        :href="spotifyUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 text-xs text-muted hover:text-[#1DB954] transition-colors"
        title="Abrir no Spotify"
      >
        <ExternalLink class="w-3.5 h-3.5" />
        Abrir no Spotify
      </a>
    </div>
  </div>
</template>
