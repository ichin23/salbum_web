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
  RefreshCw,
  Zap,
  Menu,
  X,
  PencilLine,
  User,
} from "lucide-vue-next";
import { fetchReleaseDetails, syncAlbum, fetchAlbumImage } from "../services/fetchService";
import { updateAlbum } from "../services/albumService";
import { getAlbumReviews } from "../services/reviewService";
import { getQuickReviewsByAlbum } from "../services/quickReviewService";
import { useSeoMeta } from "../composables/useSeoMeta";
import { useJsonLd, buildMusicAlbumSchema } from "../composables/useJsonLd";
import type { FetchAlbumDetails, FullReviewDTO, ReviewDTO, FullQuickReviewDTO, QuickReviewDTO } from "../types";
import AppImage from "../components/AppImage.vue";
import MusicShareModal from "../components/share/MusicShareModal.vue";
import ReviewCard from "../components/review/ReviewCard.vue";
import QuickReviewCard from "../components/review/QuickReviewCard.vue";
import QuickReviewForm from "../components/review/QuickReviewForm.vue";
import type { QuickReviewFormTarget } from "../components/review/QuickReviewForm.vue";

import type { ShareTarget } from "../components/share/MusicShareModal.vue";
import { useListenList, fetchListenList } from "../composables/useListenList";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

// ─── State ────────────────────────────────────────────────────────────────────
const album = ref<FetchAlbumDetails | null>(null);
const userReview = ref<ReviewDTO | null>(null);
const reviews = ref<FullReviewDTO[]>([]);
const quickReviews = ref<FullQuickReviewDTO[]>([]);
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

    // SEO meta after data loads
    if (album.value) {
      const artistList = album.value.artists.map((a) => a.name).join(", ");
      useSeoMeta({
        title: computed(() => `${album.value?.name ?? "Álbum"} por ${artistList}`),
        description: computed(() => {
          const a = album.value;
          if (!a) return "";
          const parts = [`${a.name} de ${artistList}`];
          if (a.release_date) parts.push(`Lançado em ${new Date(a.release_date).getFullYear()}`);
          if (a.rate != null) parts.push(`Nota: ${a.rate.toFixed(1)}/10`);
          if (a.genres?.length) parts.push(`Gêneros: ${a.genres.join(", ")}`);
          return parts.join(". ") + ". Avalie e compartilhe no Salbum.";
        }),
        image: computed(() => album.value?.image_url || null),
        type: "music.album",
      });

      useJsonLd(computed(() => buildMusicAlbumSchema({
        name: album.value!.name,
        artists: album.value!.artists.map(a => ({ name: a.name })),
        image_url: album.value!.image_url,
        release_date: album.value!.release_date,
        genres: album.value!.genres,
        rate: album.value!.rate,
        spotify_url: album.value!.spotify_url,
        url: window.location.href,
      })));
    }

    if (!album.value.image_url || album.value.image_url.endsWith('/null')) {
      fetchAlbumImage(albumId)
        .then((res) => {
          if (res.imageUrl && album.value) {
            album.value.image_url = res.imageUrl;
            const musics = album.value.musics.map(m => ({
              name: m.name,
              position: m.position,
              length: m.length,
              artistIds: m.artists.map(a => a.id)
            }));
            updateAlbum(albumId, {
              name: album.value.name,
              type: album.value.type,
              country: album.value.country,
              release_date: album.value.release_date,
              artistIds: album.value.artists.map(a => a.id),
              genres: album.value.genres || [],
              image_url: res.imageUrl,
              musics: musics
            }).catch(console.error);
          }
        })
        .catch(() => {});
    }

    // Load reviews in the background (non-blocking)
    getAlbumReviews(albumId)
      .then((r) => {
        reviews.value = r;
      })
      .catch(() => {});

    // Load quick reviews in the background
    getQuickReviewsByAlbum(albumId)
      .then((qr) => {
        quickReviews.value = qr;
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

// ─── Actions bottom sheet (mobile) ────────────────────────────────────────────
const showActionsSheet = ref(false);

// ─── Quick Review modal ──────────────────────────────────────────────────────
const quickReviewTarget = ref<QuickReviewFormTarget | null>(null);
const quickReviewToEdit = ref<QuickReviewDTO | null>(null);

const userQuickReview = computed(() =>
  quickReviews.value.find((qr) => qr.quickReview?.user?.id === auth.user?.id)?.quickReview ?? null,
);

const showQuickReviewForm = ref(false);

function openQuickReviewForm() {
  if (!album.value) return;
  quickReviewTarget.value = {
    targetType: 'ALBUM',
    albumId: Number(album.value.id),
    albumTitle: album.value.name,
    albumCover: getCover(album.value.image_url) || null,
    artistNames: artistNames.value,
    tracks: album.value.musics.map((m) => ({
      id: String(m.id),
      name: m.name,
      position: m.position,
    })),
  };
  quickReviewToEdit.value = userQuickReview.value;
  showQuickReviewForm.value = true;
}

function openQuickReviewFormForMusic(music: FetchAlbumDetails["musics"][number]) {
  if (!album.value) return;
  quickReviewTarget.value = {
    targetType: 'MUSIC',
    albumId: Number(album.value.id),
    albumTitle: album.value.name,
    albumCover: getCover(album.value.image_url) || null,
    artistNames: artistNames.value,
    musicId: Number(music.id),
    musicName: music.name,
    tracks: album.value.musics.map((m) => ({
      id: String(m.id),
      name: m.name,
      position: m.position,
    })),
  };
  quickReviewToEdit.value = null;
  showQuickReviewForm.value = true;
}

function onQuickReviewSaved(_review: QuickReviewDTO) {
  showQuickReviewForm.value = false;
  quickReviewTarget.value = null;
  quickReviewToEdit.value = null;
  // Refresh list
  const albumId = route.params.id as string;
  getQuickReviewsByAlbum(albumId)
    .then((qr) => {
      quickReviews.value = qr;
    })
    .catch(() => {});
}

function onQuickReviewDeleted(id: number) {
  quickReviews.value = quickReviews.value.filter((qr) => qr.quickReview?.id !== id);
}

function onQuickReviewEdit(review: QuickReviewDTO) {
  if (!album.value) return;
  quickReviewTarget.value = {
    targetType: 'ALBUM',
    albumId: Number(album.value.id),
    albumTitle: album.value.name,
    albumCover: getCover(album.value.image_url) || null,
    artistNames: artistNames.value,
    tracks: album.value.musics.map((m) => ({
      id: String(m.id),
      name: m.name,
      position: m.position,
    })),
  };
  quickReviewToEdit.value = review;
  showQuickReviewForm.value = true;
}

const isSyncing = ref(false);
const syncMessage = ref<string | null>(null);

async function handleSyncAlbum() {
  if (!album.value || isSyncing.value) return;
  isSyncing.value = true;
  syncMessage.value = null;
  try {
    await syncAlbum(album.value.id);
    syncMessage.value = "Em breve o álbum será atualizado.";
  } catch (e) {
    syncMessage.value = "Erro ao sincronizar.";
  } finally {
    isSyncing.value = false;
    setTimeout(() => {
      syncMessage.value = null;
    }, 5000);
  }
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

const sortedDiscs = computed(() => {
  if (!album.value) return [];
  if (album.value.discs && Object.keys(album.value.discs).length > 0) {
    const keys = Object.keys(album.value.discs).sort((a, b) => Number(a) - Number(b));
    return keys.map(key => ({
      discNumber: key,
      tracks: album.value!.discs![key]
    }));
  }
  // Fallback
  if (album.value.musics && album.value.musics.length > 0) {
    return [{
      discNumber: '1',
      tracks: album.value.musics
    }];
  }
  return [];
});
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
        v-if="album.image_url && !album.image_url.endsWith('/null')"
        class="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
        :style="{ backgroundImage: `url(${album.image_url})` }"
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
            <div v-if="album?.artists?.length" class="text-lg text-muted font-medium block">
              <template v-for="(artist, index) in album.artists" :key="artist.id">
                <RouterLink
                  :to="{ name: 'artist-detail', params: { id: artist.id } }"
                  class="hover:text-white transition-colors"
                >
                  {{ artist.name }}
                </RouterLink>
                <span v-if="index < album.artists.length - 1">, </span>
              </template>
            </div>
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
              <!-- Mobile: single action button -->
              <div class="sm:hidden ml-auto">
                <button
                  @click="showActionsSheet = true"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] transition-all"
                >
                  <Menu class="w-4 h-4" />
                  Ações
                </button>
              </div>

              <!-- Desktop: organized button group -->
              <div class="hidden sm:flex items-center gap-2 sm:ml-auto">
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

                <div class="w-px h-6 bg-[var(--color-border)] mx-1" />

                <button
                  @click="openQuickReviewForm"
                  class="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all"
                  :class="
                    userQuickReview
                      ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25'
                      : 'bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] hover:bg-[var(--color-surface)]'
                  "
                >
                  <Zap class="w-4 h-4" />
                  {{ userQuickReview ? "Editar rápida" : "Avaliação rápida" }}
                </button>
                <RouterLink
                  :to="{ name: 'write-review', params: { id: album.id } }"
                  class="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                >
                  <PencilLine class="w-4 h-4" />
                  Review
                </RouterLink>

                <div class="w-px h-6 bg-[var(--color-border)] mx-1" />

                <RouterLink
                  :to="{ name: 'edit-album', params: { id: album.id } }"
                  class="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-all"
                >
                  <Pencil class="w-3.5 h-3.5" />
                  <span class="hidden xl:inline">Editar</span>
                </RouterLink>
                <button
                  @click="handleSyncAlbum"
                  :disabled="isSyncing"
                  class="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw :class="{'w-4 h-4': true, 'animate-spin': isSyncing}" />
                  <span class="hidden xl:inline">Sincronizar</span>
                </button>
              </div>
            </div>
            
            <!-- Sync message -->
            <div v-if="syncMessage" class="text-sm mt-2 text-primary font-medium" :class="{ 'text-red-400': syncMessage.includes('Erro') }">
              {{ syncMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo -->
    <div class="px-4 sm:px-8 pb-12 space-y-8 sm:space-y-10">

      <!-- Tracklist + Artist Sidebar -->
      <section v-if="sortedDiscs.length > 0">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8">
          <!-- Tracklist column -->
          <div>
            <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Music class="w-5 h-5 text-primary" />
              Músicas
              <span class="text-muted font-normal text-base">({{ album.musics.length }})</span>
            </h2>
            <div class="space-y-6">
              <div v-for="disc in sortedDiscs" :key="disc.discNumber">
                <h3 v-if="sortedDiscs.length > 1" class="text-md font-semibold text-white mb-3 ml-1">
                  Disco {{ disc.discNumber }}
                </h3>
                <div class="card overflow-hidden">
                  <div class="divide-y divide-[var(--color-border)]">
                    <div
                      v-for="music in disc.tracks"
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
                          class="w-7 h-7 flex items-center justify-center rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
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
                          class="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-white hover:bg-[var(--color-surface)] transition-all sm:opacity-0 sm:group-hover:opacity-100"
                          title="Compartilhar"
                        >
                          <Share2 class="w-3.5 h-3.5" />
                        </button>
                        <button
                          @click="openQuickReviewFormForMusic(music)"
                          class="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-yellow-400 hover:bg-[var(--color-surface)] transition-all sm:opacity-0 sm:group-hover:opacity-100"
                          title="Avaliação rápida"
                        >
                          <Zap class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Artist sidebar -->
          <div class="space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wider">Artistas</p>
            <router-link
              v-for="artist in album.artists"
              :key="artist.id"
              :to="{ name: 'artist-detail', params: { id: artist.id } }"
              class="flex flex-col items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 hover:border-[var(--color-muted)]/40 transition-colors text-center"
            >
              <div class="w-14 h-14 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center overflow-hidden">
                <img
                  v-if="artist.image_url && !artist.image_url.endsWith('/null')"
                  :src="artist.image_url"
                  :alt="artist.name"
                  class="w-full h-full object-cover"
                />
                <User v-else class="w-6 h-6 text-muted" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ artist.name }}</p>
                <p v-if="artist.country" class="text-xs text-muted truncate">{{ artist.country }}</p>
              </div>
            </router-link>
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

      <!-- Quick Reviews -->
      <section>
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <Zap class="w-5 h-5 text-yellow-400" />
            Avaliações Rápidas
            <span
              v-if="quickReviews.length"
              class="text-muted font-normal text-base ml-1"
              >({{ quickReviews.length }})</span
            >
          </h2>
          <button
            @click="openQuickReviewForm"
            class="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all"
            :class="
              userQuickReview
                ? 'bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25'
                : 'bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] hover:bg-[var(--color-surface)]'
            "
          >
            <Zap class="w-4 h-4" />
            {{ userQuickReview ? "Editar avaliação" : "Avaliação rápida" }}
          </button>
        </div>

        <!-- Quick Review list -->
        <div v-if="quickReviews.length" class="space-y-4">
          <QuickReviewCard
            v-for="item in quickReviews"
            :key="item.quickReview?.id"
            :item="item"
            @deleted="onQuickReviewDeleted"
            @edit="onQuickReviewEdit"
          />
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center py-12 text-center">
          <div
            class="w-14 h-14 bg-[var(--color-surface)] rounded-3xl flex items-center justify-center mb-3"
          >
            <Zap class="w-7 h-7 text-muted" />
          </div>
          <p class="text-white font-semibold mb-1">Nenhuma avaliação rápida</p>
          <p class="text-muted text-sm">
            Avalie rapidamente com nota, sentimento e muito mais!
          </p>
          <button
            @click="openQuickReviewForm"
            class="btn-primary text-sm px-5 py-2 mt-4"
          >
            Fazer avaliação rápida
          </button>
        </div>
      </section>
    </div>
  </div>

  <QuickReviewForm
    v-if="showQuickReviewForm && quickReviewTarget"
    :target="quickReviewTarget"
    :existing-review="quickReviewToEdit"
    @close="showQuickReviewForm = false"
    @saved="onQuickReviewSaved"
  />

  <MusicShareModal
    v-if="shareTarget"
    :target="shareTarget"
    @close="shareTarget = null"
    @shared="onShared"
  />

  <!-- Mobile actions bottom sheet -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showActionsSheet"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 sm:hidden"
        @click.self="showActionsSheet = false"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
          appear
        >
          <div
            v-if="showActionsSheet"
            class="absolute bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] rounded-t-3xl shadow-2xl"
          >
            <!-- Handle -->
            <div class="flex items-center justify-between px-6 pt-4 pb-2">
              <div class="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto" />
              <button
                @click="showActionsSheet = false"
                class="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-all"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <div class="px-6 pb-8 space-y-6">
              <p class="text-sm font-semibold text-white">Ações</p>

              <!-- Review section -->
              <div class="space-y-1">
                <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-1">Avaliar</p>
                <button
                  @click="openQuickReviewForm(); showActionsSheet = false"
                  class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium transition-colors"
                  :class="
                    userQuickReview
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'text-white hover:bg-[var(--color-surface-2)]'
                  "
                >
                  <Zap class="w-5 h-5" />
                  <div class="text-left">
                    <p>{{ userQuickReview ? "Editar avaliação rápida" : "Avaliação rápida" }}</p>
                    <p class="text-xs text-muted font-normal">Nota, sentimento, foto</p>
                  </div>
                </button>
                <RouterLink
                  :to="{ name: 'write-review', params: { id: album!.id } }"
                  @click="showActionsSheet = false"
                  class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-white hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <PencilLine class="w-5 h-5 text-primary" />
                  <div class="text-left">
                    <p>Review completa</p>
                    <p class="text-xs text-muted font-normal">Música a música, sentimentos</p>
                  </div>
                </RouterLink>
              </div>

              <div class="h-px bg-[var(--color-border)]" />

              <!-- Actions section -->
              <div class="space-y-1">
                <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-1">Ações</p>
                <button
                  @click="
                    hasAlbum(album!.id)
                      ? removeAlbum(album!.id)
                      : addAlbum(album!.id);
                    showActionsSheet = false
                  "
                  class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium transition-colors"
                  :class="
                    hasAlbum(album!.id)
                      ? 'text-secondary'
                      : 'text-white hover:bg-[var(--color-surface-2)]'
                  "
                >
                  <BookmarkCheck v-if="hasAlbum(album!.id)" class="w-5 h-5" />
                  <BookmarkPlus v-else class="w-5 h-5" />
                  {{ hasAlbum(album!.id) ? "Remover da lista" : "Quero ouvir" }}
                </button>
                <button
                  @click="shareAlbum(); showActionsSheet = false"
                  class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-white hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <Share2 class="w-5 h-5" />
                  Compartilhar
                </button>
              </div>

              <div class="h-px bg-[var(--color-border)]" />

              <!-- Admin section -->
              <div class="space-y-1">
                <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-1">Outros</p>
                <RouterLink
                  :to="{ name: 'edit-album', params: { id: album!.id } }"
                  @click="showActionsSheet = false"
                  class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-white hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <Pencil class="w-5 h-5 text-muted" />
                  Editar álbum
                </RouterLink>
                <button
                  @click="handleSyncAlbum(); showActionsSheet = false"
                  :disabled="isSyncing"
                  class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-white hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
                >
                  <RefreshCw :class="{'w-5 h-5': true, 'animate-spin': isSyncing}" />
                  Sincronizar dados
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
