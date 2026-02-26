<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  Star,
  Music,
  MessageSquare,
  BarChart3,
  Disc3,
  Share2,
  BookmarkPlus,
  BookmarkCheck,
  Loader2,
  AlertCircle,
  Pencil,
} from "lucide-vue-next";
import { fetchReleaseDetails } from "../services/fetchService";
import { getAlbumReviews } from "../services/reviewService";
import type { FetchAlbumDetails, FullReviewDTO, ReviewDTO } from "../types";
import AppImage from "../components/AppImage.vue";
import MusicShareModal from "../components/share/MusicShareModal.vue";
import ReviewCard from "../components/review/ReviewCard.vue";
import type { ShareTarget } from "../components/share/MusicShareModal.vue";
import { useListenList, fetchListenList } from "../composables/useListenList";

const route = useRoute();
const router = useRouter();

// ─── State ────────────────────────────────────────────────────────────────────
const album = ref<FetchAlbumDetails | null>(null);
const userReview = ref<ReviewDTO | null>(null);
const reviews = ref<FullReviewDTO[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const PLACEHOLDER_IMG = "";

function getCover(img: string | null): string {
  if (img && !img.endsWith("/null")) return img;
  return PLACEHOLDER_IMG;
}

// ─── Load ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const albumId = route.params.id as string;
    const [data] = await Promise.all([
      fetchReleaseDetails(albumId),
      fetchListenList(),
    ]);
    album.value = data.album;
    userReview.value = data.userReview;
    // Load reviews in the background (non-blocking)
    getAlbumReviews(albumId)
      .then((r) => {
        reviews.value = r;
      })
      .catch(() => {});
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao carregar álbum";
  } finally {
    loading.value = false;
  }
});

// ─── Listen List ──────────────────────────────────────────────────────────────
const { hasMusic, addMusic, removeMusic, hasAlbum, addAlbum, removeAlbum } =
  useListenList();

// ─── Share modal ─────────────────────────────────────────────────────────────
const shareTarget = ref<ShareTarget | null>(null);

function shareAlbum() {
  if (!album.value) return;
  shareTarget.value = {
    type: "album",
    id: album.value.id,
    title: album.value.name,
    subtitle: album.value.artists.map((a) => a.name).join(", "),
    coverUrl: getCover(album.value.image_url) || null,
  };
}

function shareTrack(music: FetchAlbumDetails["musics"][number]) {
  if (!album.value) return;
  shareTarget.value = {
    type: "music",
    id: music.id,
    title: music.name,
    subtitle: `Faixa ${music.position} · ${album.value.name}`,
    coverUrl: getCover(album.value.image_url) || null,
  };
}

function onShared(comment: string) {
  console.log("MusicShare submitted:", shareTarget.value, comment);
  shareTarget.value = null;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabKey = "all" | "comment" | "rating" | "music-by-music";
const activeTab = ref<TabKey>("all");
const tabs: { key: TabKey; label: string; icon: typeof Star }[] = [
  { key: "all", label: "Todos", icon: Disc3 },
  { key: "comment", label: "Comentários", icon: MessageSquare },
  { key: "rating", label: "Notas", icon: BarChart3 },
  { key: "music-by-music", label: "Música a Música", icon: Music },
];

// ─── Reviews filtering ───────────────────────────────────────────────────────
const filteredReviews = computed(() => {
  switch (activeTab.value) {
    case "comment":
      return reviews.value.filter((r) => r.review.content);
    case "rating":
      return reviews.value.filter((r) => r.review.albumScore != null);
    case "music-by-music":
      return reviews.value.filter((r) => r.review.trackScores?.length);
    default:
      return reviews.value;
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const totalDuration = computed(() => {
  if (!album.value) return "";
  const totalMs = album.value.musics.reduce((acc, m) => acc + m.length, 0);
  return `${Math.floor(totalMs / 60000)} min`;
});

const releaseYear = computed(() => {
  if (!album.value?.release_date) return null;
  return new Date(album.value.release_date).getFullYear();
});

const artistNames = computed(
  () => album.value?.artists.map((a) => a.name).join(", ") ?? "",
);

const firstArtistId = computed(() => album.value?.artists[0]?.id ?? null);
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
    <Loader2 class="w-8 h-8 text-primary animate-spin" />
  </div>

  <!-- Erro -->
  <div
    v-else-if="error"
    class="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8"
  >
    <div
      class="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center"
    >
      <AlertCircle class="w-8 h-8 text-red-400" />
    </div>
    <h3 class="text-lg font-semibold text-white">Erro ao carregar álbum</h3>
    <p class="text-muted text-sm">{{ error }}</p>
    <button @click="router.back()" class="btn-primary text-sm px-5 py-2">
      Voltar
    </button>
  </div>

  <!-- Conteúdo -->
  <div v-else-if="album" class="min-h-full">
    <!-- Hero -->
    <div class="relative">
      <div
        class="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
        :style="{ backgroundImage: `url(${getCover(album.image_url)})` }"
      />
      <div
        class="absolute inset-0 bg-gradient-to-b from-dark/40 via-dark/70 to-dark"
      />

      <div class="relative px-4 sm:px-8 pt-6 sm:pt-8 pb-8 sm:pb-12">
        <button
          @click="router.back()"
          class="flex items-center gap-2 text-muted hover:text-white transition-colors mb-8 text-sm"
        >
          <ArrowLeft class="w-4 h-4" />
          Voltar
        </button>

        <div class="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:items-end">
          <div class="w-28 h-28 sm:w-44 sm:h-44 flex-shrink-0 shadow-2xl">
            <AppImage
              :src="album.image_url"
              :alt="album.name"
              type="album"
              rounded="2xl"
              class="w-full h-full"
            />
          </div>
          <div class="space-y-3 pb-1">
            <span
              class="text-xs font-medium text-muted uppercase tracking-widest"
              >Álbum</span
            >
            <h1
              class="text-2xl sm:text-4xl font-black text-white leading-tight"
            >
              {{ album.name }}
            </h1>
            <RouterLink
              v-if="firstArtistId"
              :to="{ name: 'artist-detail', params: { id: firstArtistId } }"
              class="text-lg text-muted font-medium hover:text-white transition-colors block"
            >
              {{ artistNames }}
            </RouterLink>
            <p v-else class="text-lg text-muted font-medium">
              {{ artistNames }}
            </p>

            <div
              class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted"
            >
              <span v-if="releaseYear">{{ releaseYear }}</span>
              <template v-if="album.type">
                <span>·</span>
                <span>{{ album.type }}</span>
              </template>
              <template v-if="album.musics.length">
                <span>·</span>
                <span>{{ album.musics.length }} músicas</span>
                <span>·</span>
                <span>{{ totalDuration }}</span>
              </template>
            </div>

            <!-- Géneros -->
            <div v-if="album.genres?.length" class="flex flex-wrap gap-2 pt-1">
              <span
                v-for="g in album.genres"
                :key="g"
                class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                >{{ g }}</span
              >
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <div v-if="album.rate" class="flex items-center gap-3">
                <div
                  class="flex items-center gap-2 bg-dark/50 backdrop-blur-sm border border-[var(--color-border)] rounded-2xl px-4 py-2"
                >
                  <Star class="w-4 h-4 text-yellow-400" fill="currentColor" />
                  <span class="text-white font-bold text-xl">{{
                    album.rate.toFixed(1)
                  }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 sm:ml-auto flex-wrap">
                <button
                  @click="
                    hasAlbum(album.id)
                      ? removeAlbum(album.id)
                      : addAlbum(album.id)
                  "
                  class="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium border transition-all"
                  :class="
                    hasAlbum(album.id)
                      ? 'bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25'
                      : 'bg-[var(--color-surface-2)] text-muted hover:text-white border-[var(--color-border)] hover:bg-[var(--color-surface)]'
                  "
                >
                  <BookmarkCheck v-if="hasAlbum(album.id)" class="w-4 h-4" />
                  <BookmarkPlus v-else class="w-4 h-4" />
                  {{ hasAlbum(album.id) ? "Na lista" : "Quero ouvir" }}
                </button>
                <button
                  @click="shareAlbum"
                  class="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-all"
                >
                  <Share2 class="w-4 h-4" />
                  Compartilhar
                </button>
                <RouterLink
                  :to="{ name: 'edit-album', params: { id: album.id } }"
                  class="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-all"
                >
                  <Pencil class="w-4 h-4" />
                  Editar
                </RouterLink>
                <RouterLink
                  :to="{ name: 'write-review', params: { id: album.id } }"
                  class="btn-primary text-sm px-4 py-2"
                >
                  Escrever review
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo -->
    <div class="px-4 sm:px-8 pb-12 space-y-8 sm:space-y-10">
      <!-- Tracklist -->
      <section v-if="album.musics.length">
        <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Music class="w-5 h-5 text-primary" />
          Músicas
        </h2>
        <div class="card overflow-hidden">
          <div class="divide-y divide-[var(--color-border)]">
            <div
              v-for="music in album.musics"
              :key="music.id"
              class="flex items-center gap-4 px-5 py-3 hover:bg-[var(--color-surface-2)] transition-colors group"
            >
              <span
                class="w-5 text-center text-xs text-muted font-mono flex-shrink-0"
              >
                {{ music.position }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">
                  {{ music.name }}
                </p>
                <p class="text-xs text-muted truncate">
                  {{ music.artists.map((a) => a.name).join(", ") }}
                </p>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <span class="text-xs text-muted font-mono mr-2">{{
                  formatDuration(music.length)
                }}</span>
                <button
                  @click="
                    hasMusic(music.id)
                      ? removeMusic(music.id)
                      : addMusic(music.id)
                  "
                  class="w-7 h-7 flex items-center justify-center rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  :class="
                    hasMusic(music.id)
                      ? 'text-secondary bg-secondary/10 hover:bg-secondary/20'
                      : 'text-muted hover:text-white hover:bg-[var(--color-surface)]'
                  "
                  :title="hasMusic(music.id) ? 'Na lista' : 'Quero ouvir'"
                >
                  <BookmarkCheck
                    v-if="hasMusic(music.id)"
                    class="w-3.5 h-3.5"
                  />
                  <BookmarkPlus v-else class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="shareTrack(music)"
                  class="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-white hover:bg-[var(--color-surface)] transition-all opacity-0 group-hover:opacity-100"
                  title="Compartilhar"
                >
                  <Share2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Reviews -->
      <section>
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold text-white">
            Reviews
            <span
              v-if="reviews.length"
              class="text-muted font-normal text-base ml-1"
              >({{ reviews.length }})</span
            >
          </h2>
          <!-- Edit/write button -->
          <RouterLink
            :to="{ name: 'write-review', params: { id: album.id } }"
            class="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-all"
          >
            <Pencil class="w-4 h-4" />
            {{ userReview ? "Editar review" : "Escrever review" }}
          </RouterLink>
        </div>

        <!-- Tabs -->
        <div
          class="flex gap-1 bg-[var(--color-surface)] rounded-2xl p-1 mb-6 overflow-x-auto"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap"
            :class="
              activeTab === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-white'
            "
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Review list -->
        <div v-if="filteredReviews.length" class="space-y-4">
          <ReviewCard
            v-for="item in filteredReviews"
            :key="item.review.id"
            :item="item"
            @deleted="
              (id) => {
                reviews = reviews.filter((r) => r.review.id !== id);
              }
            "
          />
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center py-16 text-center">
          <div
            class="w-16 h-16 bg-[var(--color-surface)] rounded-3xl flex items-center justify-center mb-4"
          >
            <MessageSquare class="w-8 h-8 text-muted" />
          </div>
          <p class="text-white font-semibold mb-1">Nenhuma review ainda</p>
          <p class="text-muted text-sm">
            Seja o primeiro a avaliar este álbum!
          </p>
          <RouterLink
            :to="{ name: 'write-review', params: { id: album.id } }"
            class="btn-primary text-sm px-5 py-2 mt-4"
          >
            Escrever review
          </RouterLink>
        </div>
      </section>
    </div>
  </div>

  <MusicShareModal
    v-if="shareTarget"
    :target="shareTarget"
    @close="shareTarget = null"
    @shared="onShared"
  />
</template>
