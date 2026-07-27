<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { RouterLink, useRouter } from "vue-router";
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
  Heart,
  ExternalLink,
  Zap,
} from "lucide-vue-next";
import type { ActivityItemDTO } from "../types";
import AppImage from "./AppImage.vue";
import EmotionChart from "./review/EmotionChart.vue";
import { useAuthStore } from "../stores/auth";
import { updateReview, deleteReview, likeReview, unlikeReview } from "../services/reviewService";
import {
  updateMusicShare,
  deleteMusicShare,
  likeMusicShare,
  unlikeMusicShare,
} from "../services/musicShareService";
import {
  likeQuickReview,
  unlikeQuickReview,
  deleteQuickReview,
} from "../services/quickReviewService";
import ShareImageModal from "./ShareImageModal.vue";
import ShareImageLayout from "./ShareImageLayout.vue";
import ShareMenu from "./share/ShareMenu.vue";
import { useShareImage } from "../composables/useShareImage";

const props = defineProps<{ item: ActivityItemDTO }>();
const emit = defineEmits<{ (e: "deleted", id: string): void }>();

const auth = useAuthStore();
const router = useRouter();

const isReview = computed(
  () => props.item.type === "REVIEW" || props.item.type === "RATING",
);
const isShare = computed(() => props.item.type === "MUSIC_SHARE");
const isQuickReview = computed(() => props.item.type === "QUICK_REVIEW");

const review = computed(() => props.item.review);
const shareFull = computed(() => props.item.musicShare);
const share = computed(() => shareFull.value?.musicShare ?? null);
const quickReview = computed(() => props.item.quickReview?.quickReview ?? null);

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
  if (s.music) return (s.music.album?.name ?? "") + " • " + s.music.album?.artists?.map((a) => a.name).join(", ");
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
  if (isShare.value) return share.value?.user;
  if (isQuickReview.value) return quickReview.value?.user;
  return null;
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

const showShareModal = ref(false);
const showShareMenu = ref(false);
const shareMenuPostType = ref<"review" | "quick_review" | "music_share">("review");
const sharePostType = ref<"review" | "quick_review" | "music_share">("review");
const shareReview = computed(() => props.item.review);
const shareQuickReview = computed(() => props.item.quickReview);
const shareMusicShare = computed(() => props.item.musicShare);
const shareLayoutRef = ref<InstanceType<typeof ShareImageLayout> | null>(null);
const shareBackground = ref<'cartaz' | 'fita' | 'estudio'>('cartaz');
const { state: shareState, setElement, generate, reset } = useShareImage(2);
const shareBlob = computed(() => shareState.value.blob);

async function openShareImage(type: "review" | "quick_review" | "music_share") {
  sharePostType.value = type;
  shareBackground.value = 'cartaz';
  showShareModal.value = true;
  reset();
  await generateShareImage();
}

const shareMenuUrl = computed(() => {
  const origin = window.location.origin;
  if (isReview.value && review.value) {
    return `${origin}/review/${review.value.review.id}`;
  }
  if (isShare.value && share.value) {
    return `${origin}/share/${share.value.id}`;
  }
  if (isQuickReview.value && quickReview.value) {
    return `${origin}/quick-review/${quickReview.value.id}`;
  }
  return window.location.href;
});

function openShareMenu(type: "review" | "quick_review" | "music_share") {
  shareMenuPostType.value = type;
  showShareMenu.value = true;
}

async function onShareMenuOpenImage() {
  await openShareImage(shareMenuPostType.value);
}

async function generateShareImage() {
  reset();
  await nextTick();
  if (shareLayoutRef.value?.$el) {
    setElement(shareLayoutRef.value.$el as HTMLElement);
  }
  await generate();
}

function onShareBackgroundChange(val: 'cartaz' | 'fita' | 'estudio') {
  shareBackground.value = val;
  generateShareImage();
}

function onShareModalClose() {
  showShareModal.value = false;
  reset();
}

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
    : isShare.value
      ? (share.value?.comment ?? "")
      : (quickReview.value?.considerations ?? "");
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
    } else if (isQuickReview.value && quickReview.value) {
      // Quick review editing via API not supported in feed context
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
    } else if (isQuickReview.value && quickReview.value) {
      await deleteQuickReview(String(quickReview.value.id));
      emit("deleted", String(quickReview.value.id));
    }
  } catch {
    deleting.value = false;
  }
}

const liked = ref(
  isReview.value
    ? (props.item.review?.likedByCurrentUser ?? false)
    : isShare.value
      ? (props.item.musicShare?.likedByCurrentUser ?? false)
      : (props.item.quickReview?.likedByCurrentUser ?? false)
);
const likeCount = ref(
  isReview.value
    ? (props.item.review?.likeCount ?? 0)
    : isShare.value
      ? (props.item.musicShare?.likeCount ?? 0)
      : (props.item.quickReview?.likeCount ?? 0)
);
const liking = ref(false);

async function toggleLike() {
  if (liking.value) return;

  if (isReview.value && review.value) {
    liking.value = true;
    try {
      if (liked.value) {
        await unlikeReview(review.value.review.id);
        liked.value = false;
        likeCount.value--;
      } else {
        await likeReview(review.value.review.id);
        liked.value = true;
        likeCount.value++;
      }
    } catch {
      // silently ignore
    } finally {
      liking.value = false;
    }
  } else if (isShare.value && share.value) {
    liking.value = true;
    try {
      if (liked.value) {
        await unlikeMusicShare(share.value.id);
        liked.value = false;
        likeCount.value--;
      } else {
        await likeMusicShare(share.value.id);
        liked.value = true;
        likeCount.value++;
      }
    } catch {
      // silently ignore
    } finally {
      liking.value = false;
    }
  } else if (isQuickReview.value && quickReview.value) {
    liking.value = true;
    try {
      if (liked.value) {
        await unlikeQuickReview(String(quickReview.value.id));
        liked.value = false;
        likeCount.value--;
      } else {
        await likeQuickReview(String(quickReview.value.id));
        liked.value = true;
        likeCount.value++;
      }
    } catch {
      // silently ignore
    } finally {
      liking.value = false;
    }
  }
}

function onCardClick() {
  closeMenu();
  if (isReview.value && review.value) {
    router.push({ name: 'review-detail', params: { id: review.value.review.id } });
  } else if (isShare.value && share.value) {
    router.push({ name: 'share-detail', params: { id: share.value.id } });
  } else if (isQuickReview.value && quickReview.value) {
    router.push({ name: 'quick-review-detail', params: { id: String(quickReview.value.id) } });
  }
}
</script>

<template>
  <article
    class="card p-3 space-y-2 hover:border-[var(--color-muted)]/30 transition-colors overflow-hidden relative cursor-pointer"
    :class="[
      deleting ? 'opacity-40 pointer-events-none' : '',
      'hover:border-primary/40'
    ]"
    @click="onCardClick"
  >
    <div class="flex items-center gap-2 min-w-0">
      <RouterLink
        v-if="user?.id"
        :to="{ name: 'user-profile', params: { id: user.id } }"
        class="flex items-center gap-2 min-w-0 group cursor-pointer"
        @click.stop
      >
        <div class="w-7 h-7 flex-shrink-0 aspect-square">
          <AppImage
            :src="user?.imageUrl ?? null"
            :alt="user?.username ?? ''"
            :initial="(user?.username?.[0] ?? '?').toUpperCase()"
            type="artist"
            rounded="full"
            class="w-full h-full transition-transform group-hover:scale-105"
          />
        </div>
        <div class="flex-1 min-w-0 overflow-hidden">
          <p class="text-xs font-semibold text-white truncate leading-none group-hover:text-primary transition-colors">
            {{ user?.name ?? user?.username }}
          </p>
          <p class="text-[11px] text-muted mt-0.5 leading-none truncate">
            {{ formattedDate }}
          </p>
        </div>
      </RouterLink>
      <div v-else class="flex items-center gap-2 min-w-0">
        <div class="w-7 h-7 flex-shrink-0 aspect-square">
          <AppImage
            :src="null"
            alt=""
            initial="?"
            type="artist"
            rounded="full"
            class="w-full h-full"
          />
        </div>
        <div class="flex-1 min-w-0 overflow-hidden">
          <p class="text-xs font-semibold text-white truncate leading-none">
            Usuário
          </p>
          <p class="text-[11px] text-muted mt-0.5 leading-none truncate">
            {{ formattedDate }}
          </p>
        </div>
      </div>
      <span
        class="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap border"
        :class="
          isReview
            ? 'bg-primary/10 text-primary border-primary/20'
            : isShare
              ? 'bg-secondary/10 text-secondary border-secondary/20'
              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        "
      >
        <MessageSquare v-if="isReview" class="w-2.5 h-2.5 flex-shrink-0" />
        <Share2 v-else-if="isShare" class="w-2.5 h-2.5 flex-shrink-0" />
        <Zap v-else class="w-2.5 h-2.5 flex-shrink-0" />
        {{ isReview ? "Review" : isShare ? "Compartilhou" : "Quick Review" }}
      </span>

      <div v-if="isOwner" class="relative flex-shrink-0" @click.stop>
        <button
          @click="openMenu"
          class="p-1 rounded-lg text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <MoreHorizontal class="w-4 h-4" />
        </button>
        <div
          v-if="menuOpen"
          class="absolute right-0 top-full mt-1 z-20 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden"
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

    <div v-if="menuOpen" class="fixed inset-0 z-10" @click.stop="closeMenu" />

    <template v-if="isReview && review">
      <RouterLink
        :to="{ name: 'album-detail', params: { id: review.review.album.id } }"
        class="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] transition-colors group overflow-hidden"
        @click.stop
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

      <div
        v-if="!editing"
        class="flex items-center gap-4 pt-1 border-t border-[var(--color-border)] mt-2"
      >
        <button
          @click.stop="toggleLike"
          class="flex items-center gap-1.5 text-xs transition-colors"
          :class="liked ? 'text-red-400' : 'text-muted hover:text-red-400'"
          :disabled="liking"
        >
          <Heart class="w-4 h-4" :fill="liked ? 'currentColor' : 'none'" />
          {{ likeCount }}
        </button>

        <span class="flex items-center gap-1.5 text-xs text-muted">
          <MessageSquare class="w-3.5 h-3.5" />
          {{ review.commentCount }}
        </span>
        <button
          @click.stop="openShareMenu('review')"
          class="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors ml-auto"
          title="Compartilhar"
        >
          <Share2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </template>

    <template v-if="isQuickReview && quickReview">
      <!-- Album -->
      <RouterLink
        v-if="quickReview.album"
        :to="{ name: 'album-detail', params: { id: quickReview.album.id } }"
        class="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] transition-colors group overflow-hidden"
        @click.stop
      >
        <div class="w-9 h-9 flex-shrink-0 aspect-square">
          <AppImage
            :src="quickReview.album.image_url ?? ''"
            :alt="quickReview.album.name"
            type="album"
            :initial="quickReview.album.name?.charAt(0).toUpperCase() ?? '?'"
            rounded="lg"
            class="w-full h-full"
          />
        </div>
        <div class="flex-1 min-w-0 overflow-hidden">
          <p class="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
            {{ quickReview.album.name }}
          </p>
          <p v-if="quickReview.album.artists?.length" class="text-[11px] text-muted truncate">
            {{ quickReview.album.artists.map(a => a.name).join(', ') }}
          </p>
        </div>
      </RouterLink>

      <div class="flex items-center gap-1.5">
        <div class="flex items-center gap-1">
          <Star
            v-for="i in 5"
            :key="i"
            class="w-3.5 h-3.5"
            :class="i <= quickReview.score ? 'text-yellow-400' : 'text-muted/30'"
          />
        </div>
        <span class="text-xs text-muted ml-1">{{ quickReview.score }}/5</span>
      </div>

      <!-- Sentiment badge -->
      <div v-if="quickReview.sentiment" class="flex items-center gap-2">
        <span
          class="text-xs font-medium px-3 py-1 rounded-full border bg-primary/10 border-primary/25 text-primary"
        >
          {{ quickReview.sentiment }}
        </span>
      </div>

      <!-- Photo -->
      <div v-if="quickReview.photoUrl" class="rounded-2xl overflow-hidden">
        <img
          :src="quickReview.photoUrl"
          alt="Quick review photo"
          class="w-full max-h-64 object-cover"
        />
      </div>

      <!-- Favorite track -->
      <div
      v-if="quickReview.favoriteTrack"
      class="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-3"
    >
      <p class="text-xs text-muted font-medium mb-1">Faixa favorita</p>
      <p class="text-xs text-white font-semibold">
        {{ quickReview.favoriteTrack.name }}
      </p>
        <p v-if="quickReview.favoriteTrackComment" class="text-xs text-muted mt-1">
          {{ quickReview.favoriteTrackComment }}
        </p>
      </div>

      <!-- Considerations -->
      <p
        v-if="quickReview.considerations"
        class="text-xs text-[var(--color-text)] leading-relaxed line-clamp-2"
      >
        {{ quickReview.considerations }}
      </p>

      <div
        v-if="!editing"
        class="flex items-center gap-4 pt-1 border-t border-[var(--color-border)] mt-2"
        @click.stop
      >
        <button
          @click.stop="toggleLike"
          class="flex items-center gap-1.5 text-xs transition-colors"
          :class="liked ? 'text-red-400' : 'text-muted hover:text-red-400'"
          :disabled="liking"
        >
          <Heart class="w-4 h-4" :fill="liked ? 'currentColor' : 'none'" />
          {{ likeCount }}
        </button>

        <span class="flex items-center gap-1.5 text-xs text-muted">
          <MessageSquare class="w-3.5 h-3.5" />
          {{ props.item.quickReview?.commentCount ?? 0 }}
        </span>
        <button
          @click.stop="openShareMenu('quick_review')"
          class="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors ml-auto"
          title="Compartilhar"
        >
          <Share2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </template>

    <template v-if="isShare && share">
      <RouterLink
        v-if="shareRoute"
        :to="shareRoute"
        class="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] transition-colors group overflow-hidden"
        @click.stop
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
      </RouterLink>
      <div
        v-else
        class="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-surface-2)] overflow-hidden"
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
          <p class="text-xs font-semibold text-white truncate">
            {{ shareTitle }}
          </p>
          <p v-if="shareSubtitle" class="text-[11px] text-muted truncate">
            {{ shareSubtitle }}
          </p>
        </div>
      </div>

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

      <div
        v-if="!editing"
        class="flex items-center gap-4 pt-1 border-t border-[var(--color-border)] mt-2"
        @click.stop
      >
        <button
          @click.stop="toggleLike"
          class="flex items-center gap-1.5 text-xs transition-colors"
          :class="liked ? 'text-red-400' : 'text-muted hover:text-red-400'"
          :disabled="liking"
        >
          <Heart class="w-4 h-4" :fill="liked ? 'currentColor' : 'none'" />
          {{ likeCount }}
        </button>

        <span class="flex items-center gap-1.5 text-xs text-muted">
          <MessageSquare class="w-3.5 h-3.5" />
          {{ shareFull?.commentCount ?? 0 }}
        </span>
        <button
          @click.stop="openShareMenu('music_share')"
          class="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors ml-auto"
          title="Compartilhar"
        >
          <Share2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </template>

    <!-- Hidden share image layout -->
    <div style="position: fixed; left: -9999px; top: 0; width: 1080px; height: 1350px; pointer-events: none; z-index: -1;">
      <ShareImageLayout
        ref="shareLayoutRef"
        :post-type="sharePostType"
        :review="shareReview"
        :quick-review="shareQuickReview"
        :music-share="shareMusicShare"
        :background="shareBackground"
      />
    </div>

    <ShareMenu
      :show="showShareMenu"
      :url="shareMenuUrl"
      @close="showShareMenu = false"
      @open-image="onShareMenuOpenImage"
    />

    <ShareImageModal
      :show="showShareModal"
      :state="shareState"
      :blob="shareBlob"
      :background="shareBackground"
      @close="onShareModalClose"
      @update:background="onShareBackgroundChange"
    />
  </article>
</template>
