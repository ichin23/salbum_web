<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { Activity, Loader2, Users, ListMusic, Plus } from "lucide-vue-next";
import { useRouter } from "vue-router";
import RecentlyPlayedSection from "../components/spotify/RecentlyPlayedSection.vue";
import FeedItemCard from "../components/FeedItem.vue";
import AppImage from "../components/AppImage.vue";

import { getActivityFeed } from "../services/activityService";
import { useAuthStore } from "../stores/auth";
import { useListenList, fetchListenList } from "../composables/useListenList";
import { useSeoMeta } from "../composables/useSeoMeta";
import { useJsonLd, buildWebSiteSchema } from "../composables/useJsonLd";
import type { ActivityItemDTO, ListenListApiItem } from "../types";

const auth = useAuthStore();

useSeoMeta({
  title: "Feed - Descubra e avalie álbuns",
  description: "Veja as atividades recentes da comunidade Salbum. Descubra novos álbuns, reviews e compartilhamentos de música.",
})

useJsonLd(buildWebSiteSchema(window.location.origin))
const router = useRouter();

// ─── Feed state ───────────────────────────────────────────────────────────────
const feedItems = ref<ActivityItemDTO[]>([]);
const nextCursor = ref<string | null>(null);
const hasMore = ref(false);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const onlyFollowing = ref(false);

async function fetchFeed(reset = false) {
  if (reset) {
    loading.value = true;
    feedItems.value = [];
    nextCursor.value = null;
    hasMore.value = false;
    error.value = null;
  } else {
    if (!hasMore.value || loadingMore.value) return;
    loadingMore.value = true;
  }

  try {
    const res = await getActivityFeed({ 
      limit: 20, 
      cursor: nextCursor.value ?? undefined,
      onlyFollowing: onlyFollowing.value 
    });
    
    if (reset) {
      feedItems.value = res.data;
    } else {
      feedItems.value.push(...res.data);
    }
    
    nextCursor.value = res.nextCursor;
    hasMore.value = res.hasMore;
  } catch (e) {
    if (reset) {
      error.value = e instanceof Error ? e.message : "Erro ao carregar feed";
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

// ─── Listenlist Recommendations ────────────────────────────────────────────────
const { entries, loading: listenListLoading } = useListenList();
const recommendedItem = ref<ListenListApiItem | null>(null);

watch(entries, (val) => {
  if (val.length > 0 && !recommendedItem.value) {
    recommendedItem.value = val[Math.floor(Math.random() * Math.min(val.length, 5))] || null;
  } else if (val.length === 0) {
    recommendedItem.value = null;
  }
}, { immediate: true });

onMounted(() => {
  fetchFeed(true);
  if (entries.value.length === 0) {
    fetchListenList();
  }
});

function setMode(following: boolean) {
  if (onlyFollowing.value === following) return;
  onlyFollowing.value = following;
  fetchFeed(true);
}

async function loadMore() {
  fetchFeed(false);
}

// ─── Helpers for Recommendation ────────────────────────────────────────────────
function getSpotifyUrl(item: ListenListApiItem) {
  if (item.album) return item.album.spotify_url;
  if (item.music && item.music.album) return item.music.album.spotify_url;
  return null;
}
function getImage(item: ListenListApiItem) {
  if (item.album) return item.album.image_url;
  if (item.music && item.music.album) return item.music.album.image_url;
  if (item.artist) return item.artist.image_url;
  return null;
}
function getTitle(item: ListenListApiItem) {
  if (item.album) return item.album.name;
  if (item.music) return item.music.name;
  if (item.artist) return item.artist.name;
  return "";
}
function getSubtitle(item: ListenListApiItem) {
  if (item.album) return item.album.artists?.map(a => a.name).join(", ") ?? "";
  if (item.music) return item.music.artists?.map(a => a.name).join(", ") ?? "";
  if (item.artist) return item.artist.country ?? "";
  return "";
}
function goToItem(item: ListenListApiItem) {
  if (item.album) router.push(`/album/${item.album.id}`);
  else if (item.music && item.music.album) router.push(`/album/${item.music.album.id}`);
  else if (item.artist) router.push(`/artist/${item.artist.id}`);
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
    <!-- Container Flexbox (mais seguro contra quebras) -->
    <div class="flex flex-col lg:flex-row gap-8 xl:gap-12">
      
      <!-- Coluna Principal -->
      <div class="flex-1 min-w-0 space-y-8 lg:space-y-10">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-bold text-white">
            Olá, {{ auth.user?.name?.split(" ")[0] ?? "bem-vindo" }}! 👋
          </h1>
          <p class="text-muted text-sm mt-1">
            Descubra e avalie seus álbuns favoritos
          </p>
        </div>

        <!-- Ouvido recentemente (Spotify) -->
        <RecentlyPlayedSection v-if="auth.user?.spotify_linked" />

        <!-- Feed de atividades -->
        <section>
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-2 self-start sm:self-auto">
              <Activity class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-bold text-white">Feed de Atividades</h2>
            </div>
            
            <!-- Segmented Control Centralizado -->
            <div class="flex justify-center w-full sm:w-auto">
              <div class="relative flex items-center bg-[var(--color-surface-2)] rounded-full p-1 border border-[var(--color-border)]">
                <!-- Animated Background -->
                <div 
                  class="absolute top-1 bottom-1 left-1 bg-[var(--color-surface)] shadow-md border border-[var(--color-border)] rounded-full transition-transform duration-300 ease-out"
                  :class="onlyFollowing ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'"
                  style="width: calc(50% - 6px);"
                ></div>
                
                <button 
                  @click="setMode(false)"
                  class="relative z-10 px-4 py-1.5 text-sm font-medium transition-colors duration-300 rounded-full w-32 text-center"
                  :class="!onlyFollowing ? 'text-white' : 'text-muted hover:text-white'"
                >
                  Global
                </button>
                <button 
                  @click="setMode(true)"
                  class="relative z-10 px-4 py-1.5 text-sm font-medium transition-colors duration-300 rounded-full w-32 text-center"
                  :class="onlyFollowing ? 'text-white' : 'text-muted hover:text-white'"
                >
                  Seguindo
                </button>
              </div>
            </div>
            
            <!-- Empty div for flex spacing balance on desktop -->
            <div class="hidden sm:block w-[140px]"></div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-16">
            <Loader2 class="w-6 h-6 text-primary animate-spin" />
          </div>

          <!-- Error -->
          <div v-else-if="error" class="card p-6 text-center">
            <p class="text-muted text-sm">{{ error }}</p>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="feedItems.length === 0"
            class="card p-8 flex flex-col items-center text-center gap-3"
          >
            <div
              class="w-14 h-14 bg-[var(--color-surface-2)] rounded-3xl flex items-center justify-center"
            >
              <Users class="w-7 h-7 text-muted" />
            </div>
            <p class="text-white font-semibold">Nada por aqui ainda</p>
            <p class="text-muted text-sm">
              {{ onlyFollowing ? "Siga outros usuários para ver as atividades deles aqui." : "Nenhuma atividade encontrada no sistema." }}
            </p>
          </div>

          <!-- Feed list -->
          <div v-else class="space-y-4">
            <FeedItemCard
              v-for="(item, i) in feedItems"
              :key="
                item.type === 'REVIEW' || item.type === 'RATING'
                  ? (item.review?.review.id ?? i)
                  : (item.musicShare?.musicShare.id ?? i)
              "
              :item="item"
              @deleted="
                (id) => {
                  feedItems = feedItems.filter(
                    (f) => f.review?.review.id !== id && f.musicShare?.musicShare.id !== id,
                  );
                }
              "
            />

            <!-- Load more -->
            <div v-if="hasMore" class="flex justify-center pt-2">
              <button
                @click="loadMore"
                class="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-all"
                :disabled="loadingMore"
              >
                <Loader2 v-if="loadingMore" class="w-4 h-4 animate-spin" />
                {{ loadingMore ? "Carregando..." : "Ver mais" }}
              </button>
            </div>
          </div>
        </section>
      </div>
      
      <!-- Coluna Lateral Direita (Oculta no Mobile) -->
      <aside class="hidden lg:block w-[320px] flex-shrink-0 space-y-6 sticky top-24 self-start">
        <div>
          <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Da sua Listenlist</h3>
          
          <div v-if="listenListLoading && entries.length === 0" class="card p-6 flex justify-center">
            <Loader2 class="w-5 h-5 text-primary animate-spin" />
          </div>
          
          <div v-else-if="recommendedItem" @click="goToItem(recommendedItem)" class="card p-4 group cursor-pointer hover:border-primary/50 transition-colors relative">
            <div class="flex items-center gap-4">
              <AppImage 
                :src="getImage(recommendedItem) || undefined" 
                class="w-16 h-16 rounded-lg object-cover bg-[var(--color-surface-2)] flex-shrink-0" 
              />
              <div class="flex-1 min-w-0 pr-8">
                <h4 class="text-white font-semibold text-sm truncate group-hover:text-primary transition-colors">{{ getTitle(recommendedItem) }}</h4>
                <p class="text-xs text-muted truncate mt-0.5">{{ getSubtitle(recommendedItem) }}</p>
              </div>
            </div>
            
            <a 
              v-if="getSpotifyUrl(recommendedItem)"
              :href="getSpotifyUrl(recommendedItem)!"
              target="_blank"
              @click.stop
              class="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-[#1DB954] hover:bg-[#1DB954]/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Abrir no Spotify"
            >
              <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.66 12.9c.42.24.6.84.3 1.14zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </a>
          </div>
          
          <div v-else class="card p-6 flex flex-col items-center text-center gap-3">
            <div class="w-12 h-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
              <ListMusic class="w-5 h-5 text-muted" />
            </div>
            <div>
              <p class="text-white text-sm font-medium">Sua Listenlist está vazia</p>
              <p class="text-xs text-muted mt-1 leading-relaxed">Salve álbuns e músicas para ouvir depois e receba recomendações aqui.</p>
            </div>
            <router-link to="/search" class="mt-2 text-xs font-semibold text-primary hover:text-white transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20">
              <Plus class="w-3.5 h-3.5" /> Adicionar itens
            </router-link>
          </div>
        </div>
      </aside>

    </div>
  </div>
</template>
