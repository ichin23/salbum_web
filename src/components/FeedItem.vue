<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  Star,
  Share2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
} from "lucide-vue-next";
import type { ActivityItemDTO } from "../types";
import AppImage from "./AppImage.vue";
import EmotionChart from "./review/EmotionChart.vue";
import { useAuthStore } from "../stores/auth";
import { updateReview, deleteReview } from "../services/reviewService";
import {
  updateMusicShare,
  deleteMusicShare,
} from "../services/musicShareService";

const props = defineProps<{ item: ActivityItemDTO }>();
const emit = defineEmits<{ (e: "deleted", id: string): void }>();

const auth = useAuthStore();

const isReview = computed(
  () => props.item.type === "REVIEW" || props.item.type === "RATING",
);
const isShare = computed(() => props.item.type === "MUSIC_SHARE");

const review = computed(() => props.item.review);
const share = computed(() => props.item.musicShare);

const shareTitle = computed(() => {
  const s = share.value;
  if (!s) return "";
  if (s.music) return s.music.name;
  if (s.album) return s.album.name;
  if (s.artist) return s.artist.name;
  return "";
});

const shareSubtitle = computed(() => {
  const s = share.value;
  if (!s) return "";
  if (s.music) return s.music.album?.name ?? "";
  if (s.album) return s.album.artists?.map((a) => a.name).join(", ") ?? "";
  if (s.artist) return s.artist.country ?? "";
  return "";
});

const shareCover = computed((): string | null => {
  const s = share.value;
  if (!s) return null;
  if (s.music) return s.music.album?.image_url ?? null;
  if (s.album) return s.album.image_url ?? null;
  if (s.artist) return s.artist.image_url ?? null;
  return null;
});

const shareImageType = computed((): "album" | "music" | "artist" => {
  const s = share.value;
  if (!s) return "album";
  if (s.artist) return "artist";
  if (s.music) return "music";
  return "album";
});

const shareRoute = computed(() => {
  const s = share.value;
  if (!s) return null;
  if (s.music?.album?.id)
    return { name: "album-detail", params: { id: s.music.album.id } };
  if (s.album) return { name: "album-detail", params: { id: s.album.id } };
  if (s.artist) return { name: "artist-detail", params: { id: s.artist.id } };
  return null;
});

const shareInitial = computed(() => {
  const s = share.value;
  if (s?.artist) return (s.artist.name?.[0] ?? "?").toUpperCase();
  return "";
});

const user = computed(() => {
  if (isReview.value) return review.value?.review.user;
  return share.value?.user;
});

const formattedDate = computed(() =>
  new Date(props.item.timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
);

const isOwner = computed(
  () => !!auth.user && !!user.value && auth.user.id === user.value.id,
);

const menuOpen = ref(false);
const editing = ref(false);
const editText = ref("");
const saving = ref(false);
const deleting = ref(false);
const editError = ref<string | null>(null);
const showChart = ref(false);

const hasTracks = computed(() => !!review.value?.review.trackScores?.length);

function openMenu() {
  menuOpen.value = !menuOpen.value;
}
function closeMenu() {
  menuOpen.value = false;
}

function startEdit() {
  closeMenu();
  editText.value = isReview.value
    ? (review.value?.review.content ?? "")
    : (share.value?.comment ?? "");
  editing.value = true;
  editError.value = null;
}

function cancelEdit() {
  editing.value = false;
  editError.value = null;
}

const localContent = ref<string | null>(null);
const localComment = ref<string | null>(null);

const displayContent = computed(() =>
  localContent.value !== null
    ? localContent.value
    : (review.value?.review.content ?? null),
);
const displayComment = computed(() =>
  localComment.value !== null
    ? localComment.value
    : (share.value?.comment ?? null),
);

async function saveEdit() {
  if (saving.value) return;
  saving.value = true;
  editError.value = null;
  try {
    if (isReview.value && review.value) {
      await updateReview(review.value.review.id, editText.value);
      localContent.value = editText.value;
    } else if (isShare.value && share.value) {
      await updateMusicShare(share.value.id, editText.value);
      localComment.value = editText.value;
    }
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
    if (isReview.value && review.value) {
      await deleteReview(review.value.review.id);
      emit("deleted", review.value.review.id);
    } else if (isShare.value && share.value) {
      await deleteMusicShare(share.value.id);
      emit("deleted", share.value.id);
    }
  } catch {
    deleting.value = false;
  }
}
</script>

<template>
  <article
    class="card p-3 space-y-2 hover:border-[var(--color-muted)]/30 transition-colors overflow-hidden relative"
    :class="deleting ? 'opacity-40 pointer-events-none' : ''"
    @click.self="closeMenu"
  >
    <div class="flex items-center gap-2 min-w-0">
      <div class="w-7 h-7 flex-shrink-0 aspect-square">
        <AppImage
          :src="user?.imageUrl ?? null"
          :alt="user?.username ?? ''"
          :initial="(user?.username?.[0] ?? '?').toUpperCase()"
          type="artist"
          rounded="full"
          class="w-full h-full"
        />
      </div>
      <div class="flex-1 min-w-0 overflow-hidden">
        <p class="text-xs font-semibold text-white truncate leading-none">
          {{ user?.name ?? user?.username }}
        </p>
        <p class="text-[11px] text-muted mt-0.5 leading-none truncate">
          {{ formattedDate }}
        </p>
      </div>
      <span
        class="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
        :class="
          isReview
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary/10 text-secondary'
        "
      >
        <MessageSquare v-if="isReview" class="w-2.5 h-2.5 flex-shrink-0" />
        <Share2 v-else class="w-2.5 h-2.5 flex-shrink-0" />
        {{ isReview ? "Review" : "Compartilhou" }}
      </span>

      <div v-if="isOwner" class="relative flex-shrink-0">
        <button
          @click.stop="openMenu"
          class="p-1 rounded-lg text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
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
            class="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <Pencil class="w-3.5 h-3.5 text-muted" />
            Editar
          </button>
          <button
            @click="confirmDelete"
            class="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 class="w-3.5 h-3.5" />
            Deletar
          </button>
        </div>
      </div>
    </div>

    <div v-if="menuOpen" class="fixed inset-0 z-10" @click="closeMenu" />

    <template v-if="isReview && review">
      <RouterLink
        :to="{ name: 'album-detail', params: { id: review.review.album.id } }"
        class="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] transition-colors group overflow-hidden"
      >
        <div class="w-9 h-9 flex-shrink-0 aspect-square">
          <AppImage
            :src="review.review.album.image_url"
            :alt="review.review.album.name"
            type="album"
            rounded="lg"
            class="w-full h-full"
          />
        </div>
        <div class="flex-1 min-w-0 overflow-hidden">
          <p
            class="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors"
          >
            {{ review.review.album.name }}
          </p>
          <p class="text-[11px] text-muted truncate">
            {{ review.review.album.artists?.map((a) => a.name).join(", ") }}
          </p>
        </div>
        <div
          v-if="review.review.albumScore != null"
          class="flex items-center gap-1 flex-shrink-0"
        >
          <Star class="w-3 h-3 text-yellow-400" fill="currentColor" />
          <span class="text-xs font-bold text-white">{{
            review.review.albumScore
          }}</span>
        </div>
      </RouterLink>

      <div v-if="editing" class="space-y-2">
        <textarea
          v-model="editText"
          rows="3"
          class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] resize-none focus:outline-none focus:border-primary transition-colors"
          placeholder="Escreva seu comentário..."
        />
        <p v-if="editError" class="text-xs text-red-400">{{ editError }}</p>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelEdit"
            class="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted hover:text-white rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X class="w-3.5 h-3.5" /> Cancelar
          </button>
          <button
            @click="saveEdit"
            :disabled="saving"
            class="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            <Check v-else class="w-3.5 h-3.5" />
            Salvar
          </button>
        </div>
      </div>

      <p
        v-else-if="displayContent"
        class="text-xs text-[var(--color-text)] leading-relaxed line-clamp-2"
      >
        {{ displayContent }}
      </p>

      <!-- Emotion chart toggle -->
      <div
        v-if="hasTracks && !editing"
        class="flex items-center gap-2 flex-wrap"
      >
        <button
          @click.stop="showChart = !showChart"
          class="flex items-center gap-1 text-[11px] font-medium transition-colors"
          :class="showChart ? 'text-primary' : 'text-muted hover:text-white'"
        >
          <span class="leading-none">📈</span>
          {{ showChart ? "Ocultar gráfico" : "Ver gráfico emocional" }}
        </button>

        <a
          v-if="review.review.album?.spotify_url"
          :href="review.review.album.spotify_url"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
          class="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-[#1DB954] transition-colors"
          title="Abrir no Spotify"
        >
          <ExternalLink class="w-3 h-3" />
          Spotify
        </a>
      </div>
      <div
        v-if="hasTracks && showChart"
        class="rounded-xl bg-[var(--color-surface-2)] p-2.5"
      >
        <EmotionChart :review-id="review!.review.id" />
      </div>
    </template>

    <template v-if="isShare && share">
      <component
        :is="shareRoute ? RouterLink : 'div'"
        v-bind="shareRoute ? { to: shareRoute } : {}"
        class="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] transition-colors group overflow-hidden"
      >
        <div class="w-9 h-9 flex-shrink-0 aspect-square">
          <AppImage
            :src="shareCover"
            :alt="shareTitle"
            :type="shareImageType"
            :initial="shareInitial"
            rounded="lg"
            class="w-full h-full"
          />
        </div>
        <div class="flex-1 min-w-0 overflow-hidden">
          <p
            class="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors"
          >
            {{ shareTitle }}
          </p>
          <p v-if="shareSubtitle" class="text-[11px] text-muted truncate">
            {{ shareSubtitle }}
          </p>
        </div>
      </component>

      <div v-if="editing" class="space-y-2">
        <textarea
          v-model="editText"
          rows="3"
          class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] resize-none focus:outline-none focus:border-primary transition-colors"
          placeholder="Escreva um comentário..."
        />
        <p v-if="editError" class="text-xs text-red-400">{{ editError }}</p>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelEdit"
            class="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted hover:text-white rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X class="w-3.5 h-3.5" /> Cancelar
          </button>
          <button
            @click="saveEdit"
            :disabled="saving"
            class="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            <Check v-else class="w-3.5 h-3.5" />
            Salvar
          </button>
        </div>
      </div>

      <p
        v-else-if="displayComment"
        class="text-xs text-[var(--color-text)] leading-relaxed line-clamp-2"
      >
        "{{ displayComment }}"
      </p>
    </template>
  </article>
</template>
